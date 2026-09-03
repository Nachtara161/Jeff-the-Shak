const {
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const { getTicketTypes } = require('../utils/dataStore');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    // ============================================
    // 1) SLASH-BEFEHLE (z.B. /verify, /ticket-panel, /kick, ...)
    // ============================================
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`Fehler beim Ausführen von /${interaction.commandName}:`, err);
        const errorReply = {
          content: '❌ Something went wrong while running this command.',
          ephemeral: true,
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorReply);
        } else {
          await interaction.reply(errorReply);
        }
      }
      return;
    }

    // ============================================
    // 2) BUTTONS
    // ============================================
    if (!interaction.isButton()) return;

    // --- Ticket erstellen: customId sieht aus wie "create_ticket:verify" ---
    if (interaction.customId.startsWith('create_ticket:')) {
      const typeId = interaction.customId.split(':')[1];
      const ticketTypes = getTicketTypes();
      const type = ticketTypes.find(t => t.id === typeId);

      await interaction.deferReply({ ephemeral: true });

      if (!type) {
        return interaction.editReply(
          '❌ This ticket type no longer exists. Please contact an admin.'
        );
      }

      // Prüfen, ob der Nutzer für DIESEN Ticket-Typ schon ein offenes Ticket hat
      const existing = interaction.guild.channels.cache.find(
        ch => ch.topic === `ticket-owner:${interaction.user.id}:type:${typeId}`
      );
      if (existing) {
        return interaction.editReply(`❗ You already have an open ticket of this type: ${existing}`);
      }

      const overwrites = [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: type.allowedRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ];

      const channelOptions = {
        name: `${typeId}-${interaction.user.username}`.slice(0, 90),
        type: ChannelType.GuildText,
        topic: `ticket-owner:${interaction.user.id}:type:${typeId}`,
        permissionOverwrites: overwrites,
      };

      // Ticket landet automatisch in der gleichen Kategorie wie der Kanal,
      // in dem der Panel-Button gepostet wurde.
      if (interaction.channel.parentId) {
        channelOptions.parent = interaction.channel.parentId;
      }

      try {
        const ticketChannel = await interaction.guild.channels.create(channelOptions);

        const embed = new EmbedBuilder()
          .setTitle(`🎫 ${type.title}`)
          .setDescription(
            `Hi ${interaction.user}, a member of <@&${type.allowedRoleId}> will be with you shortly.`
          )
          .setColor(0x5865f2);

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('🔒 Close Ticket')
            .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({
          content: `${interaction.user}`,
          embeds: [embed],
          components: [closeRow],
        });

        await interaction.editReply(`✅ Your ticket has been created: ${ticketChannel}`);
      } catch (err) {
        console.error('Fehler beim Erstellen des Tickets:', err);
        await interaction.editReply(
          '❌ Something went wrong while creating your ticket. Please let an admin know.'
        );
      }
      return;
    }

    // --- Ticket schließen ---
    if (interaction.customId === 'close_ticket') {
      const topic = interaction.channel.topic || '';
      const match = topic.match(/^ticket-owner:(\d+):type:(.+)$/);
      const ownerId = match ? match[1] : null;
      const typeId = match ? match[2] : null;

      const ticketTypes = getTicketTypes();
      const type = ticketTypes.find(t => t.id === typeId);

      const isOwner = ownerId === interaction.user.id;
      const isAllowedRole = type && interaction.member.roles.cache.has(type.allowedRoleId);
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

      if (!isOwner && !isAllowedRole && !isAdmin) {
        return interaction.reply({ content: '❌ You are not allowed to close this ticket.', ephemeral: true });
      }

      await interaction.reply('🔒 This ticket will be closed in 5 seconds...');
      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
    }
  },
};
