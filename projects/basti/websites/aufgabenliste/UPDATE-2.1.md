# Update auf Fassung 2.1 – ohne Datenverlust

## Was sich ändert

**Behoben**

1. **Untere Leiste bleibt stehen.** Sie war `position: fixed` – iOS-Safari
   zeichnet das beim Schwung-Scrollen nicht zuverlässig neu, dadurch
   „wanderte" sie sichtbar mit. Jetzt scrollt nur noch der Inhaltsbereich,
   die Leiste steht außerhalb davon und kann gar nicht mehr verrutschen.

2. **Kein Sprung nach oben mehr beim Abhaken.** Ursache war die Tagesleiste
   ganz oben: sie wurde bei jedem Häkchen neu aufgebaut und dabei mit
   `scrollIntoView` sichtbar gemacht – was die ganze Seite mit nach oben
   gezogen hat. Jetzt wird nur noch waagerecht gescrollt. Zusätzlich hält
   die App die Position, wenn im Hintergrund ein Abgleich hereinkommt.

3. **Rundgang ist jetzt zweimal da**, als zwei getrennte Aufgaben mit
   eigenem Häkchen und eigener Erinnerung:
   * **Rundgang früh · 7:00 Uhr** (Aufgabe 3)
   * **Rundgang spät · 15:00 Uhr** (Aufgabe 8)

   Damit kommt die 15-Uhr-Erinnerung nicht mehr, wenn du den zweiten
   Rundgang schon gemacht hast.

Dadurch sind es jetzt **12 Aufgaben pro Tag** und **146 Häkchen** insgesamt
(vorher 11 bzw. 134).

---

## ⚠️ Deine bisherigen Daten

**Es geht nichts verloren.** Die App stellt beim ersten Start automatisch um:

| Was du hast | Was daraus wird |
|---|---|
| Häkchen bei „Rundgang" an einem **vergangenen** Tag | beide Rundgänge abgehakt – der Tag bleibt komplett |
| Häkchen bei „Rundgang" **heute** | nur der frühe Rundgang – die 15-Uhr-Erinnerung kommt noch |
| Notizen, Fotos, Erfolge, Einstellungen | bleiben unverändert |

Die Umstellung läuft auch dann, wenn die Daten vom Server kommen, und sie
kann gefahrlos mehrfach durchlaufen. Hakst du einen Rundgang bewusst wieder
auf, bleibt er auch nach dem nächsten Abgleich aufgehakt.

**Trotzdem vorher eine Sicherung ziehen** – dauert zehn Sekunden:
in der App **Einstellungen → Daten & Sync → Sicherung herunterladen**.

Oder direkt auf dem Server:

```bash
cp -r /DATA/AppData/aufgabenliste/daten /DATA/AppData/aufgabenliste/daten-backup
```

---

## Update durchführen

### 1. Dateien ersetzen

Aus `Aufgabenliste-Server.zip` **nur diese beiden Ordner** nach
`/DATA/AppData/aufgabenliste/` hochladen und überschreiben:

* `public/`
* `server/`

> **Den Ordner `daten/` NICHT anfassen.** Dort liegen deine Häkchen, Notizen,
> Fotos und die Push-Anmeldungen. Im Archiv ist bewusst kein `daten/`
> enthalten, damit beim Entpacken nichts überschrieben werden kann.

### 2. Container neu bauen und starten

Im Terminal auf der ZimaOS-Box, jede Zeile einzeln:

```bash
cd /DATA/AppData/aufgabenliste
```

```bash
sudo env DOCKER_CONFIG=/tmp/docker-config docker build -t aufgabenliste:latest .
```

```bash
sudo env DOCKER_CONFIG=/tmp/docker-config docker rm -f aufgabenliste
```

```bash
sudo env DOCKER_CONFIG=/tmp/docker-config docker run -d --name aufgabenliste --restart unless-stopped -p 8091:8080 -e TZ=Europe/Vienna -e PORT=8080 -e DATEN=/app/daten -e KONTAKT=mailto:herringerr912@gmail.com -v /DATA/AppData/aufgabenliste/daten:/app/daten aufgabenliste:latest
```

Prüfen:

```bash
curl -s http://localhost:8091/api/status
```

Dort sollte bei `haekchen` deine bisherige Anzahl stehen – der Beweis, dass
die Daten noch da sind.

### 3. Tailscale läuft weiter

Muss nur nach einem Neustart der Box neu gesetzt werden:

```bash
sudo env DOCKER_CONFIG=/tmp/docker-config docker exec tailscale tailscale serve --bg 8091
```

### 4. Auf den Geräten die neue Fassung holen

Die App speichert sich für den Offline-Betrieb selbst zwischen. Damit die
neue Fassung ankommt:

* **iPhone:** App vom Home-Bildschirm schließen (nach oben wegwischen) und
  neu öffnen. Falls noch die alte Ansicht kommt: nochmal schließen und öffnen.
* **PC:** Seite mit `Strg` + `F5` neu laden.

Unten auf der Seite muss dann **Version 2.1.0** stehen.

---

## Wenn doch etwas fehlt

Sicherung zurückspielen: **Einstellungen → Daten & Sync → Sicherung laden**
und die heruntergeladene `.json`-Datei auswählen. Der Import führt zusammen,
löscht also nichts, was schon da ist.

Auf dem Server:

```bash
sudo env DOCKER_CONFIG=/tmp/docker-config docker rm -f aufgabenliste
rm -rf /DATA/AppData/aufgabenliste/daten
mv /DATA/AppData/aufgabenliste/daten-backup /DATA/AppData/aufgabenliste/daten
```

Danach den `docker run`-Befehl aus Schritt 2 wiederholen.
