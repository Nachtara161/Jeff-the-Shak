const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageUpdate',
  once: false,
  async execute(oldMessage, newMessage, client) {
    if (oldMessage.partial || newMessage.partial) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // z.B. nur ein Link-Preview kam dazu, kein echter Text-Edit

    await sendLog(client, {
      title: '✏️ Message Edited',
      color: 0xfee75c,
      fields: [
        { name: 'Author', value: `${newMessage.author?.tag || 'Unknown'}`, inline: true },
        { name: 'Channel', value: `${newMessage.channel}`, inline: true },
        { name: 'Before', value: oldMessage.content ? oldMessage.content.slice(0, 500) : '*empty*' },
        { name: 'After', value: newMessage.content ? newMessage.content.slice(0, 500) : '*empty*' },
      ],
    });
  },
};
