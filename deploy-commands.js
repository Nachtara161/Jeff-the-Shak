// Dieses Skript sagt Discord, welche Slash-Befehle (/verify, /ticket-setup, ...)
// dein Bot hat. Du musst es NUR ausführen, wenn du einen neuen Befehl
// hinzugefügt oder einen bestehenden verändert hast.

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🔄 Registriere ${commands.length} Slash-Befehl(e)...`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Slash-Befehle erfolgreich registriert! (kann bis zu ein paar Minuten dauern, bis sie in Discord auftauchen)');
  } catch (error) {
    console.error('❌ Fehler beim Registrieren der Slash-Befehle:', error);
  }
})();
