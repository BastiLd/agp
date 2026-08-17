# Everything Self

Dateisuche in Everything-Geschwindigkeit plus Programmverwaltung mit Restebereinigung –
beides mit Mehrfachauswahl, in einer Oberfläche.

## Starten

```bash
dotnet run --project "EverythingSelf.App"
```

Fertig gebaut liegt das Programm unter
`EverythingSelf.App\bin\Debug\net6.0-windows\EverythingSelf.exe`.

Voraussetzung: .NET 6 Desktop Runtime (ist auf diesem Rechner vorhanden) und ein
laufendes **Everything** von voidtools.

## Die drei Registerkarten

**Suche** – Sucht über den Index von Everything, mit der kompletten Everything-Syntax
(`*.exe`, `size:>100mb`, `dm:today`, `folder:` …). Achtung: Die Funktionsnamen sind
**englisch**, auch bei deutscher Everything-Oberfläche. Mehrere Zeilen lassen sich mit
Strg/Umschalt auswählen und gemeinsam in den Papierkorb verschieben.

**Programme** – Liste aller installierten Programme aus der Registry, mit Häkchen für
Mehrfachauswahl. Die Deinstallationen laufen nacheinander ab; danach sucht das Programm
automatisch nach Überresten und zeigt sie zur Bestätigung an.

**Edge & WebView2** – Zeigt jeden Edge-Bestandteil einzeln. Jede Karte hat ein
ⓘ-Symbol, das erklärt: was der Bestandteil ist, was die Aktion genau tut, welche Befehle
dabei laufen und wie man es rückgängig macht.

## Wie die Suche technisch funktioniert

Das Programm spricht über die öffentlich dokumentierte Fensterschnittstelle von Everything
(`WM_COPYDATA` an die Fensterklasse `EVERYTHING_TASKBAR_NOTIFICATION`) direkt mit dem
laufenden Everything-Prozess. Es wird **kein** Everything-Quellcode und **keine**
`Everything64.dll` verwendet – deshalb ist auch kein SDK-Download nötig.

Welche der möglichen Protokollvarianten der laufende Everything-Prozess erwartet, wird
beim ersten Suchlauf automatisch ermittelt (`EverythingClient.BuildCandidates`) und danach
beibehalten.

## Warum das Programm nicht als Administrator läuft

Windows blockiert (UIPI) Fensternachrichten von einem normalen Prozess an einen
Prozess mit erhöhten Rechten. Liefe die Oberfläche als Administrator, käme die Antwort
von Everything nie an und die Suche wäre tot. Deshalb läuft die Oberfläche normal, und
privilegierte Eingriffe – Registry unter HKLM, Dienste, geplante Aufgaben – wandern in
einen kurzlebigen erhöhten Kindprozess (`ElevatedRunner`), also genau eine UAC-Rückfrage
pro Vorgang. Die auszuführenden Befehle werden vorher im Klartext angezeigt.

## Sicherheitsnetz beim Löschen

* Dateien und Ordner gehen in den **Papierkorb** (`SHFileOperation` mit `FOF_ALLOWUNDO`),
  endgültig nur auf ausdrückliche Auswahl.
* Bei der Restebereinigung sind nur **eindeutige** Treffer vorausgewählt; alles mit der
  Bewertung „prüfen" muss bewusst angehakt werden.
* Registry-Schlüssel lassen sich nicht in den Papierkorb legen – die sind nach dem
  Entfernen weg. Das steht auch so im Dialog.
* Geschützte Systemordner (Windows, Program Files selbst, Common Files …) werden nie
  als Überrest vorgeschlagen.

## Zeichenkodierung

Alle Quelldateien (`.cs`, `.xaml`, `.csproj`, `.manifest`, `.md`) liegen als **UTF-8 mit
BOM** vor. Das BOM ist kein Schönheitsfehler, sondern nötig: Der XAML-Compiler und
Windows PowerShell 5.1 erkennen UTF-8 sonst nicht zuverlässig und lesen die Dateien als
ANSI – aus „Größe" würde dann „GrÃ¶ÃŸe".

Drei Stellen, an denen Umlaute sonst kaputtgehen würden, sind gezielt abgesichert:

* **Erhöhte Befehle** (`ElevatedRunner`) laufen über ein PowerShell-Skript, nicht über
  eine Batchdatei. `cmd.exe` liest `.cmd`-Dateien in der OEM-Codepage – ein Ordner mit
  Umlaut im Namen käme dort verstümmelt an. Das `.ps1` wird mit BOM geschrieben und
  damit garantiert als UTF-8 gelesen.
* **Ausgaben von Konsolenprogrammen** (`schtasks` & Co.) werden über
  `cmd /c "chcp 65001 & …"` geholt und als UTF-8 dekodiert.
* **Das Protokoll** des erhöhten Laufs wird als UTF-8 geschrieben und ebenso gelesen.

Die Suche selbst ist davon unberührt: Sie tauscht mit Everything UTF-16 aus, weshalb
Dateinamen wie `01_Einführung_Diagramme.pdf` sowohl gefunden als auch korrekt angezeigt
werden.

## Projekte

| Projekt | Zweck |
|---|---|
| `EverythingSelf.Core` | Suche (IPC), Programmliste, Restebereinigung, Edge-Analyse, Rechteerhöhung |
| `EverythingSelf.App` | WPF-Oberfläche |
| `EverythingSelf.Probe` | Konsolen-Diagnose ohne Oberfläche |

Die Diagnose prüft alle drei Kernbausteine auf einmal und ist bei Problemen der
schnellste Weg zur Ursache:

```bash
dotnet run --project "EverythingSelf.Probe" -- "*.exe"
```

Unerwartete Fehler der Oberfläche landen zusätzlich in
`%LOCALAPPDATA%\EverythingSelf\fehler.log`.

## Zwei Befunde von diesem Rechner

**Der Everything-Index ist doppelt.** In `%APPDATA%\Everything\Everything.ini` sind C:, D:,
E: und S: sowohl als NTFS-Volume als auch als Ordner-Index eingetragen. Dadurch erscheint
jede Datei zweimal – auch im normalen Everything. Die Option „Duplikate ausblenden" fängt
das ab; sauber beheben lässt es sich in Everything unter *Extras → Optionen → Indizes*.

**Edge ist bereits deinstalliert.** In
`C:\Program Files (x86)\Microsoft\Edge\Application\142.0.3595.53` liegt keine `msedge.exe`
mehr, nur eine leere Ordnerhülle. Die Favicon-Downloads kommen aus der WebView2-Laufzeit:
`C:\Program Files (x86)\Microsoft\EdgeCore\151.0.4129.78\msedge.exe`. Die wird von
Windows-Komponenten (Widgets, Startmenü-Suche) im Hintergrund gestartet und teilt sich
Profil und Downloadverlauf mit dem früheren Browser. Deshalb taucht das Download-Fenster
mit Favicons auf, obwohl Edge nicht mehr da ist.
