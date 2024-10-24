// rad_analyse\backend\controllers\uploadController.js

// Da die Upload-Logik bereits in der Middleware behandelt wird,
// ist dieser Controller aktuell nicht notwendig. Bei Bedarf können
// hier zusätzliche Funktionen hinzugefügt werden.

const uploadController = {
    // Beispiel: Zusätzliche Verarbeitung nach dem Upload
    postUpload: (req, res) => {
        // Implementieren Sie hier zusätzliche Logik
        res.status(200).json({ message: 'Upload erfolgreich verarbeitet.' });
    }
};

module.exports = uploadController;
