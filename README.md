# Mein Discord Bot – Erste Schritte

## 1. Projekt öffnen
Entpacke den Ordner und öffne ihn in Visual Studio Code (`Datei` → `Ordner öffnen`).

## 2. Abhängigkeiten installieren
Öffne das Terminal in VS Code (`Terminal` → `Neues Terminal`) und führe aus:

```
npm install
```

Das lädt discord.js und dotenv herunter (Ordner `node_modules`).

## 3. Token eintragen
1. Kopiere `.env.example` und benenne die Kopie in `.env` um.
2. Öffne `.env` und trage hinter `DISCORD_TOKEN=` deinen echten Bot-Token ein.
   Die `.env` wird durch `.gitignore` automatisch von Git ausgeschlossen – dein
   Token bleibt also privat.

## 4. IDs eintragen (config.json)
Damit Autorolle & Willkommensnachricht funktionieren, brauchst du zwei IDs:

- **Rollen-ID**: Rechtsklick auf eine Rolle in den Servereinstellungen → "ID kopieren"
  (Entwicklermodus muss aktiv sein: Discord-Einstellungen → Erweitert → Entwicklermodus)
- **Kanal-ID**: Rechtsklick auf den Willkommens-Kanal → "ID kopieren"

Trage beide IDs in `config.json` ein, z.B.:

```json
{
  "autoRoleId": "123456789012345678",
  "welcomeChannelId": "987654321098765432",
  "welcomeMessage": "Willkommen {user} auf **{server}**! Ihr seid jetzt {membercount} Mitglieder."
}
```

Verfügbare Platzhalter in `welcomeMessage`: `{user}`, `{server}`, `{membercount}`

## 5. Bot starten

```
npm start
```

Im Terminal sollte erscheinen: `✅ Eingeloggt als DeinBotName#0000`

Jetzt kannst du testen, indem du z.B. mit einem Zweitaccount dem Server beitrittst.

## Struktur des Projekts

```
discord-bot/
├── index.js          <- Startpunkt, lädt Events automatisch
├── config.json        <- Deine Einstellungen (IDs, Texte)
├── .env                <- Dein geheimer Token (nicht teilen!)
├── events/
│   ├── ready.js               <- Meldung wenn Bot online ist
│   └── guildMemberAdd.js      <- Autorolle + Willkommensnachricht
└── commands/           <- hier kommen später z.B. Moderationsbefehle rein
```

## Nächste Schritte
Sag einfach Bescheid, was als Nächstes dran sein soll oder erweitert werden soll.

## Verifikation & Tickets über /ticket-panel

Das Ticket-System ist komplett über Slash-Befehle steuerbar, du musst nichts mehr in `config.json` eintragen. Du kannst beliebig viele Ticket-Typen anlegen (z.B. Verify, Complaint, Mental Support), jeder mit eigener Rolle, die ihn bearbeiten darf.

### Einmalig: Slash-Befehle registrieren
Nach jeder Änderung an Befehlen (z.B. jetzt, wo viele neue dazugekommen sind):
```
npm run deploy
```

### Ticket-Typ anlegen
Führe im gewünschten Kanal aus (z.B. deinem #verify-Kanal):
```
/ticket-panel create name:verify title:"Verification" description:"Click below to get verified!" button_label:"🎫 Create Ticket" role:@Staff
```
Für weitere Typen einfach den Befehl erneut mit anderem `name` und `role` ausführen, z.B.:
```
/ticket-panel create name:complaint title:"Complaint" description:"Report an issue with another member." button_label:"📢 Report Complaint" role:@Staff
/ticket-panel create name:support title:"Mental Health Support" description:"Talk to our support team privately." button_label:"💙 Get Support" role:@Support
```

Jeder Befehl postet sofort eine Panel-Nachricht mit Button im aktuellen Kanal. Ein Nutzer, der klickt, bekommt einen privaten Kanal, sichtbar nur für sich selbst + die angegebene Rolle. Das Ticket landet automatisch in der gleichen Kategorie wie der Kanal, in dem der Button gepostet ist.

Weitere Befehle:
- `/ticket-panel list` – zeigt alle konfigurierten Typen
- `/ticket-panel delete name:<name>` – löscht einen Typ (bereits offene Tickets bleiben bestehen)

### Verifizieren
Wie bisher: `/verify @user` (nur nutzbar von der in `config.json` unter `staffRoleId` eingetragenen Rolle oder Admins). Wird der Befehl in einem **Verify**-Ticket ausgeführt, schließt sich das Ticket automatisch.

## Reaction Roles

1. Eine Nachricht posten, an die Reaktionen angehängt werden sollen:
   ```
   /reactionrole panel title:"Choose your roles" description:"React below to get a role!"
   ```
   Die Antwort zeigt dir die **Message ID** – die brauchst du im nächsten Schritt.

2. Emoji mit einer Rolle verknüpfen (im **gleichen Kanal** wie die Panel-Nachricht ausführen):
   ```
   /reactionrole add message_id:123456789012345678 emoji:🎮 role:@Gamer
   ```
   Der Bot reagiert dann selbst schon mit diesem Emoji auf die Nachricht – Nutzer klicken einfach drauf.

3. Weitere Befehle: `/reactionrole list`, `/reactionrole remove message_id:... emoji:...`

## Moderation

Alle Befehle sind standardmäßig nur für Nutzer mit der passenden Discord-Berechtigung sichtbar (kann ein Admin in Server-Einstellungen → Integrationen anpassen):

- `/kick user:@X reason:...` (braucht "Mitglieder rauswerfen")
- `/ban user:@X reason:...` (braucht "Mitglieder bannen")
- `/timeout user:@X duration:10m reason:...` (braucht "Mitglieder moderieren"; Format: `10m`, `1h`, `1d`, max. 28 Tage)
- `/warn user:@X reason:...` (braucht "Mitglieder moderieren"; schickt dem Nutzer eine DM)
- `/clear amount:20` (braucht "Nachrichten verwalten"; löscht nur Nachrichten, die jünger als 14 Tage sind)

## Honeypot (Anti-Raid)

Ein Honeypot ist ein Köder-Kanal. Echte Nutzer wissen (aus deinen Regeln), dass sie da nicht reinschreiben sollen – Raid-Bots/Scripts, die blind alle Kanäle anschreiben, tappen aber oft rein. Schreibt jemand dort, wird die Nachricht gelöscht und die Person automatisch gebannt.

- `/honeypot create name:verify-here` – erstellt den Kanal und aktiviert die Überwachung
- `/honeypot status` – zeigt, ob und wo ein Honeypot aktiv ist
- `/honeypot disable` – deaktiviert die Überwachung (Kanal bleibt bestehen, du kannst ihn manuell löschen)

**Tipp:** Platziere den Kanal so, dass er wie ein "normaler" Kanal aussieht (z.B. ähnlicher Name wie dein echter Verify-Kanal), aber erwähne in deinen Serverregeln klar, dass echte Nutzer dort nichts posten sollen.

## Logging

Alles Wichtige wird in einem Log-Kanal deiner Wahl protokolliert:

- `/logs setup channel:#server-logs` – legt den Log-Kanal fest
- `/logs status` – zeigt, wohin gerade geloggt wird
- `/logs disable` – schaltet Logging aus

**Automatisch geloggt** (ohne dass du etwas tun musst):
- Mitglied beigetreten / verlassen
- Nachricht gelöscht / bearbeitet
- Rollen-Änderungen bei einem Mitglied (egal ob durch Autorolle, `/verify`, oder manuell)
- Nickname-Änderungen

**Zusätzlich bei jeder Moderations-Aktion** (inkl. wer sie ausgeführt hat):
- `/kick`, `/ban`, `/timeout`, `/warn`, `/clear`, `/verify`, sowie automatische Honeypot-Bans

## /userinfo — Nutzer-Historie einsehen

`/userinfo user:@X` zeigt:
- Account erstellt am / Server beigetreten am
- Aktuelle Rollen
- Die komplette Moderations-Historie (Warns, Kicks, Timeouts, Bans, Verifizierungen), jeweils mit Grund, wer es ausgeführt hat und wann

Die Historie wird dauerhaft in `data/mod-history.json` gespeichert (bleibt auch nach einem Bot-Neustart erhalten). Standardmäßig können das nur Nutzer mit "Mitglieder moderieren"-Berechtigung sehen.

## Dauerhafte Datenspeicherung mit MongoDB

Ticket-Typen, Reaction Roles, Honeypot, Log-Kanal und die `/userinfo`-Historie werden jetzt in einer **MongoDB-Datenbank** gespeichert statt in lokalen Dateien. Das bedeutet: Diese Einstellungen bleiben **dauerhaft erhalten**, egal wie oft du neuen Code zu GitHub hochlädst und Render neu deployt.

### Einrichtung
1. Kostenlosen Cluster auf [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) erstellen
2. Connection-String kopieren (Cluster → "Connect" → "Drivers" → Node.js)
3. In deiner lokalen `.env` UND in Render (Environment-Variablen im Dashboard) eine Variable `MONGODB_URI` mit diesem String eintragen

### Bestehende Daten übernehmen (nur einmal nötig)
Falls du schon Ticket-Typen o.ä. in den alten `data/*.json` Dateien hattest:
```
npm run migrate
```
Das überträgt alles aus deinen lokalen `data/*.json` Dateien in die neue Datenbank. Danach kannst du den `data/`-Ordner sowohl lokal als auch in deinem GitHub-Repo löschen (wird nicht mehr gebraucht).

### Wichtig für Render
Trag `MONGODB_URI` auch in Render unter **Environment** (im Dashboard deines Services) ein, sonst kann der Bot dort keine Verbindung zur Datenbank aufbauen.
