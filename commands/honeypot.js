const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getHoneypot, saveHoneypot } = require('../utils/dataStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('honeypot')
    .setDescription('Manage the anti-raid honeypot channel (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create a new honeypot channel')
        .addStringOption(opt =>
          opt.setName('name').setDescription('Channel name (default: verify-here)')
        )
    )
    .addSubcommand(sub =>
      sub.setName('disable').setDescription('Disable the honeypot (channel stays, enforcement stops)')
    )
    .addSubcommand(sub => sub.setName('status').setDescription('Show current honeypot status')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // --- /honeypot create ---
    if (sub === 'create') {
      const name = interaction.options.getString('name') || 'verify-here';

      const channel = await interaction.guild.channels.create({
        name,
        type: ChannelType.GuildText,
        topic: '⚠️ Do not post here. This channel is monitored.',
      });

      saveHoneypot({ channelId: channel.id });

      await channel.send(
        '⚠️ This channel is monitored for automated verification bypass attempts. Do not send messages here — use the ticket system instead.'
      );

      await interaction.reply({
        content: `✅ Honeypot channel created: ${channel}. Anyone (except bots) who sends a message there will be automatically banned.`,
        ephemeral: true,
      });
      return;
    }

    // --- /honeypot disable ---
    if (sub === 'disable') {
      saveHoneypot({});
      await interaction.reply({ content: '✅ Honeypot disabled. The channel itself was not deleted.', ephemeral: true });
      return;
    }

    // --- /honeypot status ---
    if (sub === 'status') {
      const honeypot = getHoneypot();
      if (!honeypot.channelId) {
        return interaction.reply({ content: 'No honeypot is currently active.', ephemeral: true });
      }
      await interaction.reply({ content: `🍯 Honeypot is active in <#${honeypot.channelId}>.`, ephemeral: true });
    }
  },
};
