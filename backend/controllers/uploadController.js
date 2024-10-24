// rad_analyse\backend\controllers\uploadController.js

const db = require('../models/db');

// Controller-Funktion zum Verarbeiten von Uploads (falls erforderlich)
const processUpload = (req, res) => {
    // Da die Upload-Logik bereits in der Middleware enthalten ist,
    // können hier zusätzliche Schritte implementiert werden.
    res.status(200).json({ message: 'Upload erfolgreich verarbeitet.' });
};

module.exports = { processUpload };
