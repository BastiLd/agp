# MVD Web

Website für MVD – Marvel vereinigt Deutschland. Reines HTML/CSS/JS, kein Build-Schritt,
läuft direkt über GitHub Pages.

## Struktur

```
index.html         Startseite V1
v2.html            Startseite V2
creator.html       Creator-Seite V1
creator-v2.html    Creator-Seite V2
css/style.css              Design V1
css/style-creator.css      Ergänzung für creator.html
css/style-v2.css           Design V2
css/style-creator-v2.css   Ergänzung für creator-v2.html
js/main.js         Hamburger-Menü + sanftes Einblenden der Textblöcke
js/main-v2.js      dasselbe für V2, zusätzlich die Topbar beim Scrollen
js/clouds.js       Wolken-Canvas in der Himmelzone von creator.html
js/qa.js           Aufklapp-Verhalten der Frage/Antwort-Blöcke (V1 + V2)
js/footer-scene.js Footer-Landschaft V1: Dünen, Bewuchs, Treibsand, Sandhosen
js/night.js        Sternschnuppen und Glühwürmchen (V1)
js/deco.js         schwebende Objekte je Bereich, gesteuert über data-deco
                   (fest eingefärbt: Play rot, Sprechblasen blau, usw.)
js/icon-colors.js  Schalter: Social-Icons schlicht oder in Markenfarben
js/qa-tiles.js     Fragen als Kacheln mit Antwort-Fenster (V1)
js/section-nav.js  Fortschrittsbalken + Sprungmarken, gesteuert über data-nav
js/hero-video.js   lädt das Hero-Video der V2-Startseite erst bei Bedarf
assets/videos/hero.mp4   Titelvideo der V2-Startseite (16 MB)
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

## Bereiche hinzufügen

Fortschrittsbalken und Sprungmarken rechts rechnen sich selbst aus. Ein neuer
Bereich braucht nur:

```html
<section id="mein-bereich" data-nav="Anzeigename" data-deco="play">
```

* `id` ist das Sprungziel
* `data-nav` ist der Name an der Sprungmarke
* `data-deco` ist optional und bestimmt die schwebende Deko
  (`play`, `bubble`, `key`, `shield`, `gear`, `spark`, mehrere per Komma)

Die Anzahl der Bereiche steht nirgends fest eingetragen. Deko in einem
Bereich wieder loswerden: `data-deco` aus dem HTML löschen.

## Icon-Farben-Schalter entfernen

Der Schalter unten links steckt vollständig in `js/icon-colors.js`. Zum
Entfernen genügt es, das `<script src="js/icon-colors.js">` aus allen vier
Seiten zu löschen und die Datei wegzuwerfen. Danach wird die Klasse
`brand-icons` nie gesetzt, die zugehörigen CSS-Regeln greifen nicht mehr und
die Icons bleiben dauerhaft schlicht.
