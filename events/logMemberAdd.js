const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member, client) {
    await sendLog(client, {
      title: '📥 Member Joined',
      description: `${member.user.tag} (${member})`,
      color: 0x57f287,
      fields: [
        {
          name: 'Account Created',
          value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
      ],
    });
  },
};
