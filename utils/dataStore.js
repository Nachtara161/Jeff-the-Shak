// Diese Datei kümmert sich ums Lesen und Schreiben der "Notizen" des Bots
// (z.B. Ticket-Typen, Reaction Roles) - aber jetzt nicht mehr in lokalen
// JSON-Dateien, sondern dauerhaft in einer MongoDB-Datenbank. So bleiben
// die Daten erhalten, egal wie oft der Bot neu deployt wird.

const { MongoClient } = require('mongodb');

let client;
let db;

// Baut die Verbindung zur Datenbank auf (nur beim allerersten Aufruf,
// danach wird die bestehende Verbindung wiederverwendet).
async function connect() {
  if (db) return db;

  if (!process.env.MONGODB_URI) {
    throw new Error(
      'MONGODB_URI ist nicht gesetzt! Bitte in der .env (lokal) bzw. den Environment Variables (Render) eintragen.'
    );
  }

  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db('discordbot'); // Name der Datenbank - kann so bleiben
  console.log('✅ Mit MongoDB verbunden');
  return db;
}

// Jede "Sammlung" (collection) speichert genau EIN Dokument mit der ID "data",
// darin liegt der eigentliche Wert (Array oder Objekt) - dadurch bleibt die
// Handhabung fast identisch zu den früheren JSON-Dateien.
async function getValue(collectionName, fallback) {
  const database = await connect();
  const doc = await database.collection(collectionName).findOne({ _id: 'data' });
  return doc ? doc.value : fallback;
}

async function setValue(collectionName, value) {
  const database = await connect();
  await database
    .collection(collectionName)
    .updateOne({ _id: 'data' }, { $set: { value } }, { upsert: true });
}

module.exports = {
  getTicketTypes: () => getValue('ticketTypes', []),
  saveTicketTypes: data => setValue('ticketTypes', data),
  getReactionRoles: () => getValue('reactionRoles', []),
  saveReactionRoles: data => setValue('reactionRoles', data),
  getHoneypot: () => getValue('honeypot', {}),
  saveHoneypot: data => setValue('honeypot', data),
  getLogConfig: () => getValue('logConfig', {}),
  saveLogConfig: data => setValue('logConfig', data),
  getModHistory: () => getValue('modHistory', []),
  saveModHistory: data => setValue('modHistory', data),
};
