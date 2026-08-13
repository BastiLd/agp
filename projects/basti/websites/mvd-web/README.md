# MVD Web

Website für MVD – Marvel Vereinigt Deutschland. Reines HTML/CSS/JS, kein Build-Schritt,
läuft direkt über GitHub Pages.

## Struktur

```
index.html
css/style.css      gesamtes Design
js/main.js         Hamburger-Menü + sanftes Einblenden der Textblöcke
assets/images/
  header-beach.jpg   Strand mit den fünf Schatten   (ausgeliefert, 428 KB)
  middle-night.jpg   Sternenhimmel hinter dem Text  (ausgeliefert,  54 KB)
  dune-1..4.svg      die vier Dünenebenen im Footer (je ~1 KB)
  header-beach.png   Original von ChatGPT (7,4 MB, nicht im Repo)
  footer-sand.png    altes Footer-Bild, wird nicht mehr verwendet
```

## Aufbau der Seite

**Strand-Header → Sternennacht → Dünen-Footer.**

### Header
Das Strandbild mit den fünf Schatten. Unten läuft es über `.hero::after` ins
Seitendunkel aus – die Schatten lösen sich dabei in der Nacht auf. Der Verlauf
startet exakt auf `#67573E`, der am echten Bildrand gemessenen Farbe, deshalb ist
keine Bildkante zu sehen.

### Mitte
`middle-night.jpg` liegt als **fixierte** Ebene hinter dem Text (`.night-backdrop`),
nicht als Hintergrund von `main`. Grund: als Hintergrund von `main` würde das Bild
über die gesamte Seitenhöhe hochskaliert und die Sterne würden verwaschen. Fixiert
bleibt es scharf, und der Text scrollt sanft darüber hinweg. Darüber liegt ein
halbtransparenter dunkler Verlauf – oben und unten deckend, damit die Übergänge zu
Header und Footer sauber bleiben.

### Footer – Dünen
Vier Ebenen aus nahtlos kachelnden SVG-Dünen, die unterschiedlich schnell und teils
gegenläufig driften. Hintere Reihen stehen höher und sind langsamer, dadurch
entsteht Tiefe. Dahinter ein warmer Lichtschein wie eine Sonne knapp unter dem Kamm.

Ein paar Details, die dahinterstecken:

- **Nahtlos:** In jedem SVG ist die Düne, die auf der Kachelnaht liegt, doppelt
  gezeichnet (einmal links außerhalb, einmal rechts). Deshalb passt die Kachel an
  ihre eigene Wiederholung an.
- **Kein Sprung:** Bewegt wird per `transform` um **exakt eine Kachelbreite**. Weil
  sich der Hintergrund genau in diesem Takt wiederholt, ist der Rücksprung
  unsichtbar. `transform` statt `background-position`, weil das auf der GPU läuft
  und auf dem Handy keine dauernden Repaints kostet.
- **Textlesbarkeit:** `.site-footer::after` verlängert den Sockel der vordersten
  Dünenreihe nach oben – gleiche Farbe wie `dune-4`, also keine sichtbare Kante.
  Sorgt nur dafür, dass die Links nie auf einem hellen Dünenkamm landen.
- Bei `prefers-reduced-motion` steht die Animation still.

**Farben ändern?** Einfach den `fill`-Wert im jeweiligen `dune-*.svg` anpassen
(hinten hell `#efe3c6` → vorne dunkel `#5d4023`). Geschwindigkeit und Höhe der
Ebenen stehen in `css/style.css` bei `.dune--1` bis `.dune--4`.

## Bilder

Die Originale von ChatGPT sind sehr groß (Header 7,4 MB, Nachtbild 1,9 MB). Das
hätte die Seite auf dem Handy sehr langsam gemacht, deshalb werden verkleinerte
JPGs ausgeliefert (zusammen **482 KB**, optisch kein Unterschied). Die PNG-Originale
bleiben lokal im Ordner, sind aber über `.gitignore` vom Repo ausgenommen.

**Bild ausgetauscht? Sag mir Bescheid** – es muss neu verkleinert werden, sonst
wirkt die Änderung nicht, weil die Seite die optimierte Datei lädt.

## Hinweis zu den Marvel-Figuren

Die Silhouetten sind an geschützte Marvel-Figuren angelehnt. Als
nicht-kommerzielles Fan-Projekt ist das Risiko gering; im Footer steht deshalb ein
kurzer Disclaimer („Fan-Projekt, keine Verbindung zu Marvel oder Disney").

## Lokal ansehen

`index.html` im Browser öffnen – keine Installation nötig.

## Deployment

Repository `BastiLd/mvd-web`, Pages-Quelle `main` / `/ (root)`.
Nach jedem Push aktualisiert sich <https://bastild.github.io/mvd-web/> automatisch
(ca. 1 Minute).
