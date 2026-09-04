const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../utils/logger');
const { addRecord } = require('../utils/modHistory');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning').setRequired(true)),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    // Versuchen, den Nutzer per DM zu informieren (falls DMs geschlossen sind, einfach weitermachen)
    await user
      .send(`⚠️ You have been warned in **${interaction.guild.name}**.\nReason: ${reason}`)
      .catch(() => {});

    await interaction.reply(`⚠️ ${user.tag} has been warned. Reason: ${reason}`);

    await addRecord({ userId: user.id, type: 'warn', moderatorId: interaction.user.id, reason });

    await sendLog(client, {
      title: '⚠️ Member Warned',
      color: 0xfee75c,
      fields: [
        { name: 'User', value: `${user.tag}`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        { name: 'Reason', value: reason },
      ],
    });
  },
};
