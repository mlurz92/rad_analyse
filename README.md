# RAD Analyse Tool Backend Installation und Konfiguration

Diese Anleitung führt Sie Schritt für Schritt durch die Installation und Konfiguration des Backend-Teils der Anwendung `rad_analyse` auf Ihrem Raspberry Pi 4. Die Anwendung wird als zweite Anwendung neben Ihrer bereits installierten `Wochenplan-tool`-Anwendung betrieben und ist über die MyFritz-Adresse erreichbar. Außerdem wird erklärt, wie Sie einen Reverse Proxy mit Nginx einrichten, um beide Anwendungen sicher über HTTPS aus dem Internet zugänglich zu machen.

## **Inhalt**

- [Anforderungen](#anforderungen)
- [Installation des Backend](#installation-des-backend)
- [Konfiguration des Reverse Proxy mit Nginx](#konfiguration-des-reverse-proxy-mit-nginx)
- [Starten und Verwalten der Anwendungen](#starten-und-verwalten-der-anwendungen)
- [Testen der Anwendungen](#testen-der-anwendungen)
- [Fehlerbehebung](#fehlerbehebung)
- [Sicherheitsempfehlungen](#sicherheitsempfehlungen)

## **Anforderungen**

- **Hardware:**
  - Raspberry Pi 4 mit Raspberry Pi OS Lite (64-bit) installiert.
  
- **Software:**
  - Node.js (v14 oder höher)
  - npm (v6 oder höher)
  - SQLite3
  - Nginx (für den Reverse Proxy)

- **Internet-Zugang:** Über die MyFritz-Adresse [https://raspberrypi.hyg6zkbn2mykr1go.myfritz.net/](https://raspberrypi.hyg6zkbn2mykr1go.myfritz.net/) erreichbar.

## **1. Installation des Backend**

### **Schritt 1: System aktualisieren**

Öffnen Sie ein Terminal auf Ihrem Raspberry Pi und führen Sie die folgenden Befehle aus, um das System zu aktualisieren:

```bash
sudo apt update
sudo apt upgrade -y
```

### **Schritt 2: Node.js und npm installieren**

Falls Node.js und npm noch nicht installiert sind, installieren Sie sie mit den folgenden Befehlen:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Überprüfen Sie die Installation:

```bash
node -v
npm -v
```

### **Schritt 3: SQLite3 installieren**

Installieren Sie SQLite3 mit:

```bash
sudo apt install -y sqlite3
```

### **Schritt 4: Repository klonen**

Klonen Sie das `rad_analyse` Repository in das Verzeichnis `/srv/rad_analyse`:

```bash
sudo mkdir -p /srv/rad_analyse
sudo chown $USER:$USER /srv/rad_analyse
cd /srv/rad_analyse
git clone https://github.com/mlurz92/rad_analyse.git .
```

### **Schritt 5: Abhängigkeiten installieren**

Navigieren Sie in das Backend-Verzeichnis und installieren Sie die notwendigen Node.js-Pakete:

```bash
cd backend
npm install
```

### **Schritt 6: Umgebungsvariablen konfigurieren**

Erstellen Sie eine `.env`-Datei im `backend`-Verzeichnis:

```bash
nano .env
```

Fügen Sie den folgenden Inhalt ein:

```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
DATABASE_URL=./rad_analyse.db
UPLOAD_DIR=./json_uploads
```

Speichern Sie die Datei mit `Ctrl + O`, `Enter` und schließen Sie den Editor mit `Ctrl + X`.

### **Schritt 7: Datenbank und Upload-Verzeichnis erstellen**

Erstellen des Upload-Verzeichnisses und Berechtigungen setzen:

```bash
mkdir -p json_uploads
chmod 755 json_uploads
```

Die Datenbank wird automatisch erstellt, wenn der Server zum ersten Mal gestartet wird.

### **Schritt 8: Startskripte einrichten**

Machen Sie die Start- und Update-Skripte ausführbar:

```bash
chmod +x start_server.sh
chmod +x update_app.sh
```

### **Schritt 9: Starten des Backend-Servers**

Starten Sie den Backend-Server mit dem Startskript:

```bash
./start_server.sh
```

Überprüfen Sie, ob der Server läuft:

```bash
pm2 list
```

Sie sollten einen Eintrag `rad_analyse` sehen, der den Status `online` anzeigt.

## **2. Konfiguration des Reverse Proxy mit Nginx**

Da bereits eine andere Anwendung (`Wochenplan-tool`) auf Ihrem Raspberry Pi läuft, müssen Sie Nginx so konfigurieren, dass eingehende Anfragen an die richtige Anwendung weitergeleitet werden. In diesem Beispiel werden beide Anwendungen unter derselben Domain, aber unterschiedlichen Pfaden erreichbar sein.

### **Schritt 1: Nginx installieren (falls noch nicht installiert)**

```bash
sudo apt install nginx -y
```

### **Schritt 2: Zertifikate verwalten**

Für eine sichere HTTPS-Verbindung sollten Sie gültige SSL-Zertifikate verwenden. Mit MyFritz verwenden Sie wahrscheinlich bereits LetsEncrypt oder eine andere Zertifizierungsstelle. Falls nicht, installieren Sie `certbot` und holen Sie sich ein Zertifikat:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d raspberrypi.hyg6zkbn2mykr1go.myfritz.net
```

Folgen Sie den Anweisungen von `certbot`, um das SSL-Zertifikat zu erhalten und automatisch in Nginx zu integrieren.

### **Schritt 3: Nginx-Konfiguration erstellen**

Erstellen Sie eine neue Nginx-Konfigurationsdatei für `rad_analyse`:

```bash
sudo nano /etc/nginx/sites-available/rad_analyse
```

Fügen Sie den folgenden Inhalt ein:

```nginx
server {
    listen 80;
    server_name raspberrypi.hyg6zkbn2mykr1go.myfritz.net;

    # Weiterleitung von HTTP zu HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name raspberrypi.hyg6zkbn2mykr1go.myfritz.net;

    ssl_certificate /etc/letsencrypt/live/raspberrypi.hyg6zkbn2mykr1go.myfritz.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/raspberrypi.hyg6zkbn2mykr1go.myfritz.net/privkey.pem;

    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Allgemeine Sicherheitspraktiken
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Routing für Wochenplan-tool
    location /wochenplan-tool/ {
        proxy_pass http://localhost:3000/; # Annahme: Wochenplan-tool läuft auf Port 3000
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Routing für rad_analyse
    location /rad_analyse/ {
        proxy_pass http://localhost:3001/; # rad_analyse läuft auf Port 3001
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Servieren der statischen Dateien für die Hauptdomain (falls nötig)
    location / {
        try_files $uri $uri/ =404;
    }
}
```

**Anpassungen:**

- **Port-Anpassung:** Stellen Sie sicher, dass `wochenplan-tool` tatsächlich auf Port `3000` läuft. Falls nicht, passen Sie `proxy_pass` entsprechend an.
- **SSL-Zertifikate:** Der Pfad zu den SSL-Zertifikaten muss den tatsächlichen Pfaden Ihrer Zertifikate entsprechen. Bei Verwendung von `certbot` befinden sie sich normalerweise unter `/etc/letsencrypt/live/your-domain/fullchain.pem` und `/etc/letsencrypt/live/your-domain/privkey.pem`.
- **Pfadkonflikte vermeiden:** Achten Sie darauf, dass die Pfade sich nicht überschneiden und eindeutig auf die jeweiligen Anwendungen verweisen.

Speichern Sie die Datei mit `Ctrl + O`, `Enter` und schließen Sie den Editor mit `Ctrl + X`.

### **Schritt 4: Aktivieren der Nginx-Konfiguration**

Erstellen Sie einen symbolischen Link zur Aktivierung der Konfiguration:

```bash
sudo ln -s /etc/nginx/sites-available/rad_analyse /etc/nginx/sites-enabled/
```

### **Schritt 5: Nginx-Konfiguration testen und neu starten**

Überprüfen Sie die Nginx-Konfiguration auf Syntaxfehler:

```bash
sudo nginx -t
```

Falls keine Fehler auftreten, starten Sie Nginx neu:

```bash
sudo systemctl restart nginx
```

## **3. Starten und Verwalten der Anwendungen**

### **Backend (rad_analyse)**

Nachdem Sie das Backend installiert und konfiguriert haben, sollte es bereits über das Start-Skript laufen. Überprüfen Sie den Status mit:

```bash
pm2 list
```

Um bei Bedarf das Backend manuell neu zu starten:

```bash
pm2 restart rad_analyse
```

### **Frontend (rad_analyse)**

Die Frontend-Dateien befinden sich im Verzeichnis `public/` und werden automatisch vom Backend über den Reverse Proxy bereitgestellt. Stellen Sie sicher, dass die Frontend-Dateien korrekt in `/srv/rad_analyse/public/` vorhanden sind.

## **4. Testen der Anwendungen**

### **rad_analyse**

Öffnen Sie Ihren Webbrowser und navigieren Sie zu:

```
https://raspberrypi.hyg6zkbn2mykr1go.myfritz.net/rad_analyse/
```

Sie sollten die Benutzeroberfläche des RAD Analyse Tools sehen. Testen Sie das Hochladen einer Beispiel-JSON-Datei und die Filterfunktionalitäten.

### **Wochenplan-tool**

Stellen Sie sicher, dass Ihre bestehende `Wochenplan-tool`-Anwendung weiterhin erreichbar ist:

```
https://raspberrypi.hyg6zkbn2mykr1go.myfritz.net/wochenplan-tool/
```

## **5. Fehlerbehebung**

- **Server nicht erreichbar:**
  - Überprüfen Sie, ob sowohl `rad_analyse` als auch `Wochenplan-tool` korrekt laufen:
    ```bash
    pm2 list
    ```
  - Stellen Sie sicher, dass die Ports korrekt in der Nginx-Konfiguration weitergeleitet werden.

- **SSL-Zertifikat-Probleme:**
  - Stellen Sie sicher, dass Ihre SSL-Zertifikate gültig sind und der Pfad in der Nginx-Konfiguration korrekt ist.
  - Erneuern Sie das Zertifikat bei Bedarf:
    ```bash
    sudo certbot renew
    sudo systemctl reload nginx
    ```

- **Fehler beim Hochladen von JSON-Dateien:**
  - Prüfen Sie die Server-Logs:
    ```bash
    pm2 logs rad_analyse
    ```
  - Stellen Sie sicher, dass die JSON-Datei das richtige Format hat und die erforderlichen Felder enthält.

## **6. Sicherheitsempfehlungen**

- **Firewall einrichten:**
  - Beschränken Sie den Zugriff auf essentielle Ports und Dienste.
  - Aktivieren Sie UFW (Uncomplicated Firewall):
    ```bash
    sudo apt install ufw -y
    sudo ufw allow 'Nginx Full'
    sudo ufw enable
    ```

- **Regelmäßige Updates:**
  - Halten Sie Ihr System und alle Abhängigkeiten stets auf dem neuesten Stand:
    ```bash
    sudo apt update
    sudo apt upgrade -y
    npm update
    ```

- **Starke Passwörter:**
  - Verwenden Sie starke und einzigartige Passwörter für alle Dienste und Benutzerkonten auf Ihrem Raspberry Pi.

- **Monitoring und Logging:**
  - Implementieren Sie regelmäßiges Monitoring und überprüfen Sie die Logs auf verdächtige Aktivitäten.

## **Zusammenfassung**

Mit dieser Anleitung haben Sie das Backend der Anwendung `rad_analyse` vollständig installiert und konfiguriert, zusätzlich zur bestehenden `Wochenplan-tool`-Anwendung auf Ihrem Raspberry Pi 4. Der Einsatz von Nginx als Reverse Proxy ermöglicht es, beide Anwendungen sicher und effizient über die gleiche MyFritz-Adresse erreichbar zu machen. Stellen Sie sicher, dass alle Schritte sorgfältig befolgt werden und passen Sie Konfigurationen entsprechend Ihrer spezifischen Umgebung und Bedürfnisse an.

Bei weiteren Fragen oder Problemen stehen wir Ihnen gerne zur Verfügung. Viel Erfolg mit Ihrem Projekt!

---

**Kontaktinformationen:**

- **Entwickler:** mlurz
- **Repository:** [https://github.com/mlurz92/rad_analyse.git](https://github.com/mlurz92/rad_analyse.git)

---

**Lizenz:**

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).

```

**Erklärung der README:**

- **Anforderungen:** Übersicht über benötigte Hardware und Software.
- **Installation des Backend:** Schritt-für-Schritt-Anleitung zur Installation und Einrichtung des `rad_analyse` Backend.
- **Konfiguration des Reverse Proxy mit Nginx:** Detaillierte Anleitung zur Einrichtung von Nginx, einschließlich der Einrichtung von SSL-Zertifikaten und der Konfiguration von Routen für beide Anwendungen.
- **Starten und Verwalten der Anwendungen:** Informationen zur Verwaltung der Anwendungen mit PM2.
- **Testen der Anwendungen:** Anweisungen zur Überprüfung, ob die Anwendungen korrekt laufen.
- **Fehlerbehebung:** Tipps zur Behebung häufiger Probleme.
- **Sicherheitsempfehlungen:** Empfehlungen zur Sicherung Ihrer Anwendungen und Ihres Systems.
- **Zusammenfassung:** Abschließende Hinweise und Kontaktinformationen.

---
