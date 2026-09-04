const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getLogConfig, saveLogConfig } = require('../utils/dataStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Manage the server log channel (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('setup')
        .setDescription('Set which channel logs get sent to')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('The channel logs should be sent to')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub => sub.setName('disable').setDescription('Stop sending logs'))
    .addSubcommand(sub => sub.setName('status').setDescription('Show current log channel')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');
      await saveLogConfig({ channelId: channel.id });
      await interaction.reply({ content: `✅ Logs will now be sent to ${channel}.`, ephemeral: true });
      return;
    }

    if (sub === 'disable') {
      await saveLogConfig({});
      await interaction.reply({ content: '✅ Logging disabled.', ephemeral: true });
      return;
    }

    if (sub === 'status') {
      const config = await getLogConfig();
      if (!config.channelId) {
        return interaction.reply({ content: 'No log channel is currently set.', ephemeral: true });
      }
      await interaction.reply({ content: `📋 Logs are currently sent to <#${config.channelId}>.`, ephemeral: true });
    }
  },
};
