const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Delete a number of recent messages in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(opt =>
      opt
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction, client) {
    const amount = interaction.options.getInteger('amount');
    await interaction.deferReply({ ephemeral: true });

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.editReply(`🧹 Deleted ${deleted.size} messages.`);

      await sendLog(client, {
        title: '🧹 Messages Cleared',
        color: 0x5865f2,
        fields: [
          { name: 'Channel', value: `${interaction.channel}`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Amount', value: `${deleted.size}`, inline: true },
        ],
      });
    } catch (err) {
      console.error('Fehler bei /clear:', err);
      await interaction.editReply(
        '❌ Could not delete messages. Note: Discord does not allow bulk-deleting messages older than 14 days.'
      );
    }
  },
};
