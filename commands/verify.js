const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verifies a user and grants them access to the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to verify')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const config = client.config;
    const executingMember = interaction.member;

    // --- Berechtigungsprüfung: nur Staff (oder Admin) darf verifizieren ---
    const isStaff =
      config.staffRoleId &&
      config.staffRoleId !== 'HIER_STAFF_ROLLEN_ID' &&
      executingMember.roles.cache.has(config.staffRoleId);
    const isAdmin = executingMember.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff && !isAdmin) {
      return interaction.reply({
        content: "❌ You don't have permission to use this command.",
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('user');
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return interaction.reply({
        content: '❌ This user could not be found on the server.',
        ephemeral: true,
      });
    }

    // --- Rollen tauschen ---
    try {
      if (config.unverifiedRoleId && config.unverifiedRoleId !== 'HIER_UNVERIFIED_ROLLEN_ID') {
        await targetMember.roles.remove(config.unverifiedRoleId).catch(() => {});
      }
      if (config.memberRoleId && config.memberRoleId !== 'HIER_MEMBER_ROLLEN_ID') {
        await targetMember.roles.add(config.memberRoleId);
      }
    } catch (err) {
      console.error('Fehler bei /verify:', err);
      return interaction.reply({
        content: '❌ Something went wrong while verifying this user. Check the role IDs in config.json and make sure the bot role is above the affected roles.',
        ephemeral: true,
      });
    }

    await interaction.reply(`✅ ${targetUser} has been verified and now has access to the server!`);

    // --- Falls im Verify-Ticket-Kanal ausgeführt: Ticket automatisch schließen ---
    const topic = interaction.channel.topic || '';
    const match = topic.match(/^ticket-owner:(\d+):type:(.+)$/);
    if (match && match[1] === targetUser.id && match[2] === 'verify') {
      await interaction.channel.send('🔒 This ticket will be closed automatically in 5 seconds...');
      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
    }
  },
};
