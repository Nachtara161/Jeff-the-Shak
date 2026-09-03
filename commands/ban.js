const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban')),

  async execute(interaction) {
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
    } catch (err) {
      console.error('Fehler bei /ban:', err);
      await interaction.reply({ content: '❌ Something went wrong while banning this user.', ephemeral: true });
    }
  },
};
