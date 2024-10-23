const db = require('../models/db');

// Controller-Funktion für Filteranfragen
const filterInvestigations = (req, res) => {
    const filterCriteria = req.query;
    let query = 'SELECT * FROM investigations';
    const params = [];

    if (Object.keys(filterCriteria).length > 0) {
        query += ' WHERE ';
        const conditions = [];
        for (const [key, value] of Object.entries(filterCriteria)) {
            // Mehrfachauswahl für Modalitaet, AnfragendeAbteilung etc. unterstützt
            if (Array.isArray(value)) {
                const placeholders = value.map(() => '?').join(', ');
                conditions.push(`${key} IN (${placeholders})`);
                params.push(...value);
            } else {
                conditions.push(`${key} LIKE ?`);
                params.push(`%${value}%`);
            }
        }
        query += conditions.join(' AND ');
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Datenbankfehler:', err.message);
            return res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
        }
        return res.status(200).json(rows);
    });
};

// Controller-Funktion für das Abrufen der eindeutigen Filterwerte
const getFilterOptions = (req, res) => {
    const fields = [
        'Modalitaet',
        'AnfragendeAbteilung',
        'Diagnose',
        'Untersuchungsstatus',
        'Institution',
        'Anfragename',
        'Patientengeschlecht',
        'Patientenalter',
        'Überweiser'
    ];

    const distinctPromises = fields.map(field => {
        return new Promise((resolve, reject) => {
            const query = `SELECT DISTINCT ${field} FROM investigations WHERE ${field} IS NOT NULL AND ${field} != '' ORDER BY ${field} ASC`;
            db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const values = rows.map(row => row[field]);
                    resolve({ field, values });
                }
            });
        });
    });

    Promise.all(distinctPromises)
        .then(results => {
            const filterOptions = {};
            results.forEach(result => {
                filterOptions[result.field] = result.values;
            });
            res.status(200).json(filterOptions);
        })
        .catch(err => {
            console.error('Fehler beim Abrufen der Filteroptionen:', err.message);
            res.status(500).json({ error: 'Fehler beim Abrufen der Filteroptionen' });
        });
};

module.exports = { filterInvestigations, getFilterOptions };