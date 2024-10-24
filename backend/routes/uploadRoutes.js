const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Route zum Hochladen von JSON-Dateien
router.post('/upload', uploadMiddleware, (req, res) => {
    // Die Antwort wird bereits im uploadMiddleware behandelt
    // Optional: Zusätzliche Aktionen nach dem Upload
});

module.exports = router;
