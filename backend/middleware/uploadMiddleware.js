const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../models/db');
const dotenv = require('dotenv');

dotenv.config();

// Upload-Verzeichnis konfigurieren
const uploadDir = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'json_uploads');

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
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.json');
    }
});

// Multer-Filter für JSON-Dateien
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/json') {
        cb(null, true);
    } else {
        cb(new Error('Nur JSON-Dateien sind erlaubt.'), false);
    }
};

// Multer-Upload-Konfiguration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB Limit
    }
}).single('jsonFile');

// Hilfsfunktion zum Parsen des deutschen Datums
function parseGermanDate(dateString) {
    if (!dateString) return null;

    // Erwartetes Format: DD.MM.YYYY HH:mm:ss oder DD-MM-YYYY HH:mm:ss
    const parts = dateString.match(/(\d{2})[-.\/](\d{2})[-.\/](\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);

    if (!parts) return null;

    const [_, day, month, year, hour, minute, second] = parts;
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// Middleware für den Upload-Prozess
const uploadMiddleware = (req, res) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Upload-Fehler: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Keine Datei ausgewählt.' });
        }

        // JSON-Datei einlesen
        fs.readFile(req.file.path, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ error: 'Fehler beim Lesen der Datei.' });
            }

            let jsonData;
            try {
                jsonData = JSON.parse(data);
            } catch (err) {
                return res.status(400).json({ error: 'Ungültiges JSON-Format.' });
            }

            // Prüfen ob es ein Array ist
            if (!Array.isArray(jsonData)) {
                return res.status(400).json({ error: 'JSON muss ein Array von Untersuchungen sein.' });
            }

            // SQL-Statement vorbereiten
            const insertStmt = db.prepare(`
                INSERT INTO investigations (
                    Modalitaet,
                    Studiendatum,
                    Studienbeschreibung,
                    Anfragename,
                    Institution,
                    AnfragendeAbteilung,
                    AnfragenderArzt,
                    Überweiser,
                    BefundVerfasser,
                    Patientengeschlecht,
                    Patientenalter,
                    Diagnose,
                    Untersuchungsstatus
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            // Transaktion starten
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                let successCount = 0;
                let errorCount = 0;

                jsonData.forEach((item, index) => {
                    const studiendatum = parseGermanDate(item.Studiendatum);

                    if (!studiendatum) {
                        errorCount++;
                        console.error(`Ungültiges Datum in Zeile ${index + 1}`);
                        return;
                    }

                    // Validierung der notwendigen Felder
                    const requiredFields = ['Modalität', 'Studiendatum', 'Anfragename', 'Institution', 'Patientengeschlecht', 'Patientenalter', 'Untersuchungsstatus'];
                    const missingFields = requiredFields.filter(field => !item[field]);

                    if (missingFields.length > 0) {
                        errorCount++;
                        console.error(`Fehlende Felder in Zeile ${index + 1}: ${missingFields.join(', ')}`);
                        return;
                    }

                    try {
                        insertStmt.run(
                            item.Modalität || '',
                            studiendatum,
                            item.Studienbeschreibung || '',
                            item.Anfragename || '',
                            item.Institution || '',
                            item['Anfragende Abteilung'] || '',
                            item['Anfragender Arzt'] || '',
                            item.Überweiser || '',
                            item.Berfundverfasser || '',
                            item.Patientengeschlecht || '',
                            item.Patientenalter || '',
                            item.Diagnose || '',
                            item.Untersuchungsstatus || ''
                        );
                        successCount++;
                    } catch (err) {
                        errorCount++;
                        console.error(`Fehler beim Einfügen von Zeile ${index + 1}:`, err);
                    }
                });

                db.run('COMMIT', (err) => {
                    insertStmt.finalize();

                    if (err) {
                        console.error('Transaktionsfehler:', err);
                        return res.status(500).json({ 
                            error: 'Fehler beim Speichern der Daten.' 
                        });
                    }

                    // Erfolgsmeldung
                    res.status(200).json({
                        message: `Import abgeschlossen. ${successCount} Datensätze erfolgreich importiert, ${errorCount} Fehler.`
                    });

                    // Aufräumen: Upload-Datei löschen
                    fs.unlink(req.file.path, (err) => {
                        if (err) console.error('Fehler beim Löschen der Upload-Datei:', err);
                    });
                });
            });
        });
    });
};

module.exports = uploadMiddleware;
