const { getModHistory, saveModHistory } = require('./dataStore');

// Fügt einen Eintrag zur Moderations-Historie hinzu.
// type: 'warn' | 'kick' | 'timeout' | 'ban' | 'verify'
async function addRecord({ userId, type, moderatorId, reason }) {
  const history = await getModHistory();
  history.push({
    userId,
    type,
    moderatorId,
    reason: reason || 'No reason provided',
    timestamp: Date.now(),
  });
  await saveModHistory(history);
}

// Gibt alle Einträge für einen bestimmten Nutzer zurück, neueste zuerst.
async function getRecordsForUser(userId) {
  const history = await getModHistory();
  return history.filter(r => r.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
}

module.exports = { addRecord, getRecordsForUser };
