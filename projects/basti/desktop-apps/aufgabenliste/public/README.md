# Aufgabenliste für Basti · 15. bis 26. August 2026

Fassung 2.0 · Interaktive Version der Aufgabenliste aus `Aufgabenliste.xlsx`
und `Aufgabenliste_Basti.pdf`.

Reines HTML, CSS und JavaScript, dazu ein kleiner Node-Server – **ohne ein
einziges Fremdpaket**, keine externen Schriften, kein CDN, kein Tracking.

Einrichtung Schritt für Schritt: siehe `EINRICHTUNG.md`.

---

## Die Aufgaben

**12 Tage × 11 Aufgaben = 132**, plus zwei Zusatzaufgaben → **134 Häkchen**.

| # | Aufgabe | Zeit |
|---|---------|------|
| 1 | Lüften in der Früh | nach dem Aufstehen |
| 2 | Frühstücken | ab 8:00 |
| 3 | Rundgang ums Haus | 7:00 und 15:00 |
| 4 | Gießen (wenn zu trocken) | ab 8:00 |
| 5 | Freie Zeit | Vormittag |
| 6 | Essen (Mittagessen) | 14:00–15:00 |
| 7 | **Post schauen** | ca. 14:00 |
| 8 | Freie Zeit | Nachmittag |
| 9 | Abends lüften | wenn die Sonne weg ist |
| 10 | Essen (Abendessen) | Abend |
| 11 | Schlafen | Nacht |

**Post schauen:** alles mit deinem Namen sowie von Billa und Lidl aufheben.
Wenn du unsicher bist, ein Bild schicken.

**Sondertage**

* **Do 20.08.** – statt gießen: **Rasen mähen** (ab 8 Uhr erlaubt)
* **Mo 24.08.** – abends zusätzlich: **Restmüll** zudrehen, in die Tonne, Tonne rausstellen
* **Mi 26.08.** – abends zusätzlich: **Papiermüll** in die Papiertonne, Tonne rausstellen

---

## Ansichten

* **Heute** – Tagesablauf als Karten, nach Tagesabschnitt gruppiert, mit
  Fortschrittsring, „als Nächstes"-Markierung, Notizfeld und Fotos
* **Übersicht** – das Raster aus dem PDF, 12 Zeilen × 11 Spalten
* **Notizen** – „Ist mir aufgefallen", ein Feld pro Tag, mit Volltextsuche
* **Statistik** – Fortschritt, Serien, Auswertung pro Aufgabe, 15 Erfolge
* **Notfall** – Telefonnummern zum Antippen, immer über den roten Knopf oben
  erreichbar
* **Einstellungen** – siehe unten

---

## Was der Server dazutut

Ohne Server läuft alles rein lokal weiter. Mit Server (siehe `EINRICHTUNG.md`):

* **Echte Benachrichtigungen**, auch bei geschlossener App. Der Server prüft
  vorher, ob die Aufgabe schon erledigt ist, und schweigt dann. Mehrere
  gleichzeitig fällige Punkte kommen als *eine* Mitteilung.
  Knöpfe direkt in der Mitteilung: **Erledigt** und **In 30 Min.**
* **Automatischer Abgleich** zwischen iPhone und PC. Kein Code mehr nötig.
  Jedes Häkchen trägt einen Zeitstempel, jedes Entfernen ebenfalls – beim
  Abgleich gewinnt das Jüngere. Dadurch kann nichts „wiederauferstehen" und
  die Reihenfolge der Geräte ist egal.
* **Fotos** werden mitsynchronisiert.

Ohne Verbindung läuft die App normal weiter und reicht alles nach.

---

## Einstellungen

**Persönlich** · Name, Gerätename

**Aussehen** · Hell/Dunkel/System, 6 Akzentfarben, Textgröße, Animationen

**Verhalten** · Startansicht, auf heute springen, strenger Modus
(nur heute abhakbar), Erledigte nach unten, „Jetzt"-Markierung, Sprüche

**Konfetti, Klang, Vibration** · Konfettimenge, Klänge mit Lautstärkeregler,
Vibration

**Erinnerungen** · eigene Uhrzeit je Aufgabe, Vorlauf (0/5/15/30 Min.),
Test-Erinnerung

**Eigener Server** · Verbindungsanzeige, automatischer Abgleich,
Benachrichtigungen ein/aus, Probe, Serverstatus, Zugangsschlüssel

**Daten & Sync** · Kurz-Code (~32 Zeichen), Voll-Code, Sicherungsdatei,
Bericht, Kalenderdatei (.ics), Notizen als Text, Drucken

**Zurücksetzen** · nur Häkchen oder alles

---

## Tastenkürzel (Desktop)

| Taste | Wirkung |
|-------|---------|
| `←` `→` | einen Tag zurück / vor |
| `1`–`9`, `0` | Aufgabe abhaken |
| `A` | alle Aufgaben des Tages |
| `Z` | rückgängig |
| `H` `Ü` `N` `S` `T` `E` | Heute · Übersicht · Notizen · Statistik · Telefon · Einstellungen |
| `P` | Drucken · `?` Hilfe |

Am Handy: **nach links oder rechts wischen** wechselt den Tag.

---

## Aufbau

```
index.html                 Grundgerüst + alle SVG-Symbole
assets/css/app.css         Design, hell und dunkel, Druckansicht
assets/js/data.js          Aufgaben, Tage, Sondertage, Datumshilfen
assets/js/kontakte.js      Telefonliste  ⚠ private Nummern
assets/js/store.js         Speicher, Einstellungen, Fotos, Export/Import
assets/js/fx.js            Konfetti, Klänge, Vibration, Meldungen
assets/js/api.js           Verbindung zum Server, Abgleich, Push-Anmeldung
assets/js/app.js           Ansichten, Routing, Bedienung
sw.js                      Offline-Betrieb und Push-Empfang
manifest.webmanifest       macht die Seite installierbar

server/server.js           Webserver, Abgleich-API, Zeitplaner
server/push.js             Web Push nach RFC 8291/8292 (nur node:crypto)
server/merge.js            Zusammenführen zweier Stände
server/plan.js             Wann welche Erinnerung fällig ist
```

Alle Pfade sind **relativ** – die Seite läuft im Wurzelverzeichnis genauso wie
in einem Unterordner. Die Navigation nutzt `#/`-Adressen, damit es nie 404 gibt.

### Inhalte ändern

Aufgabentexte, Zeiten und Sondertage stehen in `assets/js/data.js`
(`AUFGABEN` und `SONDERTAGE`). Ändert man die Zeiten, muss man `server/plan.js`
angleichen – oder man setzt die Zeiten einfach in der App unter
*Einstellungen → Erinnerungen → Zeiten anpassen*, dann übernimmt der Server sie
automatisch.

Nach jeder Änderung die Zahl bei `VERSION` in `sw.js` erhöhen, sonst behalten
bereits geöffnete Geräte die alte Fassung.

---

## ⚠️ Telefonnummern

`assets/js/kontakte.js` enthält echte private Rufnummern.

* Eigener Server im Tailnet: unproblematisch.
* Öffentliches GitHub-Repo: **die Nummern wären für jeden lesbar.** Dann das
  Repo auf „Private" stellen oder `KONTAKTE_VORGABE` leeren.

Die Datei darf auch ganz fehlen – dann bleibt die Liste leer und lässt sich in
der App selbst befüllen.

---

## Datenschutz

Keine Analyse, keine Cookies, keine externen Schriften, kein CDN. Ohne Server
verlässt nichts das Gerät; mit Server geht es ausschließlich an deinen eigenen.
Im privaten Browserfenster ist der Speicher gesperrt – die App weist beim Start
darauf hin.
