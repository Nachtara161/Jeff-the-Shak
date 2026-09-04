const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const { getTicketTypes, saveTicketTypes } = require('../utils/dataStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Manage ticket panels (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create a new ticket type and post its panel in this channel')
        .addStringOption(opt =>
          opt.setName('name').setDescription('Internal name, e.g. complaint (no spaces)').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('title').setDescription('Title shown on the panel').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('description').setDescription('Description shown on the panel').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('button_label').setDescription('Text on the button, e.g. "🎫 Create Ticket"').setRequired(true)
        )
        .addRoleOption(opt =>
          opt.setName('role').setDescription('Role that can see and handle these tickets').setRequired(true)
        )
    )
    .addSubcommand(sub => sub.setName('list').setDescription('List all configured ticket types'))
    .addSubcommand(sub =>
      sub
        .setName('delete')
        .setDescription('Delete a ticket type (already-open tickets stay untouched)')
        .addStringOption(opt =>
          opt.setName('name').setDescription('Internal name of the ticket type').setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const ticketTypes = await getTicketTypes();

    // --- /ticket-panel create ---
    if (sub === 'create') {
      const id = interaction.options.getString('name').toLowerCase().replace(/\s+/g, '-');
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const buttonLabel = interaction.options.getString('button_label');
      const role = interaction.options.getRole('role');

      if (ticketTypes.some(t => t.id === id)) {
        return interaction.reply({
          content: `❌ A ticket type named "${id}" already exists. Use \`/ticket-panel delete\` first if you want to replace it.`,
          ephemeral: true,
        });
      }

      ticketTypes.push({ id, title, description, buttonLabel, allowedRoleId: role.id });
      await saveTicketTypes(ticketTypes);

      const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(0x5865f2);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`create_ticket:${id}`).setLabel(buttonLabel).setStyle(ButtonStyle.Primary)
      );

      await interaction.channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Ticket type "${id}" created and panel posted here.`, ephemeral: true });
      return;
    }

    // --- /ticket-panel list ---
    if (sub === 'list') {
      if (ticketTypes.length === 0) {
        return interaction.reply({ content: 'No ticket types configured yet.', ephemeral: true });
      }
      const list = ticketTypes
        .map(t => `• **${t.id}** — handled by <@&${t.allowedRoleId}>`)
        .join('\n');
      await interaction.reply({ content: `**Configured ticket types:**\n${list}`, ephemeral: true });
      return;
    }

    // --- /ticket-panel delete ---
    if (sub === 'delete') {
      const id = interaction.options.getString('name').toLowerCase().replace(/\s+/g, '-');
      const filtered = ticketTypes.filter(t => t.id !== id);

      if (filtered.length === ticketTypes.length) {
        return interaction.reply({ content: `❌ No ticket type named "${id}" found.`, ephemeral: true });
      }

      await saveTicketTypes(filtered);
      await interaction.reply({
        content: `✅ Ticket type "${id}" deleted. Its panel button will no longer work.`,
        ephemeral: true,
      });
    }
  },
};
