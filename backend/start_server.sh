#!/bin/bash
# Skript zum Starten des Backend-Servers mit PM2

# Navigieren zum Anwendungsverzeichnis
cd /srv/rad_analyse/backend

# Starten des Servers mit PM2
pm2 start server.js --name rad_analyse --env production

# Speichern der PM2-Konfiguration
pm2 save

echo "RAD Analyse Tool Backend wurde erfolgreich gestartet."