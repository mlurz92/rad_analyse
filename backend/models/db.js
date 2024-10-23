const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_URL);
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Fehler beim Verbinden zur Datenbank:', err.message);
    } else {
        console.log('Verbunden zur SQLite-Datenbank.');
    }
});

// Erstellung der investigations-Tabelle, falls sie noch nicht existiert
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS investigations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Modalitaet TEXT,
        Studiendatum TEXT,
        Studienbeschreibung TEXT,
        AnfragendeAbteilung TEXT,
        AnfragenderArzt TEXT,
        BefundVerfasser TEXT,
        Diagnose TEXT,
        Untersuchungsstatus TEXT,
        Institution TEXT,
        Anfragename TEXT,
        Patientengeschlecht TEXT,
        Patientenalter TEXT,
        Überweiser TEXT
    )
`;

db.run(createTableQuery, (err) => {
    if (err) {
        console.error('Fehler beim Erstellen der Tabelle:', err.message);
    } else {
        console.log('Tabelle investigations ist bereit.');
    }
});

module.exports = db;
