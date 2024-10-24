#!/bin/bash
# Skript zum Starten des Backend-Servers mit PM2

# Navigieren zum Anwendungsverzeichnis
cd /srv/rad_analyse/backend || { echo "Verzeichnis nicht gefunden!"; exit 1; }

# Starten des Servers mit PM2 im Produktionsmodus
pm2 start server.js --name rad_analyse --env production

# Überprüfen, ob PM2 gestartet wurde
if pm2 ls | grep -q "rad_analyse"; then
    echo "RAD Analyse Tool Backend wurde erfolgreich gestartet."
else
    echo "Fehler beim Starten des Backend-Servers."
    exit 1
fi
