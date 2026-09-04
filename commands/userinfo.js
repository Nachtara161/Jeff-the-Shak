const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getRecordsForUser } = require('../utils/modHistory');

const EMOJI_BY_TYPE = {
  warn: '⚠️',
  kick: '👢',
  timeout: '🔇',
  ban: '🔨',
  verify: '✅',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show account info and moderation history for a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('user').setDescription('The user to look up').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle(`ℹ️ User Info — ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .setColor(0x5865f2)
      .addFields({
        name: 'Account Created',
        value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
        inline: true,
      });

    if (member) {
      const roles = member.roles.cache
        .filter(r => r.id !== interaction.guild.id)
        .map(r => r.toString())
        .join(', ');

      embed.addFields(
        {
          name: 'Joined Server',
          value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown',
          inline: true,
        },
        { name: 'Roles', value: roles || '*None*' }
      );
    } else {
      embed.addFields({ name: 'Status', value: '⚠️ Not currently on the server' });
    }

    const history = await getRecordsForUser(user.id);

    if (history.length === 0) {
      embed.addFields({ name: 'Moderation History', value: 'No actions recorded.' });
    } else {
      const shown = history.slice(0, 10);
      const lines = shown.map(r => {
        const emoji = EMOJI_BY_TYPE[r.type] || '•';
        return `${emoji} **${r.type.toUpperCase()}** by <@${r.moderatorId}> — <t:${Math.floor(r.timestamp / 1000)}:R>\n> ${r.reason}`;
      });

      embed.addFields({
        name: `Moderation History (${history.length} total${history.length > 10 ? ', showing latest 10' : ''})`,
        value: lines.join('\n\n').slice(0, 1024),
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
