/// Diese Datei kümmert sich ums Lesen und Schreiben der kleinen JSON-Dateien
// im "data" Ordner (dort speichert der Bot z.B. konfigurierte Ticket-Typen
// und Reaction Roles - ganz ohne eigene Datenbank).

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

function readJson(fileName, fallback) {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Fehler beim Lesen von ${fileName}:`, err);
    return fallback;
  }
}

function writeJson(fileName, data) {
  const filePath = path.join(dataDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  getTicketTypes: () => readJson('ticket-types.json', []),
  saveTicketTypes: data => writeJson('ticket-types.json', data),
  getReactionRoles: () => readJson('reaction-roles.json', []),
  saveReactionRoles: data => writeJson('reaction-roles.json', data),
  
  // 🍯 Hier sind die neuen Funktionen für deinen Honeypot:
  getHoneypot: () => readJson('honeypot.json', { channelId: null }),
  saveHoneypot: data => writeJson('honeypot.json', data)
};
