const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../utils/logger');
const { addRecord } = require('../utils/modHistory');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban')),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member && !member.bannable) {
      return interaction.reply({
        content: '❌ I cannot ban this user. Check that my role is above theirs.',
        ephemeral: true,
      });
    }

    try {
      await interaction.guild.members.ban(user.id, { reason });
      await interaction.reply(`🔨 ${user.tag} has been banned. Reason: ${reason}`);

      await addRecord({ userId: user.id, type: 'ban', moderatorId: interaction.user.id, reason });

      await sendLog(client, {
        title: '🔨 Member Banned',
        color: 0xed4245,
        fields: [
          { name: 'User', value: `${user.tag}`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason },
        ],
      });
    } catch (err) {
      console.error('Fehler bei /ban:', err);
      await interaction.reply({ content: '❌ Something went wrong while banning this user.', ephemeral: true });
    }
  },
};
