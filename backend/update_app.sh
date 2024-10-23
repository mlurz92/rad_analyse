#!/bin/bash
# Skript zum Aktualisieren der Anwendung und Neustarten des Servers

# Navigieren zum Anwendungsverzeichnis
cd /srv/rad_analyse/backend

# Git Repository aktualisieren
echo "Aktualisiere das Repository..."
git pull origin main

# Abhängigkeiten installieren
echo "Installiere Abhängigkeiten..."
npm install

# Server mit PM2 neu starten
echo "Starte den Server neu..."
pm2 restart rad_analyse

echo "RAD Analyse Tool wurde erfolgreich aktualisiert und neu gestartet."