# Restore Inventory

Fabric-Mod fuer Minecraft, die das Spieler-Inventar regelmaessig sichert und
spaeter wiederhergestellen kann (z. B. wenn man in Lava faellt).

## Features

- Vier Save-Slots pro Spieler, jeweils mit Ringpuffer der letzten N Saves:
  **Auto (kurz)**, **Auto (lang)**, **Manuell** und ein eigener **Tod**-Slot.
- Auto-Save alle X Minuten in die beiden Auto-Slots (konfigurierbar).
- **Auto-Save direkt vor dem Tod** in den eigenen Tod-Slot
  (`ServerLivingEntityEvents.ALLOW_DEATH`) - verdraengt keine manuellen Saves mehr.
- **Restore-Undo**: `/restoreinv undo` macht die letzte Wiederherstellung
  rueckgaengig (vor jedem Restore wird das aktuelle Inventar gesichert).
- **Inventar-Vorschau**: Klick auf einen Save zeigt Ruestung, Hauptinventar,
  Hotbar und Offhand in einer 9x6-GUI bevor wirklich wiederhergestellt wird.
- **Tooltips mit Zeitstempel** plus Item-Anzahl und das beste Tool ("Top-Tool").
- **Pin-Funktion**: Rechtsklick auf einen Save schuetzt ihn vor Ueberschreiben.
- **Konfigurierbare Saves pro Slot** (1..9) - greift sofort auf bestehende Saves.
- **Restore-Sound** (an/aus) und **Per-Spieler-Settings**.
- **Mehrsprachig (i18n)**: Englisch als Default, Deutsch mitgeliefert
  (`assets/restoreinv/lang/*.json`). Weitere Sprachen per Resourcepack moeglich.
- **Asynchrones Speichern**: NBT-Serialisierung und Datei-I/O laufen abseits des
  Server-Threads (keine TPS-Spikes bei vielen Spielern).
- **Editierbare Config** als `config/restoreinv.json` (mit Migration aus altem
  binaeren `restoreinv/config.dat`).

### Rechte / Permissions

Standardmaessig ueber Vanilla-OP (Level 2), optional ueber
[fabric-permissions-api](https://github.com/lucko/fabric-permissions-api):

| Node                 | Wirkung                                                      |
| -------------------- | ----------------------------------------------------------- |
| `restoreinv.admin`   | Config-GUI, Admin-Panel, fremde Inventare wiederherstellen  |
| `restoreinv.restore` | Eigenes Inventar wiederherstellen (`/restoreinv 1..4`, undo)|

Ist die Lib nicht installiert, gilt der OP-Fallback. `/restoreinv config` und das
Admin-Panel sind so **nie** fuer normale Spieler zugaenglich.

### Befehle

| Befehl                       | Wirkung                                            |
| ---------------------------- | -------------------------------------------------- |
| `/restoreinv 1\|2\|3\|4`     | Restore aus Auto-kurz / Auto-lang / Manuell / Tod  |
| `/restoreinv save`           | Inventar in den Manuell-Slot speichern             |
| `/restoreinv undo`           | Letzte Wiederherstellung rueckgaengig machen       |
| `/restoreinv saves`          | Eigene Save-Liste (GUI) oeffnen                    |
| `/restoreinv config`         | Config-GUI oeffnen (nur Admins)                    |
| `/restoreinv version`        | Mod- und MC-Version anzeigen                       |

Aliase: **`/rinv`** (kurz) und **`/restoreInv`** (alter Name, Abwaertskompatibilitaet).

## Unterstuetzte Versionen

Das Release enthaelt **drei JARs** — je eine deckt einen ganzen Versionsbereich ab.
Lade einfach die JAR, deren Bereich deine MC-Version enthaelt:

| Release-JAR                                 | Deckt ab          | Compat-Tree       |
| ------------------------------------------- | ----------------- | ----------------- |
| `RestoreInventory-mc1.21-1.21.1-<v>.jar`    | 1.21 - 1.21.1     | `shared/api-old/` |
| `RestoreInventory-mc1.21.2-1.21.4-<v>.jar`  | 1.21.2 - 1.21.4   | `shared/api-old/` |
| `RestoreInventory-mc1.21.9-1.21.11-<v>.jar` | 1.21.9 - 1.21.11  | `shared/api-new/` |

Die `fabric.mod.json` jeder JAR deklariert den passenden `minecraft`-Bereich. Eine
einzelne JAR fuer **alles** ist nicht moeglich: zwischen 1.21.4 und 1.21.9 gibt es einen
harten NBT-/Storage-API-Bruch (`Inventories.writeNbt` -> `WriteView`). Die alte Familie
wird zusaetzlich bei **1.21.2** geteilt (groesstes Update der Reihe). Die Luecke
1.21.5 - 1.21.8 ist nicht unterstuetzt.

Der gesamte Code liegt einmalig in `shared/common`; pro API-Familie gibt es nur eine
`PlatformCompat`-Klasse, die die versionsspezifischen API-Unterschiede
(NBT-Serialisierung, Armor-Zugriff, Registry-/Server-Lookup) kapselt.

**Build-Matrix:** Neben den drei Umbrella-Builds (`versions/old1`, `versions/old2`,
`versions/new`) existieren weiterhin 8 Per-Version-Subprojekte (`versions/1.21` ...
`versions/1.21.11`). Diese werden mitgebaut, dienen aber nur als **Compile-Frühwarnung**
pro Version und landen **nicht** im Release.

## Gespeicherte Daten & Mod-Updates

Alle Saves liegen im **Server-/Spielordner**, nicht in der JAR:

- `restoreinv/<uuid>/slot_n.dat` + `restoreinv/<uuid>/last_saves.dat` (Inventare, NBT)
- `config/restoreinv.json` (globale Konfiguration)

Ein **Mod-Update** (JAR austauschen) **loescht diese Daten nicht** — gespeicherte Slots
bleiben erhalten. Die Dateien tragen einen `format`-Marker; aeltere Daten werden
abwaertskompatibel gelesen, und der Save-Ordner wird nie geloescht.

> Hinweis: Wechselt man auf **derselben Welt** ueber die Familiengrenze hinweg (alte JAR
> 1.21.x ↔ neue JAR 1.21.9+), koennen Items beim Wiederherstellen verrutschen, da sich das
> interne Inventar-Layout zwischen den MC-Generationen unterscheidet. Innerhalb einer
> Familie (normaler Update-Pfad) bleibt alles unveraendert erhalten.

## Repo-Struktur

```
.
├── shared/
│   ├── common/                # GESAMTER gemeinsamer Code (Logik + GUIs + lang/)
│   │   ├── src/main/java/...
│   │   └── src/main/resources/
│   ├── api-old/               # NUR PlatformCompat fuer 1.21 - 1.21.4 (alte NBT-API)
│   │   └── src/main/java/.../PlatformCompat.java
│   └── api-new/               # NUR PlatformCompat fuer 1.21.9+ (neue NBT-API)
│       └── src/main/java/.../PlatformCompat.java
├── versions/
│   ├── 1.21/                  # Subprojekt (gradle.properties + build.gradle)
│   ├── 1.21.1/
│   ├── 1.21.2/
│   ├── 1.21.3/
│   ├── 1.21.4/
│   ├── 1.21.9/
│   ├── 1.21.10/
│   └── 1.21.11/
├── gradle/
│   ├── mod-build.gradle       # gemeinsame Build-Logik fuer alle Subprojekte
│   └── shared-sources.gradle  # Verbindet Subprojekt mit shared/<tree>/
├── build.gradle               # sammelt alle JARs in build/libs/
├── settings.gradle            # entdeckt versions/* automatisch
└── gradle.properties          # globale Mod-Metadaten (mod_version, group, ...)
```

## Build

Multi-Version-Build mit einem Befehl (alle 8 Versionen parallel):

```bash
./gradlew build           # Linux / macOS / Git Bash
.\gradlew.bat build       # Windows
```

JARs liegen am Ende sowohl in `build/libs/` (alle Versionen gesammelt) als
auch unter `versions/<mc>/build/libs/` (pro Version).

Nur eine Version bauen:

```bash
./gradlew :mc-1.21.11:build
./gradlew :mc-1.21.1:build
```

Voraussetzung: JDK 21. Gradle holt sich sonst per Toolchain ein passendes.

## Mod-Version erhoehen

```bash
python bump_version.py            # patch +1
python bump_version.py minor      # 2.3.0 -> 2.4.0
python bump_version.py major      # 2.3.0 -> 3.0.0
python bump_version.py 3.1.4      # explizit
python bump_version.py patch --tag      # zusaetzlich Git-Tag v<version>
python bump_version.py patch --commit   # Commit + Tag in einem Schritt
```

Anschliessend `git push --follow-tags` -- dann baut die GitHub-Action und
haengt **alle JARs aller Versionen** ans Release.

## Fabric-Versionen aktualisieren

```bash
python update_fabric.py            # alle Subprojekte aktualisieren
python update_fabric.py 1.21.11    # nur eine Version
python update_fabric.py --dry-run
```

## Release-Workflow

1. `python bump_version.py minor --commit`
2. `git push --follow-tags`
3. GitHub-Action baut alle Versionen und legt das Release samt JARs an.

## Lokales JDK setzen (optional)

Falls Gradle dein JDK nicht findet, lege `gradle-local.properties` an:

```properties
org.gradle.java.home=C:\\Program Files\\Java\\jdk-21
```

Die Datei ist via `.gitignore` ausgeschlossen.
