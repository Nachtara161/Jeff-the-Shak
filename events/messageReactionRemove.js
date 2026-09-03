const { getReactionRoles } = require('../utils/dataStore');

module.exports = {
  name: 'messageReactionRemove',
  once: false,
  async execute(reaction, user) {
    if (user.bot) return;

    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();
    } catch (err) {
      console.error('Konnte Reaction nicht laden:', err);
      return;
    }

    const reactionRoles = getReactionRoles();
    const emojiString = reaction.emoji.toString();

    const match = reactionRoles.find(
      r =>
        r.messageId === reaction.message.id &&
        (r.emoji === emojiString || r.emoji === reaction.emoji.name)
    );
    if (!match) return;

    try {
      const member = await reaction.message.guild.members.fetch(user.id);
      await member.roles.remove(match.roleId);
    } catch (err) {
      console.error('Fehler beim Entfernen der Reaction-Role:', err);
    }
  },
};
