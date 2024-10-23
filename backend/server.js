const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');
const uploadRoutes = require('./routes/uploadRoutes');
const filterRoutes = require('./routes/filterRoutes');

// Laden der Umgebungsvariablen
dotenv.config();

// Erstellung der Express-Anwendung
const app = express();
const PORT = process.env.PORT || 3001; // Standardport 3001
const HOST = process.env.HOST || '0.0.0.0';

// Sicherheitsmiddleware
app.use(helmet());

// CORS konfigurieren
app.use(cors({
    origin: ['https://raspberrypi.hyg6zkbn2mykr1go.myfritz.net'], // Erlaubte Domänen
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Middleware zum Parsen von JSON-Daten
app.use(express.json());

// Nutzung von Upload- und Filter-Routen
app.use('/', uploadRoutes);
app.use('/', filterRoutes);

// Servieren der statischen Frontend-Dateien
app.use(express.static(path.join(__dirname, '../public')));

// Catch-All Route für Frontend-Routing (Single Page Application)
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
});

// Starten des Servers
app.listen(PORT, HOST, () => {
    console.log(`Backend läuft auf Port ${PORT}`);
});
