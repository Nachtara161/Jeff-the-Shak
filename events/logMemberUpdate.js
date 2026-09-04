const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildMemberUpdate',
  once: false,
  async execute(oldMember, newMember, client) {
    // --- Rollenänderungen ---
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const addedRoles = newRoles.filter(r => !oldRoles.has(r.id));
    const removedRoles = oldRoles.filter(r => !newRoles.has(r.id));

    if (addedRoles.size > 0 || removedRoles.size > 0) {
      const fields = [];
      if (addedRoles.size > 0) {
        fields.push({ name: '➕ Added', value: addedRoles.map(r => r.name).join(', ') });
      }
      if (removedRoles.size > 0) {
        fields.push({ name: '➖ Removed', value: removedRoles.map(r => r.name).join(', ') });
      }

      await sendLog(client, {
        title: '🎭 Roles Updated',
        description: `${newMember.user.tag}`,
        color: 0x5865f2,
        fields,
      });
    }

    // --- Nickname-Änderung ---
    if (oldMember.nickname !== newMember.nickname) {
      await sendLog(client, {
        title: '📛 Nickname Changed',
        color: 0x5865f2,
        fields: [
          { name: 'User', value: `${newMember.user.tag}` },
          { name: 'Before', value: oldMember.nickname || '*none*', inline: true },
          { name: 'After', value: newMember.nickname || '*none*', inline: true },
        ],
      });
    }
  },
};
