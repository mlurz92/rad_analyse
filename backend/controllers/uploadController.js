// Diese Datei ist aktuell leer, da die Upload-Logik bereits im Middleware behandelt wird.
// Falls Sie weitere Controller-Funktionen hinzufügen möchten, können Sie dies hier tun.

const uploadController = {
    // Beispiel einer zusätzlichen Funktion nach dem Upload
    // Diese Funktion könnte z.B. Benachrichtigungen senden oder weitere Datenverarbeitungen durchführen
    postUpload: (req, res) => {
        // Implementieren Sie zusätzliche Logik hier
        res.status(200).json({ message: 'Upload erfolgreich verarbeitet.' });
    }
};

module.exports = uploadController;
