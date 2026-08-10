# Social Media & Mathematik — interaktive Präsentation

Eine Folien-Präsentation (Deutsch) zum Arbeitsblatt *„Aufgabensammlung – Social Media und Mathematik"*
mit drei interaktiven Mini-Simulatoren und echter Mathematik. Vintage-/Lehrbuch-Look.

## Inhalt (3 Hauptpunkte)
1. **Engagement-Rate** – Rechner mit Gauge, Tabelle, Plattform-Vergleich und Follower-Funktionsgraph.
2. **Netzwerke & Graphen** – ziehbares Netzwerk, Grad-Tabelle, Ø-Grad, „Influencer“ und kürzester Weg.
3. **Exponentielles Wachstum** – `N(t) = N₀ · aᵗ` mit animierter Kurve, Wertetabelle und linearem Vergleich.

Jeder Punkt hat eine Einführung (Stichpunkte als Redestütze), einen Simulator und eine Praxis-Folie
(Berufe / Recht / Alltag).

## Starten
Doppelklick auf `index.html` genügt — die Seite läuft **komplett offline**. Auch die 3D-Ansicht nutzt
eine **lokal mitgelieferte** Bibliothek (`lib/three.min.js`), es ist also keine Internetverbindung nötig.

Alternativ über den mitgelieferten kleinen Server (empfohlen zum Präsentieren):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/serve.ps1 -Port 8848
```

Dann im Browser öffnen: <http://localhost:8848>

## Bedienung
- **→ / Leertaste / Klick auf ›** : nächste Folie · **← / ‹** : zurück · **O** : Übersicht · **Home/End** : erste/letzte
- **⚙ (unten links)** : Einstellungen (Schriftart, Größen, Farben, Übergänge) + **🎨 Theme-Shop** (11 Themes)
- In den Simulatoren: Regler ziehen, Beispiel-Buttons klicken, Knoten im Graph verschieben.
- **3D-Ansicht** (Button unten auf der Netzwerk-Folie): ziehen = drehen · Rad = zoomen · **Strg+F** = Flug-Modus (WASD) · ⚙ eigene Einstellungen.

## Technik
- HTML/CSS/JavaScript, **keine** Build-Tools.
- Diagramme/Gauge/Funktionskurven sind selbst mit SVG gezeichnet.
- Die **3D-Netzwerk-Ansicht** nutzt **Three.js (WebGL)** — lokal unter `lib/three.min.js` (offline-fähig).
- Theme-Shop & Einstellungen werden lokal gespeichert (`localStorage`).

Three.js bei Bedarf neu laden:
```powershell
Invoke-WebRequest -Uri 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js' -OutFile 'lib/three.min.js'
```

## Dateien
- `index.html` – Folien & Overlays
- `styles.css` – Vintage-Design + Theme-Shop
- `app.js` – Navigation, Simulatoren, Einstellungen, Theme-Shop
- `net3d-three.js` – WebGL-3D-Renderer (Three.js)
- `lib/three.min.js` – Three.js r128 (lokal, offline)
- `.claude/serve.ps1` – kleiner lokaler Webserver (optional)
- `checkpoint-2026-06-16/` – Sicherung des vorherigen Stands
