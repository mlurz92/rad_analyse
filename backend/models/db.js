const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_URL || 'rad_analyse.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Fehler beim Verbinden zur Datenbank:', err.message);
    } else {
        console.log('Verbunden zur SQLite-Datenbank.');
    }
});

// Erstellung der investigations-Tabelle mit korrekten Feldnamen
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS investigations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Modalität TEXT,
        Studiendatum TEXT,
        Studienbeschreibung TEXT,
        Anfragename TEXT,
        Institution TEXT,
        "Anfragende Abteilung" TEXT,
        "Anfragender Arzt" TEXT,
        Überweiser TEXT,
        BefundVerfasser TEXT,
        Patientengeschlecht TEXT,
        Patientenalter TEXT,
        Diagnose TEXT,
        Untersuchungsstatus TEXT
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
