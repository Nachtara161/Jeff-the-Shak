// Lädt die Werte aus der .env Datei (z.B. den Bot-Token) - lokal nötig,
// auf Render ignoriert, da die Werte dort direkt als Environment-Variablen kommen.
require('dotenv').config();

// Fängt alle sonst "stillen" Fehler ab und druckt sie sichtbar ins Log.
process.on('unhandledRejection', (reason) => {
  console.error('🔴 UNHANDLED REJECTION:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🔴 UNCAUGHT EXCEPTION:', err);
});

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { Client, GatewayIntentBits, Partials, Collection, ActivityType, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
// PUBLIC_URL ist die Adresse, unter der die Website erreichbar ist.
// Auf Render trägst du hier deine echte Render-URL ein (siehe .env.example).
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
const DISCORD_API = 'https://discord.com/api/v10';

// ============================================
// DISCORD BOT CLIENT
// ============================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  presence: {
    status: 'online',
    activities: [{ name: 'schützt den Server 24/7', type: ActivityType.Custom, state: 'schützt den Server 24/7' }],
  },
});

client.config = require('./config.json');

// --- Slash-Befehle laden ---
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
  }
}

// --- Events laden ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// ============================================
// WEB-DASHBOARD (Express)
// ============================================
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Render sitzt als "Reverse Proxy" davor - das hier sagt Express, dass es
// dem Proxy vertrauen soll (wichtig für sichere Cookies/HTTPS-Erkennung).
app.set('trust proxy', 1);

const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI,
  dbName: 'discordbot',
  collectionName: 'sessions',
});
sessionStore.on('error', err => {
  console.error('🔴 Session-Store Fehler:', err);
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'bitte-in-env-aendern',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 Tage eingeloggt bleiben
      secure: PUBLIC_URL.startsWith('https'),
      sameSite: 'lax',
    },
  })
);

// Startseite: Login-Button (oder Weiterleitung zum Dashboard, falls schon eingeloggt)
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login');
});

// Schritt 1: Nutzer zu Discord schicken, um sich einzuloggen
app.get('/auth/discord', (req, res) => {
  const redirectUri = encodeURIComponent(`${PUBLIC_URL}/auth/discord/callback`);
  const scope = encodeURIComponent('identify guilds');
  const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  res.redirect(url);
});

// Schritt 2: Discord schickt den Nutzer hierher zurück, mit einem "code"
app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect('/');

  try {
    // Den "code" gegen einen echten Zugriffs-Token eintauschen
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${PUBLIC_URL}/auth/discord/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error('Kein Access Token erhalten: ' + JSON.stringify(tokenData));
    }

    // Mit dem Token: wer bin ich? Auf welchen Servern bin ich?
    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const guilds = await guildsRes.json();

    req.session.user = { id: user.id, username: user.username, avatar: user.avatar };
    req.session.guilds = guilds;

    // Explizit warten, bis die Session WIRKLICH gespeichert ist, bevor wir
    // weiterleiten - sonst kann es passieren, dass die Weiterleitung schneller
    // ist als das Speichern und der Nutzer "ausgeloggt" ankommt.
    req.session.save(err => {
      if (err) {
        console.error('🔴 Fehler beim Speichern der Session:', err);
        return res.status(500).send('Login fehlgeschlagen (Session konnte nicht gespeichert werden).');
      }
      console.log(`🔎 Login erfolgreich: ${user.username} (${guilds.length} Server gefunden)`);
      res.redirect('/dashboard');
    });
  } catch (err) {
    console.error('🔴 OAuth Fehler:', err);
    res.status(500).send('Login fehlgeschlagen. Bitte geh zurück und versuch es erneut.');
  }
});

// Übersicht: alle Server, auf denen der Nutzer Admin-Rechte hat
app.get('/dashboard', (req, res) => {
  console.log('🔎 /dashboard aufgerufen. Eingeloggt?', !!req.session.user);
  if (!req.session.user) return res.redirect('/');

  const managedGuilds = (req.session.guilds || []).filter(g => {
    const perms = BigInt(g.permissions || 0);
    const manageGuild = BigInt(PermissionsBitField.Flags.ManageGuild);
    return g.owner || (perms & manageGuild) === manageGuild;
  });

  const guildsWithBotStatus = managedGuilds.map(g => ({
    ...g,
    botPresent: client.guilds.cache.has(g.id),
  }));

  res.render('dashboard', { user: req.session.user, guilds: guildsWithBotStatus });
});

// Platzhalter-Seite für die Einstellungen eines einzelnen Servers (kommt in Etappe 2)
app.get('/dashboard/:guildId', (req, res) => {
  if (!req.session.user) return res.redirect('/');

  const guild = (req.session.guilds || []).find(g => g.id === req.params.guildId);
  if (!guild) return res.status(403).send('Kein Zugriff auf diesen Server.');

  res.render('guild-placeholder', { guildName: guild.name });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.listen(PORT, () => {
  console.log(`🌐 Dashboard läuft auf Port ${PORT} (${PUBLIC_URL})`);
});

// ============================================
// BOT-LOGIN
// ============================================
client
  .login(process.env.DISCORD_TOKEN)
  .catch(err => console.error('🔴 LOGIN FEHLGESCHLAGEN:', err));
