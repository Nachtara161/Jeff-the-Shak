// Dieses Skript musst du NUR EINMAL ausführen, um deine bisherigen
// data/*.json Dateien (z.B. deine 2 Ticket-Typen) in die neue MongoDB-
// Datenbank zu übertragen. Danach kannst du diese Datei sogar löschen.
//
// WICHTIG: Führe das lokal aus (npm run migrate), NICHT auf Render -
// stelle sicher, dass deine lokalen data/*.json Dateien den Stand haben,
// den du übernehmen willst (z.B. die Version, die auch auf GitHub liegt).

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  saveTicketTypes,
  saveReactionRoles,
  saveHoneypot,
  saveLogConfig,
  saveModHistory,
} = require('./utils/dataStore');

const dataDir = path.join(__dirname, 'data');

function readIfExists(fileName, fallback) {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`ℹ️ ${fileName} nicht gefunden, überspringe (nutze Standardwert).`);
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

(async () => {
  try {
    console.log('🔄 Starte Migration zu MongoDB...');

    const ticketTypes = readIfExists('ticket-types.json', []);
    await saveTicketTypes(ticketTypes);
    console.log(`✅ ${ticketTypes.length} Ticket-Typ(en) übertragen.`);

    const reactionRoles = readIfExists('reaction-roles.json', []);
    await saveReactionRoles(reactionRoles);
    console.log(`✅ ${reactionRoles.length} Reaction-Role(s) übertragen.`);

    const honeypot = readIfExists('honeypot.json', {});
    await saveHoneypot(honeypot);
    console.log('✅ Honeypot-Konfiguration übertragen.');

    const logConfig = readIfExists('logs.json', {});
    await saveLogConfig(logConfig);
    console.log('✅ Log-Konfiguration übertragen.');

    const modHistory = readIfExists('mod-history.json', []);
    await saveModHistory(modHistory);
    console.log(`✅ ${modHistory.length} Moderations-Eintrag/Einträge übertragen.`);

    console.log('🎉 Migration abgeschlossen! Du kannst jetzt "npm start" ausführen.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fehler bei der Migration:', err);
    process.exit(1);
  }
})();
