const { getHoneypot } = require('../utils/dataStore');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return; // DMs ignorieren

    const honeypot = await getHoneypot();
    if (!honeypot.channelId) return;
    if (message.channel.id !== honeypot.channelId) return;

    console.log(`🍯 Honeypot ausgelöst von ${message.author.tag} (${message.author.id})`);

    // Nachricht sofort löschen, damit Spam/Links nicht sichtbar bleiben
    await message.delete().catch(() => {});

    try {
      const member = message.member;
      if (member && member.bannable) {
        await member.ban({ reason: 'Honeypot triggered (posted in monitored trap channel)' });
        console.log(`   → ${message.author.tag} wurde automatisch gebannt.`);

        await sendLog(client, {
          title: '🍯 Honeypot Triggered',
          color: 0xed4245,
          fields: [
            { name: 'User', value: `${message.author.tag}`, inline: true },
            { name: 'Channel', value: `${message.channel}`, inline: true },
            { name: 'Action', value: 'Automatically banned' },
          ],
        });
      } else {
        console.warn(`   ⚠️ Konnte ${message.author.tag} nicht bannen (Rollen-Reihenfolge prüfen).`);
      }
    } catch (err) {
      console.error('Fehler beim automatischen Honeypot-Bann:', err);
    }
  },
};
