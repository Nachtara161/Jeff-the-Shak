const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildMemberRemove',
  once: false,
  async execute(member, client) {
    await sendLog(client, {
      title: '📤 Member Left',
      description: `${member.user.tag}`,
      color: 0xed4245,
      fields: [
        {
          name: 'Joined Server',
          value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown',
          inline: true,
        },
        { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
      ],
    });
  },
};
