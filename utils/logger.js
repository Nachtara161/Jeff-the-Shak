const { EmbedBuilder } = require('discord.js');
const { getLogConfig } = require('./dataStore');

// Schickt eine einheitlich gestaltete Log-Nachricht in den konfigurierten Log-Kanal.
// Falls kein Log-Kanal eingerichtet ist, passiert einfach nichts (kein Fehler).
async function sendLog(client, { title, description, color, fields }) {
  const config = await getLogConfig();
  if (!config.channelId) return;

  const channel = client.channels.cache.get(config.channelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color || 0x5865f2)
    .setTimestamp();

  if (description) embed.setDescription(description);
  if (fields && fields.length > 0) embed.addFields(fields);

  channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { sendLog };
