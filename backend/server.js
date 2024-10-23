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
app.use(cors());

// JSON-Parser
app.use(express.json());

// API-Routen
app.use('/api', uploadRoutes);
app.use('/api', filterRoutes);

// Starten des Servers
const PORT = process.env.PORT || 3001;
const HOST = '127.0.0.1';  // Wichtig: Nur lokale Verbindungen

app.listen(PORT, HOST, () => {
    console.log(`Backend läuft auf ${HOST}:${PORT}`);
});
