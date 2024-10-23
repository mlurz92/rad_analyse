const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../models/db');
const dotenv = require('dotenv');

dotenv.config();

const uploadDir = path.resolve(__dirname, '..', process.env.UPLOAD_DIR);

// Sicherstellen, dass das Upload-Verzeichnis existiert
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer-Speicher-Konfiguration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

// Multer-Filter zur Einschränkung auf JSON-Dateien
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/json') {
        cb(null, true);
    } else {
        cb(new Error('Nur JSON-Dateien sind erlaubt'), false);
    }
};

// Multer-Instanz mit erhöhtem Upload-Limit
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Maximal 10MB
}).single('jsonFile');

// Funktion zur Umwandlung des deutschen Datumsformats in ISO-Format
function parseGermanDate(dateString) {
    // Erwartetes Format: DD-MM-YYYY HH:MM:SS oder DD.MM.YYYY HH:MM:SS
    const regex = /^(\d{2})[-.]?(\d{2})[-.]?(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
    const match = dateString.match(regex);
    if (!match) return null;
    const [_, day, month, year, hour, minute, second] = match;
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// Middleware-Funktion zur Handhabung des Uploads
const uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer-spezifische Fehler
            console.error('Multer Fehler:', err.message);
            return res.status(400).json({ error: `Multer Fehler: ${err.message}` });
        } else if (err) {
            // Allgemeine Fehler
            console.error('Upload Fehler:', err.message);
            return res.status(400).json({ error: err.message });
        }

        // Überprüfung, ob eine Datei hochgeladen wurde
        if (!req.file) {
            return res.status(400).json({ error: 'Keine Datei hochgeladen.' });
        }

        const filePath = path.resolve(uploadDir, req.file.filename);

        // Lesen und Verarbeiten der JSON-Datei
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Fehler beim Lesen der Datei:', err.message);
                return res.status(500).json({ error: 'Fehler beim Lesen der Datei.' });
            }

            let jsonData;
            try {
                jsonData = JSON.parse(data);
            } catch (parseErr) {
                console.error('JSON-Parse Fehler:', parseErr.message);
                return res.status(400).json({ error: 'Ungültiges JSON-Format.' });
            }

            if (!Array.isArray(jsonData)) {
                return res.status(400).json({ error: 'JSON muss ein Array von Untersuchungen sein.' });
            }

            // Einfügen der Daten in die Datenbank
            const insertStmt = db.prepare(`
                INSERT INTO investigations (
                    Modalitaet,
                    Studiendatum,
                    Studienbeschreibung,
                    AnfragendeAbteilung,
                    AnfragenderArzt,
                    BefundVerfasser,
                    Diagnose,
                    Untersuchungsstatus,
                    Institution,
                    Anfragename,
                    Patientengeschlecht,
                    Patientenalter,
                    Überweiser
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            db.serialize(() => {
                db.run('BEGIN TRANSACTION;');
                jsonData.forEach((inv, index) => {
                    // Validierung der erforderlichen Felder
                    if (!inv.Modalitaet || !inv.Studiendatum) {
                        console.error(`Untersuchung ${index + 1} fehlt erforderliche Felder.`);
                        // Überspringen ungültiger Einträge
                        return;
                    }

                    // Umwandlung des Studiendatums in ISO-Format
                    const parsedDate = parseGermanDate(inv.Studiendatum);
                    if (!parsedDate) {
                        console.error(`Untersuchung ${index + 1} enthält ungültiges Studiendatum.`);
                        return;
                    }

                    insertStmt.run(
                        inv.Modalitaet,
                        parsedDate,
                        inv.Studienbeschreibung || '',
                        inv.AnfragendeAbteilung || '',
                        inv.AnfragenderArzt || '',
                        inv.BefundVerfasser || '',
                        inv.Diagnose || '',
                        inv.Untersuchungsstatus || '',
                        inv.Institution || '',
                        inv.Anfragename || '',
                        inv.Patientengeschlecht || '',
                        inv.Patientenalter || '',
                        inv.Überweiser || '',
                        (err) => {
                            if (err) {
                                console.error('Fehler beim Einfügen der Untersuchung:', err.message);
                            }
                        }
                    );
                });
                db.run('COMMIT;', (err) => {
                    if (err) {
                        console.error('Fehler beim Commit der Transaktion:', err.message);
                        return res.status(500).json({ error: 'Fehler beim Speichern der Daten in der Datenbank.' });
                    } else {
                        console.log('Alle Untersuchungen wurden erfolgreich importiert.');
                        insertStmt.finalize();
                        return res.status(200).json({ message: 'Datei erfolgreich hochgeladen und Daten importiert.' });
                    }
                });
            });
        });
    });
};

module.exports = uploadMiddleware;
