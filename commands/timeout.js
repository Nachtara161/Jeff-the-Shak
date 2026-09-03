const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Wandelt Text wie "10m", "1h" oder "1d" in Millisekunden um
function parseDuration(input) {
  const match = input.match(/^(\d+)\s*(s|m|h|d)$/i);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

  return value * multipliers[unit];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Temporarily mute a member (Discord timeout)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('user').setDescription('User to timeout').setRequired(true))
    .addStringOption(opt =>
      opt.setName('duration').setDescription('e.g. 10m, 1h, 1d (max 28d)').setRequired(true)
    )
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the timeout')),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const durationInput = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const durationMs = parseDuration(durationInput);
    if (!durationMs) {
      return interaction.reply({
        content: '❌ Invalid duration format. Use something like `10m`, `1h`, or `1d`.',
        ephemeral: true,
      });
    }

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: '❌ This user is not on the server.', ephemeral: true });
    }

    try {
      await member.timeout(durationMs, reason);
      await interaction.reply(`🔇 ${user.tag} has been timed out for ${durationInput}. Reason: ${reason}`);
    } catch (err) {
      console.error('Fehler bei /timeout:', err);
      await interaction.reply({
        content: '❌ Something went wrong while timing out this user. Check that my role is above theirs.',
        ephemeral: true,
      });
    }
  },
};
