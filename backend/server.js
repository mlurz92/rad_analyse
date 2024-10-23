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
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'"],
            "style-src": ["'self'", "'unsafe-inline'"],
        },
    },
}));

// CORS konfigurieren
app.use(cors({
    origin: ['https://raspberrypi.hyg6zkbn2mykr1go.myfritz.net'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Middleware zum Parsen von JSON-Daten
app.use(express.json());

// Statische Dateien servieren
app.use('/rad_analyse', express.static(path.join(__dirname, '../public')));

// API-Routen
app.use('/rad_analyse', uploadRoutes);
app.use('/rad_analyse', filterRoutes);

// Root-Route für /rad_analyse
app.get('/rad_analyse', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Catch-all Route für /rad_analyse/*
app.get('/rad_analyse/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Root-Route Umleitung
app.get('/', (req, res) => {
    res.redirect('/rad_analyse');
});

// 404-Handler für nicht gefundene Routen
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../public/index.html'));
});

// Starten des Servers
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Backend läuft auf Port ${PORT}`);
});
