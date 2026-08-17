# Einrichtung – Aufgabenliste 15.–26. August 2026 (Fassung 2.0)

## Erstmal das Wichtigste

**Im Server-Archiv ist die Website mit drin.** Sie liegt im Ordner `public/`,
und der Server liefert sie aus. Du brauchst also **nur ein Archiv**, nicht zwei.

**Warum WebHafen „kein Server gefunden" meldet:** WebHafen-Typ „Statisch" kann
nur fertige Dateien ausliefern, aber kein Node-Programm starten. Die Seite
funktioniert dort – nur eben ohne Benachrichtigungen und ohne automatischen
Abgleich, weil beides den Server braucht.

**Docker brauchst du nicht.** Node allein reicht völlig.

---

## Weg 1 · Sofort loslegen auf dem Windows-PC (5 Minuten)

Dein `tailscale serve` läuft bereits und zeigt auf `127.0.0.1:8090` von
**bastian-pc**. Genau da hängen wir den Server jetzt rein.

1. `Aufgabenliste-Server.zip` entpacken, z. B. nach `C:\Aufgabenliste`
2. Im entpackten Ordner **`START-SERVER.cmd` doppelklicken**
3. Das Fenster offen lassen, solange du die App nutzen willst

Fertig. Erreichbar unter:

* am PC: `http://localhost:8090/`
* im Tailnet, **mit HTTPS**: `https://bastian-pc.tailc4f723.ts.net/`

Läuft `tailscale serve` mal nicht mehr, einfach nochmal:

```
tailscale serve --bg 8090
```

> **Nachteil:** Der PC muss laufen, sonst kommt das iPhone nicht dran und es
> gehen keine Erinnerungen raus. Für dauerhaften Betrieb siehe Weg 2.

### Damit er automatisch mitstartet

`Windows-Taste + R` → `shell:startup` → Enter. In den Ordner, der aufgeht,
eine **Verknüpfung** zu `START-SERVER.cmd` legen. Ab dann startet er
automatisch beim Anmelden.

---

## Weg 2 · Dauerhaft auf ZimaOS (empfohlen für die Ferien)

Damit läuft es auch, wenn der PC aus ist.

**Mit Docker** (ZimaOS bringt es mit, z. B. über Portainer):

```bash
docker compose up -d --build
```

**Oder ganz ohne Docker**, wenn Node auf der ZimaOS-Box liegt:

```bash
sh start.sh
```

Danach **auf der ZimaOS-Box** (nicht am PC):

```bash
tailscale serve --bg 8090
```

Dann lautet die Adresse `https://zimaos-1.tailc4f723.ts.net/`.

> **Zu deiner Frage nach den Tailscale-Adressen:** Maßgeblich ist immer die
> **volle Domain** des Rechners, auf dem der Server läuft – also
> `bastian-pc.tailc4f723.ts.net` bei Weg 1 und `zimaos-1.tailc4f723.ts.net`
> bei Weg 2. Nur dafür stellt Tailscale ein HTTPS-Zertifikat aus.
> `100.71.175.85` funktioniert auch, aber nur über `http://` und damit ohne
> Benachrichtigungen. Die Liste der „Endpoints" (192.168.68.10:59069 usw.)
> sind interne WireGuard-Adressen für Tailscales eigenen Verbindungsaufbau –
> die ruft man nie im Browser auf.

### Docker-Fehlermeldung, die du hattest

```
unable to get image 'aufgabenliste:latest': failed to connect to the docker API
```

Heißt schlicht: **Docker Desktop läuft nicht.** Entweder Docker Desktop
starten und warten, bis das Wal-Symbol ruhig ist – oder Docker einfach
weglassen und Weg 1 nehmen.

---

## Danach: iPhone einrichten

1. Die **ts.net-Adresse in Safari** öffnen (Tailscale am iPhone muss verbunden sein)
2. Unten auf **Teilen** → **Zum Home-Bildschirm** → Name z. B. `Aufgaben`
3. **Die App vom Home-Bildschirm starten**, nicht mehr aus Safari
4. In der App: **Einstellungen → Eigener Server → Benachrichtigungen → Einschalten**
5. iOS-Nachfrage mit **Erlauben** beantworten
6. **Probe schicken** – es muss sofort eine Mitteilung kommen

> Schritt 3 ist Pflicht. iOS erlaubt Web-Benachrichtigungen ausschließlich für
> Seiten, die als App am Home-Bildschirm liegen und von dort gestartet wurden.
> Direkt in Safari kommt nichts an.

Am PC dasselbe: Seite öffnen, in Chrome oder Edge über das Symbol in der
Adressleiste installieren, dann Benachrichtigungen einschalten.

---

## Was dann von allein läuft

* Erinnerungen zu den Zeiten aus der Excel, **auch bei geschlossener App**.
  Ist die Aufgabe schon abgehakt, schweigt der Server.
* Mehreres gleichzeitig (14:00 Essen + Post) kommt als **eine** Mitteilung.
* Zwei Knöpfe in jeder Mitteilung: **Erledigt** hakt ab, **In 30 Min.** verschiebt.
* Häkchen, Notizen und Fotos gleichen sich zwischen allen Geräten ab.
* Ohne Verbindung läuft alles weiter und wird später nachgereicht.

Nachschauen, was der Server macht: in der App unter
**Einstellungen → Eigener Server → Serverstatus**, oder direkt
`http://localhost:8090/api/status`.

---

## ⚠️ Immer dieselbe Adresse benutzen

Der Fortschritt hängt am **Ursprung** der Seite. Für den Browser sind

* `http://localhost:8090`
* `https://bastian-pc.tailc4f723.ts.net`

**zwei getrennte Welten** – sogar auf demselben Gerät. Der Server bringt zwar
beide auf denselben Stand, aber Einstellungen und Push-Anmeldung hängen am
Ursprung. **Nimm überall die ts.net-Adresse.**

---

## ⚠️ Telefonnummern

Die Notfall-Liste steht in **einer** Datei: `public/assets/js/kontakte.js`.

* Eigener Server im Tailnet: unproblematisch, da kommt nur rein, wer im
  Tailnet ist.
* Öffentliches GitHub-Repo: die Nummern wären für jeden lesbar. Deshalb sind
  sie im GitHub-Archiv **nicht** enthalten.
* Datei löschen geht jederzeit – dann bleibt die Liste leer und du trägst in
  der Notfall-Ansicht eigene ein.

---

## Die drei Archive

| Archiv | Wofür | Benachrichtigungen | Abgleich |
|--------|-------|--------------------|----------|
| **`Aufgabenliste-Server.zip`** | **PC oder ZimaOS – nimm dieses** | ✅ | ✅ automatisch |
| `Aufgabenliste-Website.zip` | WebHafen „Statisch", nur Anschauen | ❌ | ⚠️ nur per Code |
| `Aufgabenliste-GitHubPages.zip` | GitHub Pages (**ohne** Telefonnummern) | ❌ | ⚠️ nur per Code |

Inhalt des Server-Archivs:

```
START-SERVER.cmd     Doppelklick unter Windows
start.sh             dasselbe für Linux/ZimaOS
public/              die Website
server/              der Node-Server, 4 Dateien, keine Fremdpakete
daten/               entsteht beim ersten Start – NICHT löschen
Dockerfile, docker-compose.yml, package.json
```

---

## Spickzettel: genau dein ZimaOS-Server (BastiADMINOWNER@ZimaOS)

Diese Box hat drei Besonderheiten, die den Standardweg (`docker compose up`)
unmöglich machen. Der funktionierende Weg dafür:

**Warum nicht einfach `docker compose`:** Diese Docker-Installation hat kein
`compose`-Plugin. **Warum `sudo` nötig ist:** dein Nutzer ist nicht in der
Gruppe `docker`. **Warum `DOCKER_CONFIG=/tmp/...` nötig ist:** `/root` ist auf
dieser Box schreibgeschützt, Docker kann dort seine Konfigurationsdatei nicht
anlegen. **Warum Port 8091 statt 8090:** 8090 gehört schon `kartenbot-web`.

### Container neu bauen (nach einer Änderung am Code)

```bash
cd /DATA/AppData/aufgabenliste
sudo env DOCKER_CONFIG=/tmp/docker-config docker build -t aufgabenliste:latest .
sudo env DOCKER_CONFIG=/tmp/docker-config docker rm -f aufgabenliste 2>/dev/null
sudo env DOCKER_CONFIG=/tmp/docker-config docker run -d --name aufgabenliste --restart unless-stopped -p 8091:8080 -e TZ=Europe/Vienna -e PORT=8080 -e DATEN=/app/daten -e KONTAKT=mailto:herringerr912@gmail.com -v /DATA/AppData/aufgabenliste/daten:/app/daten aufgabenliste:latest
```

### Nur neu starten (ohne Code-Änderung, z. B. nach einem Absturz)

```bash
sudo env DOCKER_CONFIG=/tmp/docker-config docker restart aufgabenliste
```

### Läuft er noch?

```bash
sudo env DOCKER_CONFIG=/tmp/docker-config docker ps --filter name=aufgabenliste
curl -s http://localhost:8091/api/info
```

### Tailscale-HTTPS neu einrichten (falls es nach einem Neustart weg ist)

Tailscale läuft bei dir als eigener Docker-Container (`network_mode: host`),
deshalb geht der Befehl über `docker exec`, nicht direkt:

```bash
sudo env DOCKER_CONFIG=/tmp/docker-config docker exec tailscale tailscale serve --bg 8091
sudo env DOCKER_CONFIG=/tmp/docker-config docker exec tailscale tailscale serve status
```

Adresse danach wieder: `https://zimaos-1.tailc4f723.ts.net/`

### Logs ansehen, wenn etwas nicht stimmt

```bash
sudo env DOCKER_CONFIG=/tmp/docker-config docker logs -f aufgabenliste
```

Mit `Strg+C` wieder verlassen.

---

## Wenn etwas nicht geht

| Symptom | Ursache und Lösung |
|---|---|
| `failed to connect to the docker API` | Docker Desktop läuft nicht → starten, oder Weg 1 ohne Docker nehmen |
| „Kein Server gefunden" in der App | Der Server läuft nicht → `START-SERVER.cmd` doppelklicken |
| „Kein Server gefunden" bei WebHafen | Erwartet – „Statisch" kann kein Node starten. Weg 1 oder 2 nehmen |
| Knopf „Einschalten" ist grau | Kein HTTPS → `tailscale serve --bg 8090` und die ts.net-Adresse benutzen |
| iPhone: Knopf grau trotz HTTPS | Seite nicht als App gespeichert → Teilen → Zum Home-Bildschirm, **von dort** öffnen |
| Probe kommt, Erinnerungen nicht | Zeitzone prüfen; der Server muss österreichische Zeit anzeigen (steht beim Start im Fenster) |
| Erinnerung kam gar nicht | Aufgabe war schon abgehakt – dann schweigt der Server mit Absicht |
| Fortschritt auf Handy und PC verschieden | Unterschiedliche Adressen benutzt (siehe oben) |
| Port 8090 schon belegt | In `START-SERVER.cmd` `set PORT=` ändern und `tailscale serve` auf denselben Port setzen |
| Änderungen erscheinen nicht | `VERSION` in `public/sw.js` hochzählen, Server neu starten |
