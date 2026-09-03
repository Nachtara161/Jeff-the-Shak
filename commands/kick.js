const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the kick')),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: '❌ This user is not on the server.', ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({
        content: '❌ I cannot kick this user. Check that my role is above theirs.',
        ephemeral: true,
      });
    }

    await member.kick(reason);
    await interaction.reply(`👢 ${user.tag} has been kicked. Reason: ${reason}`);
  },
};
