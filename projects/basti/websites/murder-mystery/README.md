# AKTENZEICHEN UNGELÖST

**20 reale, gerichtlich entschiedene Kriminalfälle aus 12 europäischen Ländern.**
Ein Ermittlungsspiel für zwei — oder allein. Läuft im Browser, ohne Installation, auf Wunsch offline.

**Live:** https://bastild.github.io/MurderMystery/

---

## Sofort spielen

Doppelklick auf **`index.html`**. Kein Node, kein npm, kein Build.

> **Alte Version im Browser?** Einmal `https://bastild.github.io/MurderMystery/?frisch=1` öffnen.
> Unten auf der Startseite steht die Version — aktuell ist **v3.0**.

---

## Was drin ist

| | |
|---|---|
| **20** Fälle | aus 12 Ländern, 1993 bis 2024 |
| **194** Ermittlungshinweise | jeder mit verlinkter Quelle |
| **113** Verdächtige | mit Stellung, Motivlage und Gegenargumenten |
| **53** Aktendokumente | Polizeiberichte, Gutachten, Protokolle als Faksimile |
| **272** Quellen | Gerichtsurteile, PDFs, Presseartikel |

---

## Die vier Bereiche

### ⚖️ Turnier · Zwei Ermittler
Jeder bekommt eine eigene Akte. Wer zuerst richtig anklagt, holt den Punkt.
Auf **einem Gerät** (Split-Screen, offline) oder auf **zwei Handys** (Raum-Code, synchron).
Als Einzelrunde, **Best of 3** oder **Best of 5**.

### 🔍 Solo-Training
Ein Fall, deine Uhr, kein Gegner. Zählt für deine Statistik.

### 🗄️ Fall-Archiv
Alle Fälle durchstöbern und filtern — nach Land, Jahrzehnt, Schwierigkeit, Länge, Einzeltäter oder Bande.
Volltextsuche inklusive. Jeder Fall komplett nachlesbar; Hinweise und Auflösung sind spoilergeschützt.

### 📊 Statistik
Trefferquote, Ø Hinweise bis zur Lösung, Bestenliste über alle Spieler. Bleibt auf deinem Gerät.

---

## Spielablauf

**1 · Aktenstudium.** Ausführliches Opfer-Dossier, der letzte gesicherte Tag als Zeitachse,
und der vollständige Personenkreis — jede Person mit Stellung, Verhältnis zum Opfer
und dem, was für und gegen sie spricht.

**2 · Ermittlung.** In festen Abständen fällt ein neuer Hinweis: Spurenlage, Rechtsmedizin,
Funkzellen- und GPS-Daten, DNA, Zeugenaussagen, Verhörprotokolle, Prozessberichte.
Parallel schalten sich **Aktendokumente** frei. Über der Akte steht durchgehend,
**wen die Polizei zu diesem Zeitpunkt tatsächlich verdächtigte** — die Ermittler lagen oft lange falsch.

**3 · Anklage.** Jederzeit möglich.

### Wertung

| Ergebnis | Punkte |
|---|---|
| Alle Beteiligten **und ihre Rollen** korrekt | **1,0** · Fall gelöst |
| Täter richtig, Rollen der Helfer daneben | **0,7** · Fall gelöst |
| Nur einen Mitverurteilten erwischt | **0,4** · Fall bleibt offen, weitersuchen erlaubt |
| Unschuldigen beschuldigt | **0** · Ermittlung beendet |

Bei Punktgleichstand gewinnt, wer mit **weniger Hinweisen** ausgekommen ist.

### Skip
Standardmäßig **unbegrenzt und ohne Strafe**. Umstellbar auf „kostet 0,1 Punkte je Skip"
(wird erst vom Gewinn abgezogen, nie negativ) oder ganz aus.

### Zusatzoptionen
**Schwerer Modus** — keine Verdächtigen-Biografien, kein Verdachtsverlauf.
**Blindwertung** — Punktestand bleibt bis zum Rundenende verborgen.

**Tastenkürzel:** `Leertaste` Pause · `S` Skip · `1`/`2` Anklage · `T` Optik · `F` Vollbild · `A` Archiv · `Esc` schließen

**Empfehlung:** 7 Hinweise · 5 Min Aktenstudium · 4 Min Takt → rund 29 Minuten.

---

## Originaldokumente

Jeder Fall bringt **Faksimile** mit: Polizeiberichte, rechtsmedizinische Gutachten,
Vernehmungs- und Gerichtsprotokolle — im Behördenton, mit Briefkopf, Aktenzeichen,
Stempeln und geschwärzten Namen Dritter. Sie sind auf Basis der gerichtlichen
Feststellungen nachgebaut; nichts darin steht, was nicht in den Quellen belegt ist.

Wo es echte Gerichts-PDFs gibt, liegen sie zusätzlich bei. Einmalig herunterladen:

```powershell
cd C:\Users\basti\Documents\MurderRateSpielWeb
.\download-pdfs.ps1
.\push.ps1
```

Danach erscheinen sie direkt im Spiel statt als externer Link.

---

## Umgang mit Namen

Verurteilte erscheinen **exakt so, wie die Presse des jeweiligen Landes sie nennt** —
in Deutschland als Vorname plus Initiale, in Fällen ohne Namensnennung ausschließlich als Rolle.

**Freigesprochene und zu Unrecht Verdächtigte werden nie als Täter dargestellt.**
Im Verdächtigenkreis dürfen sie erscheinen, aber ihre Biografie benennt den Freispruch klar.
Keine Adressen, keine Fotos, keine Namen von Angehörigen oder Kindern.

Ein Fall wurde aus genau diesem Grund **verworfen**: Beim Mord an Frederike von Möhlmann (1981)
hat das Bundesverfassungsgericht die Wiederaufnahme gekippt — der Beschuldigte bleibt
rechtskräftig freigesprochen und durfte deshalb nicht als Täter auftauchen.

---

## Aktualisieren

```powershell
cd C:\Users\basti\Documents\MurderRateSpielWeb
.\push.ps1
```

Das Skript räumt hängengebliebene Git-Sperrdateien weg, committet und pusht in einem Zug.
Nach etwa einer Minute live. Der Service Worker holt die neue Fassung automatisch —
die Zeiten der eingefrorenen alten Version sind vorbei.

**Falls Git blockiert** (`Unable to create index.lock`): Das erledigt `push.ps1` selbst.
Von Hand ginge es so — beachte, dass PowerShell `Remove-Item` braucht, nicht `del /f`:

```powershell
Remove-Item .git\index.lock -Force -ErrorAction SilentlyContinue
```

---

## Fälle ergänzen

Falldaten stehen in **`cases.json`**. Nach dem Bearbeiten `cases.js` neu erzeugen:

```powershell
python -c "import json,io; d=json.load(io.open('cases.json',encoding='utf-8')); io.open('cases.js','w',encoding='utf-8').write('window.CASES = '+json.dumps(d,ensure_ascii=False,indent=1)+';')"
```

Ein Fall braucht:

```
id, land, cc, famous, title, subtitle, file, place, date, year, court,
difficulty (1–4), duration (kurz|mittel|lang), teaser, tags[],
victim { name, dossier, lastDay },
intro[3],
suspects[ { id, name, init, role, bio } ],
truth { taeter[], helfer[] },
policeTrack[ { after, focus, note } ],
clues[ { cat, label, title, text, quote?, src, url, sketch? } ],
docs[ { type, title, authority, ref, date, fields[[k,v]], body[], stamp, afterClue } ],
pdfs[ { t, u } ],
links[ { t, u, kind } ],
solution { who, text, quote, verdict, status }
```

**Hinweis-Kategorien** (je eigene Farbe): `tatort`, `forensik`, `zeuge`, `dokument`,
`motiv`, `verhoer`, `prozess`, `digital`, `alibi`
**Dokumenttypen:** `polizeibericht`, `obduktion`, `gerichtsprotokoll`, `vernehmung`, `gutachten`, `zeitung`

Namen Dritter in Dokumenten mit `███████` schwärzen — das Spiel rendert daraus echte Balken.

---

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Das Spiel: Struktur, Design, Logik |
| `cases.js` | Falldaten (wird geladen) |
| `cases.json` | Falldaten zum Bearbeiten |
| `docs/` | heruntergeladene Original-PDFs |
| `_research/` | Rohdaten der Recherche |
| `manifest.json`, `sw.js`, `icon.svg` | App-Installation und Offline-Betrieb |
| `download-pdfs.ps1` | lädt die Gerichts-PDFs herunter |
| `push.ps1` | committet und pusht, räumt Git-Sperren weg |
| `deploy.ps1` | Erstes Deployment nach GitHub Pages |
| `CHANGELOG.md` | alle 271 Änderungen dieser Fassung |

---

*Alle dargestellten Verfahren sind gerichtlich entschieden. Wo ein Urteil noch nicht rechtskräftig ist,
wird das ausdrücklich vermerkt — insoweit gilt die Unschuldsvermutung. Dieses Spiel dient der
Auseinandersetzung mit realer Strafjustiz, nicht der Unterhaltung auf Kosten der Opfer und ihrer Angehörigen.*
