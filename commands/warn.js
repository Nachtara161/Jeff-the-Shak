const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    // Versuchen, den Nutzer per DM zu informieren (falls DMs geschlossen sind, einfach weitermachen)
    await user
      .send(`⚠️ You have been warned in **${interaction.guild.name}**.\nReason: ${reason}`)
      .catch(() => {});

    await interaction.reply(`⚠️ ${user.tag} has been warned. Reason: ${reason}`);
  },
};
