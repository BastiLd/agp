# MediaSync

Self-hosted Web-App für **ZimaOS / Docker**, um Filme und Serien auf dem Server zu **vergleichen**, **Plex-konform umzubenennen** und zwischen Platten zu **verschieben** – bedienbar im Browser, mit Passwort-Login.

> Hervorgegangen aus zwei Windows-Desktop-Tools (Indexieren/Vergleichen + Plex-Umbenennen), zusammengeführt zu einer containerisierten Web-App.

## Features

- 🔎 **Vergleichen** – Titel-Listen gegen Plex, lokale Server-Ordner und USB abgleichen: *Auf Plex / Gefunden / Fehlt / Duplikat / Qualität*
- 🎬 **Plex-Abgleich kombiniert** – echter Plex-Bibliotheksstatus (Plex-API) **und** Datei-Scan der gemounteten Ordner
- 🗂️ **TMDb** – deutsche/alternative Titel, Jahr und Episodentitel für bessere Treffer
- ✏️ **Umbenennen** – Plex-Schema, erst **Vorschau**, dann nach Bestätigung umbenennen
  - Film: `Filmname (Jahr)/Filmname (Jahr).ext`
  - Serie: `Serienname/Season 01/Serienname - S01E01 - Titel.ext`
- 📦 **Verschieben/Kopieren** – zwischen Platten, pro Aktion wählbar: *Verschieben* (kopieren + verifizieren + Original löschen) oder *Kopieren* (Original behalten)
- 🔁 **Plex-Refresh** – optional nach Umbenennen/Verschieben automatisch auslösen
- 🔐 **Login** – einfacher Passwort-Schutz, da die App schreibend auf deine Medien zugreift

## Installation auf ZimaOS (Docker Compose)

1. In ZimaOS einen Docker-Compose-Stack (App Store → eigene App / „Custom Install" mit Compose) anlegen und den Inhalt von [`docker-compose.yml`](docker-compose.yml) einfügen.
2. **Anpassen:**
   - `ports`: Host-Port `8095` ändern, falls belegt (`http://<server-ip>:8095`).
   - `AUTH_PASSWORD` + `SESSION_SECRET` setzen.
   - `volumes`: deine echten Pfade zu Filmen/Serien/Platten eintragen (linke Seite = Pfad auf ZimaOS, rechte Seite = Pfad im Container unter `/media/...`).
   - `PUID`/`PGID`: über `id` deines NAS-Users ermitteln, damit umbenannte/verschobene Dateien die richtigen Rechte behalten.
3. Stack starten. Das Image wird automatisch von **GHCR** (`ghcr.io/bastild/mediasync:latest`) gezogen – kein Build auf dem Server nötig.
4. Im Browser öffnen → anmelden → unter **Einstellungen** Quellen hinzufügen, Plex-URL/Token + TMDb-Key eintragen → **Indexieren**.

### Ports & Volumes

| | Host (ZimaOS) | Container | Zweck |
|---|---|---|---|
| Port | `8095` | `3000` | Web-UI |
| Volume | `/DATA/AppData/mediasync` | `/config` | Datenbank + Einstellungen |
| Volume | `/DATA/Media/Movies` | `/media/movies` | Filme (scannen/umbenennen) |
| Volume | `/DATA/Media/Series` | `/media/series` | Serien |
| Volume | *(weitere Platten/USB)* | `/media/<name>` | Ziele zum Verschieben |

> Die App darf nur innerhalb der unter `MEDIA_ROOTS` (Standard `/media`) gemounteten Ordner lesen/schreiben.

### Umgebungsvariablen

Siehe [`.env.example`](.env.example). Wichtig: `AUTH_PASSWORD`, `SESSION_SECRET`, `PUID`/`PGID`, `MEDIA_ROOTS`, optional `TMDB_KEY`, `PLEX_URL`, `PLEX_TOKEN`.

## Lokale Entwicklung

```bash
# Backend (Port 3000)
cd server && npm install && npm run dev

# Frontend (Port 5173, proxyt /api → 3000)
cd web && npm install && npm run dev
```

Tests & Typecheck:

```bash
cd server && npm test && npm run typecheck
cd web && npm run typecheck
```

## Image selbst bauen

```bash
docker build -t mediasync .
docker run -p 8095:3000 -v $PWD/config:/config -v /pfad/zu/Movies:/media/movies mediasync
```

## Architektur

- **server/** – Node.js + TypeScript + Fastify. Kernlogik (Scanner, TMDb, Fuzzy-Vergleich, SQLite via `sql.js`/WASM) plus Plex-API, Umbenennen, Verschieben, Browser, Auth. Build via esbuild → `dist/server.js`.
- **web/** – React + Vite. Wird statisch vom Server unter `/` ausgeliefert.
- **Docker** – Multi-Stage-Build → schlankes `node:20-alpine` Runtime-Image, `su-exec` für PUID/PGID.

## Hinweise

- Verschieben über Plattengrenzen nutzt *copy → verify (Größe) → delete*; bei fehlgeschlagener Verifikation wird die Teilkopie entfernt und das Original nie gelöscht. Bestehende Ziele werden nie überschrieben.
- This product uses the TMDB API but is not endorsed or certified by TMDB.
