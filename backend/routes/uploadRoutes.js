const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Route für Datei-Upload
router.post('/upload', uploadMiddleware);

module.exports = router;