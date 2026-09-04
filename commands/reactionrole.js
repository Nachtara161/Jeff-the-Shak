const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getReactionRoles, saveReactionRoles } = require('../utils/dataStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Manage reaction roles (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('panel')
        .setDescription('Post a new message to attach reaction roles to')
        .addStringOption(opt => opt.setName('title').setDescription('Title of the message').setRequired(true))
        .addStringOption(opt =>
          opt.setName('description').setDescription('Description of the message').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Link an emoji reaction on a message to a role')
        .addStringOption(opt =>
          opt.setName('message_id').setDescription('ID of the message to react to').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('emoji').setDescription('Emoji to react with, e.g. 🎮').setRequired(true)
        )
        .addRoleOption(opt => opt.setName('role').setDescription('Role to give/remove').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a reaction role link')
        .addStringOption(opt => opt.setName('message_id').setDescription('ID of the message').setRequired(true))
        .addStringOption(opt => opt.setName('emoji').setDescription('Emoji that was linked').setRequired(true))
    )
    .addSubcommand(sub => sub.setName('list').setDescription('List all configured reaction roles')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const reactionRoles = await getReactionRoles();

    // --- /reactionrole panel ---
    if (sub === 'panel') {
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(0x5865f2);

      const msg = await interaction.channel.send({ embeds: [embed] });

      await interaction.reply({
        content: `✅ Panel posted. Message ID: \`${msg.id}\`\nNow use \`/reactionrole add\` (in this same channel) with this message ID to link emojis to roles.`,
        ephemeral: true,
      });
      return;
    }

    // --- /reactionrole add ---
    if (sub === 'add') {
      const messageId = interaction.options.getString('message_id');
      const emoji = interaction.options.getString('emoji');
      const role = interaction.options.getRole('role');

      const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
      if (!message) {
        return interaction.reply({
          content: '❌ Message not found. Make sure you run this command in the SAME channel as the message, and that the message ID is correct.',
          ephemeral: true,
        });
      }

      try {
        await message.react(emoji);
      } catch (err) {
        return interaction.reply({
          content: '❌ Could not react with that emoji. Make sure it is a valid emoji the bot has access to.',
          ephemeral: true,
        });
      }

      reactionRoles.push({ messageId, emoji, roleId: role.id });
      await saveReactionRoles(reactionRoles);

      await interaction.reply({
        content: `✅ Reacting with ${emoji} on that message now gives the ${role} role.`,
        ephemeral: true,
      });
      return;
    }

    // --- /reactionrole remove ---
    if (sub === 'remove') {
      const messageId = interaction.options.getString('message_id');
      const emoji = interaction.options.getString('emoji');

      const filtered = reactionRoles.filter(r => !(r.messageId === messageId && r.emoji === emoji));
      if (filtered.length === reactionRoles.length) {
        return interaction.reply({ content: '❌ No matching reaction role found.', ephemeral: true });
      }

      await saveReactionRoles(filtered);
      await interaction.reply({ content: '✅ Reaction role removed.', ephemeral: true });
      return;
    }

    // --- /reactionrole list ---
    if (sub === 'list') {
      if (reactionRoles.length === 0) {
        return interaction.reply({ content: 'No reaction roles configured yet.', ephemeral: true });
      }
      const list = reactionRoles
        .map(r => `• ${r.emoji} → <@&${r.roleId}> (message \`${r.messageId}\`)`)
        .join('\n');
      await interaction.reply({ content: `**Configured reaction roles:**\n${list}`, ephemeral: true });
    }
  },
};
