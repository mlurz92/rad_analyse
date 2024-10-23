const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');
const uploadRoutes = require('./routes/uploadRoutes');
const filterRoutes = require('./routes/filterRoutes');

dotenv.config();

const app = express();

// Sicherheitsmiddleware
app.use(helmet({
    contentSecurityPolicy: false
}));

// CORS konfigurieren
app.use(cors({
    origin: 'https://raspberrypi.hyg6zkbn2mykr1go.myfritz.net',
    credentials: true
}));

// JSON-Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische Dateien
app.use('/rad_analyse', express.static(path.join(__dirname, '../public')));

// API-Routen
app.use('/rad_analyse', uploadRoutes);
app.use('/rad_analyse', filterRoutes);

// Catch-all Route für das Frontend
app.get('/rad_analyse/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Interner Server-Fehler' });
});

// Starten des Servers
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
    console.log(`Backend läuft auf ${HOST}:${PORT}`);
});
