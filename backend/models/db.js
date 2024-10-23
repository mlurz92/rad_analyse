const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Laden der Umgebungsvariablen
dotenv.config();

const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_URL);

// Sicherstellen, dass das Datenbankverzeichnis existiert
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Verbindung zur SQLite-Datenbank herstellen
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Fehler beim Verbinden zur SQLite-Datenbank:', err.message);
    } else {
        console.log('Verbindung zur SQLite-Datenbank hergestellt.');
        initializeDatabase();
    }
});

// Funktion zur Initialisierung der Datenbank
function initializeDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS investigations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            Modalitaet TEXT NOT NULL,
            Studiendatum TEXT NOT NULL,
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
        );
    `;
    db.run(createTableQuery, (err) => {
        if (err) {
            console.error('Fehler beim Erstellen der Tabelle:', err.message);
        } else {
            console.log('Tabelle "investigations" ist bereit.');
        }
    });
}

module.exports = db;