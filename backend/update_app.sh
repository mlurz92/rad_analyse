#!/bin/bash
# Skript zum Aktualisieren der Anwendung und Neustarten des Servers

# Navigieren zum Anwendungsverzeichnis
cd /srv/rad_analyse/backend || { echo "Verzeichnis nicht gefunden!"; exit 1; }

# Git Repository aktualisieren
echo "Aktualisiere das Repository..."
git pull origin main

# Abhängigkeiten installieren
echo "Installiere Abhängigkeiten..."
npm install

# Prüfen, ob PM2 installiert ist
if ! command -v pm2 &> /dev/null
then
    echo "PM2 könnte nicht gefunden werden. Installiere PM2 global..."
    npm install -g pm2
fi

# Server mit PM2 neu starten
echo "Starte den Server neu..."
pm2 restart rad_analyse || { echo "Fehler beim Neustarten des Servers."; exit 1; }

echo "RAD Analyse Tool wurde erfolgreich aktualisiert und neu gestartet."
