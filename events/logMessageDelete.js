const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageDelete',
  once: false,
  async execute(message, client) {
    if (message.partial) return; // Inhalt der Nachricht ist nicht mehr verfügbar
    if (message.author?.bot) return;

    await sendLog(client, {
      title: '🗑️ Message Deleted',
      description: message.content ? message.content.slice(0, 1000) : '*No text content (e.g. only an image/embed)*',
      color: 0xed4245,
      fields: [
        { name: 'Author', value: `${message.author?.tag || 'Unknown'}`, inline: true },
        { name: 'Channel', value: `${message.channel}`, inline: true },
      ],
    });
  },
};
