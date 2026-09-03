const { getReactionRoles } = require('../utils/dataStore');

module.exports = {
  name: 'messageReactionAdd',
  once: false,
  async execute(reaction, user) {
    if (user.bot) return;

    // Falls die Nachricht/Reaktion nicht vollständig im Cache liegt, nachladen
    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();
    } catch (err) {
      console.error('Konnte Reaction nicht laden:', err);
      return;
    }

    const reactionRoles = getReactionRoles();
    const emojiString = reaction.emoji.toString(); // z.B. "🎮" oder "<:name:id>"

    const match = reactionRoles.find(
      r =>
        r.messageId === reaction.message.id &&
        (r.emoji === emojiString || r.emoji === reaction.emoji.name)
    );
    if (!match) return;

    try {
      const member = await reaction.message.guild.members.fetch(user.id);
      await member.roles.add(match.roleId);
    } catch (err) {
      console.error('Fehler beim Vergeben der Reaction-Role:', err);
    }
  },
};
