// GANZ OBEN: Der Mini-Webserver, den Render braucht, um zu erkennen,
// dass der Dienst läuft (Render ist als "Web Service" eingerichtet,
// der einen offenen Port erwartet).
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('Bot ist online und läuft 24/7!');
});
app.listen(PORT, () => {
  console.log(`🌐 Mini-Webserver läuft auf Port ${PORT}`);
});

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

const { Client, GatewayIntentBits, Partials, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Der Client ist unser "Bot-Objekt". Die Intents legen fest,
// über welche Ereignisse Discord uns überhaupt informiert.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,       // nötig für Autorolle & Willkommensnachricht
    GatewayIntentBits.GuildMessages,      // nötig für Moderation
    GatewayIntentBits.MessageContent,     // nötig um Nachrichteninhalte zu lesen
    GatewayIntentBits.GuildMessageReactions, // nötig für Reaction Roles
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  presence: {
    status: 'online',
    activities: [{ name: 'schützt den Server 24/7', type: ActivityType.Custom, state: 'schützt den Server 24/7' }],
  },
});

// Config (IDs, Texte) laden
client.config = require('./config.json');

// --- Slash-Befehle laden (aus dem "commands" Ordner) ---
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
  }
}

// Alle Dateien im "events" Ordner automatisch laden
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

// Mit dem Bot-Token bei Discord einloggen
client
  .login(process.env.DISCORD_TOKEN)
  .catch(err => console.error('🔴 LOGIN FEHLGESCHLAGEN:', err));
