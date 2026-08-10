# Requirements Document

## Introduction

Der „Discord Archive Viewer" ist eine lokale Windows-Desktop-Anwendung, die Exporte von DiscordChatExporter (JSON, HTML sowie Assets/Media) anzeigt. Die App soll eine Discord-ähnliche Benutzeroberfläche im Dark Mode bieten, mehrere Channels gleichzeitig verwalten, rekursiv nach Channel-Ordnern scannen, eine globale und kanalbezogene Suche bereitstellen und dabei die Originaldateien strikt unangetastet lassen. Die App arbeitet vollständig offline und nutzt keine Cloud- oder Upload-Funktionen.

Technologisch basiert die Anwendung auf Electron, React, TypeScript und Vite, wird mit electron-builder als Portable EXE und als Installer gepackt und enthält einen wiederverwendbaren Parser in TypeScript. Sicherheitsarchitektur und Sandboxing (contextIsolation, kein nodeIntegration, sichere Preload-API) sind verbindlich.

## Glossary

- **Discord_Archive_Viewer**: Die gesamte Desktop-Anwendung, bestehend aus Main- und Renderer-Prozess.
- **Main_Process**: Der Electron-Hauptprozess, der Dateisystemzugriffe ausführt.
- **Renderer_Process**: Der Electron-Renderer-Prozess, der die React-basierte Benutzeroberfläche darstellt.
- **Preload_API**: Die kontrollierte Schnittstelle, über die der Renderer mit dem Main-Prozess kommuniziert.
- **Folder_Scanner**: Das Modul im Main-Process, das Ordner rekursiv nach Channel-Exporten durchsucht.
- **Channel_Folder**: Ein Verzeichnis, das mindestens eine Discord-Export-JSON-Datei enthält und einen einzelnen Channel repräsentiert.
- **Root_Folder**: Ein vom Nutzer ausgewähltes übergeordnetes Verzeichnis, das ein oder mehrere Channel_Folder enthalten kann (auch tief verschachtelt).
- **Export_JSON**: Eine von DiscordChatExporter erzeugte JSON-Datei mit Channel- und Nachrichtendaten.
- **Export_HTML**: Eine von DiscordChatExporter erzeugte HTML-Datei desselben Channels (Backup/Referenz).
- **Parser**: Das TypeScript-Modul, das Export_JSON in das interne Channel-Modell überführt.
- **Channel_Model**: Das interne Datenmodell eines Channels gemäß Requirement 7.
- **Message**: Ein Nachrichteneintrag innerhalb eines Channel_Model.
- **Channel_List**: Die Seitenleiste mit allen geladenen Channels, durch die der Nutzer wechseln kann.
- **Chat_View**: Die mittlere Ansicht, in der die Nachrichten eines aktiven Channels angezeigt werden.
- **Media_Renderer**: Die UI-Komponente, die Bilder, GIFs, Videos, Audios und Dateianhänge darstellt.
- **Search_Engine**: Das Modul, das Suche innerhalb eines Channels und global über alle Channels durchführt.
- **Settings_Store**: Der lokale Speicher für Nutzereinstellungen (z. B. zuletzt geladene Ordner, Fenstergröße, Theme).
- **Build_Pipeline**: Die electron-builder-Konfiguration und npm-Scripte zum Erzeugen von Portable EXE und Installer.
- **User**: Die Person, die den Discord_Archive_Viewer bedient.

## Requirements

### Requirement 1: Startseite und Hauptaktionen

**User Story:** Als User möchte ich auf der Startseite alle wichtigen Aktionen für die Ordnerverwaltung direkt erreichen, damit ich schnell Channel-Ordner hinzufügen, scannen oder entfernen kann.

#### Acceptance Criteria

1. THE Discord_Archive_Viewer SHALL auf der Startseite die vier Aktionen „Channel-Ordner hinzufügen", „Hauptordner hinzufügen", „Neu scannen" und „Ordner entfernen" als jederzeit sichtbare und auslösbare Bedienelemente anzeigen.
2. THE Discord_Archive_Viewer SHALL auf der Startseite eine Liste aller aktuell registrierten Channels mit den Feldern Channel-Name (nicht leer), Server-/Guild-Name (nicht leer) und Nachrichtenanzahl (ganzzahlig, ≥ 0) anzeigen; sind keine Channels registriert, SHALL stattdessen ein Hinweistext angezeigt werden, der erkennen lässt, dass noch keine Ordner registriert sind.
3. WHEN der User die Aktion „Channel-Ordner hinzufügen" auslöst, THE Discord_Archive_Viewer SHALL einen System-Dialog zur Auswahl eines oder mehrerer Channel_Folder öffnen und nach Bestätigung der Auswahl die ausgewählten Channel_Folder in der App-Registrierung erfassen sowie die Channel-Liste aktualisieren.
4. WHEN der User die Aktion „Hauptordner hinzufügen" auslöst, THE Discord_Archive_Viewer SHALL einen System-Dialog zur Auswahl genau eines Root_Folder öffnen und nach Bestätigung der Auswahl den ausgewählten Root_Folder in der App-Registrierung erfassen sowie die Channel-Liste aktualisieren.
5. WHEN der User die Aktion „Neu scannen" auslöst, THE Discord_Archive_Viewer SHALL alle bereits registrierten Ordner erneut durch den Folder_Scanner verarbeiten, während der Verarbeitung eine sichtbare Fortschritts- oder Wartanzeige darstellen und nach Abschluss des Scans die Channel-Liste vollständig aktualisieren.
6. WHEN der User die Aktion „Ordner entfernen" auf einem Eintrag der Channel-Liste auslöst und die daraufhin angezeigte Bestätigungsabfrage positiv beantwortet, THE Discord_Archive_Viewer SHALL den entsprechenden Channel_Folder oder Root_Folder aus der App-Registrierung entfernen, ohne Dateien oder Verzeichnisse auf der Festplatte zu verändern, und die Channel-Liste aktualisieren.
7. IF der User den System-Dialog für „Channel-Ordner hinzufügen" oder „Hauptordner hinzufügen" abbricht oder ohne Auswahl schließt, THEN THE Discord_Archive_Viewer SHALL keinen Ordner registrieren, die Channel-Liste unverändert lassen und zur Startseite zurückkehren.
8. IF ein vom User über einen System-Dialog ausgewählter Ordner nicht als gültiger Channel_Folder bzw. Root_Folder erkannt wird, THEN THE Discord_Archive_Viewer SHALL den Ordner nicht in die App-Registrierung aufnehmen und eine Fehlermeldung anzeigen, die den Grund der Ablehnung erkennen lässt, ohne den bisherigen Zustand der Channel-Liste zu verändern.

### Requirement 2: Ordnerauswahl und rekursives Scannen

**User Story:** Als User möchte ich einzelne Channel-Ordner oder einen Hauptordner mit beliebig tief verschachtelten Channel-Ordnern auswählen können, damit ich meine bestehende Export-Struktur ohne Umsortieren nutzen kann.

#### Acceptance Criteria

1. THE Discord_Archive_Viewer SHALL die Mehrfachauswahl von einem oder mehreren Channel_Folder im System-Dialog unterstützen, wobei jeder ausgewählte Pfad als absoluter Verzeichnispfad an den Folder_Scanner übergeben wird.
2. WHEN ein Root_Folder ausgewählt wird, THE Folder_Scanner SHALL das Verzeichnis rekursiv bis zu einer Tiefe von maximal 20 Verzeichnisebenen durchsuchen und jeden Unterordner, der mindestens eine Datei mit der Endung .json als Export_JSON enthält, als Channel_Folder erkennen.
3. WHEN ein Channel_Folder erkannt wird, THE Folder_Scanner SHALL die zugehörige Export_JSON, eine optional im selben Verzeichnis vorhandene Datei mit Endung .html als Export_HTML sowie alle direkten Unterordner als Asset- und Media-Verzeichnisse diesem Channel_Folder zuordnen.
4. WHERE in einem Channel_Folder mehrere Export_JSON-Dateien liegen, THE Folder_Scanner SHALL jede einzelne Export_JSON als eigenständigen Channel_Folder-Eintrag verarbeiten und über den vollständigen absoluten Dateipfad eindeutig identifizieren.
5. WHEN ein Channel_Folder mit identischem absolutem Dateipfad bereits registriert ist und erneut hinzugefügt wird, THE Discord_Archive_Viewer SHALL keinen zweiten Eintrag erzeugen und stattdessen die zugeordneten Metadaten (Export_JSON, Export_HTML, Asset- und Media-Verzeichnisse) durch die beim erneuten Scannen ermittelten Werte ersetzen.
6. IF während des Scannens ein Verzeichnis aufgrund fehlender Leseberechtigung oder eines I/O-Fehlers nicht lesbar ist, THEN THE Folder_Scanner SHALL diesen Pfad überspringen, eine Warnmeldung mit dem betroffenen absoluten Pfad und einer Fehlerursache in der Benutzeroberfläche anzeigen und das Scannen der übrigen Verzeichnisse ohne Abbruch fortsetzen.
7. IF ein ausgewählter Root_Folder oder Channel_Folder keine Export_JSON enthält, THEN THE Discord_Archive_Viewer SHALL eine Hinweismeldung mit dem betroffenen absoluten Pfad anzeigen und keinen Channel_Folder-Eintrag registrieren.

### Requirement 3: Discord-ähnliche Chat-Ansicht

**User Story:** Als User möchte ich eine Oberfläche im Discord-Stil mit Dark Mode, damit ich die Chats vertraut und übersichtlich lesen kann.

#### Acceptance Criteria

1. THE Discord_Archive_Viewer SHALL beim ersten Start und bei jedem nachfolgenden Start die Benutzeroberfläche im Dark Mode mit dunklem Hintergrund und hellem Text als Standardansicht anzeigen.
2. THE Discord_Archive_Viewer SHALL ein dreigeteiltes Layout bestehend aus linker Channel_List, mittlerer Chat_View und oberer Kopfzeile mit Channel-Name verwenden, wobei alle drei Bereiche gleichzeitig sichtbar sind.
3. THE Channel_List SHALL alle geladenen Channels in einer scrollbaren Liste darstellen, sodass bei mehr Channels als sichtbarer Listenhöhe vertikales Scrollen möglich ist und jeder Channel per einzelnem Mausklick auswählbar ist.
4. WHEN der User einen Channel in der Channel_List per Klick auswählt, THE Chat_View SHALL innerhalb von maximal 2 Sekunden die Nachrichten dieses Channels anzeigen und in der Kopfzeile den Channel-Namen sowie, falls vorhanden, den Guild-Namen einblenden.
5. WHEN ein Channel mit mindestens einer Nachricht geöffnet wird, THE Chat_View SHALL automatisch zur neuesten Nachricht am unteren Ende der Nachrichtenliste scrollen.
6. WHILE ein Channel in der Chat_View geöffnet ist, THE Chat_View SHALL die Buttons „Zum Anfang" und „Nach unten" sichtbar anzeigen, wobei ein Klick auf „Zum Anfang" die Ansicht zur ersten Nachricht und ein Klick auf „Nach unten" zur letzten Nachricht des Channels scrollt.
7. WHERE für den aktiven Channel eine Export_HTML existiert, THE Chat_View SHALL einen aktivierten Button „In HTML öffnen" anzeigen, der bei Klick die Datei im Standardbrowser des Betriebssystems öffnet.
8. IF für den aktiven Channel keine Export_HTML existiert, THEN THE Chat_View SHALL den Button „In HTML öffnen" deaktiviert anzeigen oder ausblenden.
9. IF ein ausgewählter Channel keine Nachrichten enthält, THEN THE Chat_View SHALL einen Hinweistext anzeigen, der den User darüber informiert, dass keine Nachrichten vorhanden sind, und das Auto-Scrollen zur neuesten Nachricht unterlassen.
10. IF das Laden der Nachrichten eines ausgewählten Channels fehlschlägt, THEN THE Chat_View SHALL eine Fehlermeldung anzeigen, die den User über den Fehler informiert, und den vorherigen Anzeigezustand der Kopfzeile beibehalten.
11. IF das Öffnen der Export_HTML im Standardbrowser fehlschlägt, THEN THE Chat_View SHALL eine Fehlermeldung anzeigen, die den User über den fehlgeschlagenen Öffnungsvorgang informiert, ohne die aktuelle Ansicht zu schließen.

### Requirement 4: Nachrichtensortierung und -darstellung

**User Story:** Als User möchte ich Nachrichten in chronologischer Reihenfolge mit allen Discord-typischen Metadaten sehen, damit ich Verläufe natürlich nachvollziehen kann.

#### Acceptance Criteria

1. THE Chat_View SHALL alle Nachrichten eines Channels nach timestamp aufsteigend (älteste oben, neueste unten) sortieren, wobei bei identischen Timestamps die Nachricht mit der niedrigeren Message-ID zuerst angezeigt wird.
2. THE Chat_View SHALL pro Nachricht den Avatar links (mit Platzhalter-Avatar, falls kein Avatar verfügbar ist), den Autorennamen, den Timestamp im Format YYYY-MM-DD HH:MM:SS und den Nachrichtentext anzeigen.
3. IF eine Nachricht keinen Autorennamen, keinen Timestamp oder keinen Nachrichtentext enthält, THEN THE Chat_View SHALL die Nachricht mit einem sichtbaren Platzhalter („Unbekannter Autor", „Unbekannter Zeitpunkt" bzw. leerer Textbereich) anzeigen, ohne die Darstellung anderer Nachrichten zu unterbrechen.
4. WHERE eine Nachricht ein editedTimestamp besitzt, THE Chat_View SHALL eine Markierung „bearbeitet" mit dem Bearbeitungszeitpunkt im Format YYYY-MM-DD HH:MM:SS neben dem ursprünglichen Timestamp anzeigen.
5. THE Chat_View SHALL Markdown-Formatierungen (mindestens Fett, Kursiv, Durchgestrichen, Inline-Code, Code-Blöcke, Zitate, Listen) gerendert darstellen sowie URLs als klickbare Hyperlinks darstellen, die in einem externen Browser geöffnet werden.
6. IF eine Markdown-Formatierung ungültig oder nicht unterstützt ist, THEN THE Chat_View SHALL den betroffenen Textabschnitt als unformatierten Klartext anzeigen, ohne den Rendering-Vorgang der restlichen Nachricht abzubrechen.
7. WHERE eine Nachricht ein replyTo-Feld enthält, THE Chat_View SHALL die referenzierte Nachricht als zitierten Block (Autorenname und Nachrichtentext, gekürzt auf maximal 200 Zeichen mit Auslassungszeichen bei Überlänge) oberhalb des Antworttextes anzeigen.
8. IF die referenzierte Nachricht eines replyTo-Feldes nicht im Archiv vorhanden ist, THEN THE Chat_View SHALL anstelle des Zitatblocks den Hinweis „Ursprüngliche Nachricht nicht verfügbar" anzeigen.
9. WHERE eine Nachricht Reactions enthält, THE Chat_View SHALL pro Reaction das Emoji oder die Custom-Emoji-Grafik mit der zugehörigen Anzahl (ganzzahlig, mindestens 1) anzeigen.
10. WHERE eine Nachricht Embeds enthält, THE Chat_View SHALL jedes Embed als eigene Karte mit Titel, Beschreibung, Bild, Autor und Footer darstellen, wobei nur die im Embed tatsächlich vorhandenen Felder gerendert werden und fehlende Felder ausgelassen werden.

### Requirement 5: Mediendarstellung

**User Story:** Als User möchte ich Bilder, GIFs, Videos, Audios und Dateien wie in Discord sehen und abspielen, damit Anhänge im Kontext der Nachricht erlebbar bleiben.

#### Acceptance Criteria

1. WHEN ein Nachrichtenanhang ein Bildformat (PNG, JPG, JPEG, WEBP) mit einer Dateigröße bis maximal 25 MB ist, THE Media_Renderer SHALL das Bild inline im Nachrichtenfluss mit einer maximalen Anzeigebreite von 400 Pixeln und maximalen Anzeigehöhe von 300 Pixeln unter Beibehaltung des Seitenverhältnisses anzeigen.
2. WHEN ein Nachrichtenanhang das Format GIF mit einer Dateigröße bis maximal 25 MB besitzt, THE Media_Renderer SHALL das GIF animiert mit einer maximalen Anzeigebreite von 400 Pixeln und maximalen Anzeigehöhe von 300 Pixeln in Endlosschleife abspielen.
3. WHEN ein Nachrichtenanhang ein Videoformat (MP4, WEBM, MOV) mit einer Dateigröße bis maximal 100 MB ist, THE Media_Renderer SHALL einen abspielbaren Videoplayer mit Standard-Controls (Play/Pause, Lautstärke, Fortschrittsbalken, Vollbild) einbetten.
4. WHEN ein Nachrichtenanhang ein Audioformat (MP3, OGG, WAV, M4A) mit einer Dateigröße bis maximal 50 MB ist, THE Media_Renderer SHALL einen abspielbaren Audioplayer mit Standard-Controls (Play/Pause, Lautstärke, Fortschrittsbalken) einbetten.
5. WHEN ein Nachrichtenanhang ein anderes Format (z. B. PDF, ZIP, DOCX, XLSX, TXT) ist, THE Media_Renderer SHALL eine Datei-Karte mit Dateiname (gekürzt auf maximal 64 Zeichen mit Auslassungszeichen bei Überlänge), Dateigröße in lesbarem Format (Bytes, KB, MB, GB) und den Aktionen „Öffnen" und „Im Explorer anzeigen" darstellen.
6. WHEN der User die Aktion „Öffnen" auf einer Datei-Karte auslöst, THE Main_Process SHALL die Datei mit der vom Betriebssystem zugewiesenen Standardanwendung innerhalb von 2 Sekunden öffnen.
7. IF beim Öffnen einer Datei über die Aktion „Öffnen" keine Standardanwendung verfügbar ist oder das Öffnen fehlschlägt, THEN THE Main_Process SHALL eine Fehlermeldung mit Hinweis auf die fehlgeschlagene Aktion und dem betroffenen Dateinamen anzeigen, ohne die Datei-Karte zu entfernen.
8. WHEN der User die Aktion „Im Explorer anzeigen" auf einer Datei-Karte auslöst, THE Main_Process SHALL den Windows-Explorer mit selektierter Datei innerhalb von 2 Sekunden öffnen.
9. IF ein referenzierter Anhang im Dateisystem nicht gefunden wird, THEN THE Media_Renderer SHALL eine Karte mit dem Hinweis „Datei fehlt", dem ursprünglichen Dateinamen und deaktivierten Aktionen „Öffnen" und „Im Explorer anzeigen" anzeigen.
10. IF ein Nachrichtenanhang die für sein Format definierte maximale Dateigröße überschreitet, THEN THE Media_Renderer SHALL anstelle der Inline-Vorschau eine Datei-Karte mit Dateiname, Dateigröße und einem Hinweis auf die überschrittene Maximalgröße darstellen.

### Requirement 6: Suche im aktiven Channel und global

**User Story:** Als User möchte ich nach Text, Nutzer und Datum suchen können, sowohl in einem einzelnen Channel als auch über alle Channels hinweg, damit ich Inhalte schnell wiederfinde.

#### Acceptance Criteria

1. THE Search_Engine SHALL zwei Suchmodi anbieten: einen Modus „aktueller Channel", der ausschließlich Nachrichten des aktuell geöffneten Channels durchsucht, und einen Modus „global", der Nachrichten aller im Discord_Archive_Viewer geladenen Channels durchsucht.
2. THE Search_Engine SHALL eine Volltextsuche im Nachrichtentext durchführen, bei der per Default Groß-/Kleinschreibung ignoriert wird und der User über eine Checkbox die Groß-/Kleinschreibung aktivieren kann.
3. WHEN der User einen Suchbegriff mit einer Länge zwischen 1 und 200 Zeichen eingibt, THE Search_Engine SHALL alle Nachrichten zurückgeben, deren Nachrichtentext den Suchbegriff als Teilstring enthält.
4. IF der eingegebene Suchbegriff leer ist oder ausschließlich aus Whitespace-Zeichen besteht, THEN THE Search_Engine SHALL keine Volltextsuche ausführen und die Trefferliste leeren, sofern keine anderen aktiven Filter (Autor oder Datum) gesetzt sind.
5. THE Search_Engine SHALL einen Filter nach Autor anbieten, der den eingegebenen Wert sowohl gegen den Username als auch gegen die authorId der Nachricht prüft und Nachrichten zurückgibt, bei denen einer der beiden Werte exakt übereinstimmt.
6. THE Search_Engine SHALL einen Datumsfilter mit den Feldern „Von" und „Bis" anbieten, der Nachrichten zurückgibt, deren timestamp größer oder gleich dem „Von"-Wert (00:00:00 Uhr des angegebenen Tages) und kleiner oder gleich dem „Bis"-Wert (23:59:59 Uhr des angegebenen Tages) ist; einzelne Felder dürfen leer bleiben und werden dann nicht als Einschränkung angewendet.
7. IF der „Von"-Wert nach dem „Bis"-Wert liegt, THEN THE Search_Engine SHALL den Datumsfilter nicht anwenden und eine Fehlermeldung anzeigen, die auf den ungültigen Datumsbereich hinweist.
8. WHEN der User mehrere Filter gleichzeitig setzt (Volltext, Autor, Datum), THE Search_Engine SHALL ausschließlich Nachrichten zurückgeben, die alle aktiven Filter gleichzeitig erfüllen (logisches UND).
9. WHEN der User auf einen Treffer in der Trefferliste klickt, THE Discord_Archive_Viewer SHALL den zugehörigen Channel öffnen, die Chat_View so scrollen, dass die Treffer-Nachricht im sichtbaren Bereich liegt, und die Treffer-Nachricht für mindestens 2 Sekunden visuell durch eine farbliche Hintergrundhervorhebung kennzeichnen.
10. WHEN sich die Suchanfrage oder ein Filterwert ändert, THE Search_Engine SHALL die Trefferliste innerhalb von 500 Millisekunden nach der letzten Eingabe automatisch aktualisieren, ohne dass der User die Suche manuell auslösen muss.
11. IF die Suche keine Treffer liefert, THEN THE Search_Engine SHALL eine leere Trefferliste anzeigen und einen Hinweistext darstellen, der angibt, dass keine Nachrichten den Suchkriterien entsprechen.
12. THE Search_Engine SHALL maximal 500 Treffer pro Suchanfrage in der Trefferliste anzeigen und bei Überschreitung dieser Grenze einen Hinweis ausgeben, der den User informiert, dass die Suche durch zusätzliche Filter eingegrenzt werden sollte.

### Requirement 7: Parser für Export_JSON

**User Story:** Als User möchte ich, dass die App verschiedene Discord-Export-Strukturen verarbeitet und in ein einheitliches internes Modell überführt, damit alle Channels konsistent angezeigt werden können.

#### Acceptance Criteria

1. WHEN eine Export_JSON erfolgreich eingelesen und syntaktisch validiert wurde, THE Parser SHALL ein Channel_Model mit den Feldern id, folderPath, displayName, channelName, guildName, htmlFilePath, messageCount, firstMessageAt, lastMessageAt, users und messages erzeugen.
2. WHEN eine Nachricht aus einer validierten Export_JSON verarbeitet wird, THE Parser SHALL ein Message-Objekt mit den Feldern id, authorId, authorName, authorAvatar, timestamp, editedTimestamp, content, attachments, embeds, reactions und replyTo erzeugen.
3. THE Parser SHALL die Liste messages innerhalb des Channel_Model nach timestamp aufsteigend sortieren und bei identischem timestamp sekundär nach id aufsteigend sortieren.
4. THE Parser SHALL Pfade zu Assets und Media als absolute Pfade auf Basis des Channel_Folder berechnen und bei nicht auffindbarer Asset-Datei den berechneten Pfad dennoch zurückgeben sowie das Asset als fehlend kennzeichnen.
5. IF eine Nachricht eine Antwortreferenz enthält, THEN THE Parser SHALL das Feld replyTo mit der Original-Nachrichten-ID und, falls vorhanden, einem Auszug des referenzierten Inhalts mit maximal 200 Zeichen füllen.
6. THE Parser SHALL als wiederverwendbares TypeScript-Modul ausgelegt sein, das sowohl im Main_Process als auch in Tests ohne Electron-Abhängigkeit ausführbar ist.
7. IF eine Export_JSON syntaktisch ungültig ist oder nicht als JSON geparst werden kann, THEN THE Parser SHALL die Verarbeitung dieser Datei abbrechen und einen Fehler zurückgeben, der den betroffenen Dateipfad und den Fehlertyp benennt, ohne bereits erfolgreich geparste Channels zu verändern.
8. IF in einer Export_JSON eines der Pflichtfelder id, channelName oder messages fehlt, THEN THE Parser SHALL diese Datei überspringen und einen Fehler zurückgeben, der die fehlenden Pflichtfelder und den Dateipfad benennt.
9. IF ein timestamp oder editedTimestamp einer Nachricht nicht als ISO-8601-Wert interpretierbar ist, THEN THE Parser SHALL den entsprechenden Wert als null übernehmen und solche Nachrichten beim Sortieren nach timestamp ans Ende der Liste platzieren.

### Requirement 8: Parser-Robustheit und Fehlertoleranz

**User Story:** Als User möchte ich, dass die App auch bei unvollständigen oder abweichenden JSON-Dateien stabil bleibt und mich auf Probleme hinweist, damit ein einzelner defekter Export nicht die gesamte App blockiert.

#### Acceptance Criteria

1. IF in einer Export_JSON ein optionales Feld fehlt, THEN THE Parser SHALL für `authorAvatar` einen leeren String, für `editedTimestamp` den Wert null, für `embeds` und `reactions` jeweils eine leere Liste und für `replyTo` den Wert null als Fallback setzen und die Verarbeitung des Channels ohne Abbruch fortsetzen.
2. IF eine Export_JSON syntaktisch ungültig ist (Parserfehler beim JSON-Parsing), THEN THE Parser SHALL den betroffenen Channel im Channel-Listing als „nicht ladbar" kennzeichnen, eine Warnmeldung mit Dateipfad und Fehlerbeschreibung im Warnungsbereich der UI anzeigen, den Ladevorgang aller übrigen Channels unverändert fortsetzen und keine bereits geladenen Channel-Daten verwerfen.
3. IF eine Export_JSON Felder enthält, die nicht im erwarteten Schema definiert sind, oder erwartete Pflichtfelder fehlen, THEN THE Parser SHALL alle Felder, deren Schlüsselname exakt einem bekannten Feld des Channel_Model entspricht, übernehmen, fehlende Pflichtfelder über die in Kriterium 1 definierten Fallbacks ergänzen und eine Warnung mit der Liste aller nicht zuordenbaren Schlüsselnamen im Warnungsbereich der UI anzeigen.
4. WHEN eine Export_JSON größer als 50 MB geladen wird, THE Parser SHALL die Datei streamingbasiert oder in Chunks von maximal 10 MB einlesen, sodass der Renderer-Prozess Benutzereingaben innerhalb von höchstens 200 ms verarbeitet und die UI während des Ladens nicht länger als 200 ms am Stück blockiert wird.
5. WHILE eine Export_JSON geladen wird, THE Discord_Archive_Viewer SHALL einen Ladeindikator mit dem Channel-Namen und einem numerischen Fortschrittswert von 0 bis 100 Prozent darstellen, der mindestens alle 500 ms aktualisiert wird.
6. THE Parser SHALL eine round-trip-fähige Serialisierung des Channel_Model nach JSON und zurück bereitstellen, sodass `parse(serialize(channelModel))` ein Channel_Model liefert, dessen sämtliche Feldwerte mit dem ursprünglichen Channel_Model strukturell identisch sind (gleiche Felder, gleiche Werte, gleiche Reihenfolge bei Listen).

### Requirement 9: Sicherheits- und Sandboxing-Architektur

**User Story:** Als User möchte ich, dass die App ausschließlich lesend und nur auf Ordner zugreift, die ich selbst gewählt habe, damit meine Originaldateien sicher sind und keine Daten das System verlassen.

#### Acceptance Criteria

1. THE Discord_Archive_Viewer SHALL alle BrowserWindow-Instanzen mit `contextIsolation: true`, `nodeIntegration: false` und `sandbox: true` konfigurieren.
2. THE Discord_Archive_Viewer SHALL die Kommunikation zwischen Renderer_Process und Main_Process ausschließlich über eine in einem Preload-Skript registrierte, typisierte Preload_API abwickeln, die nur explizit definierte Methoden mit validierten Parametern exponiert.
3. THE Renderer_Process SHALL keinen direkten Zugriff auf Node.js-APIs, das Dateisystem, Shell-Funktionen oder Betriebssystem-Schnittstellen erhalten.
4. WHEN der Renderer_Process über die Preload_API einen Lesezugriff auf einen Pfad anfordert, THE Main_Process SHALL den angeforderten Pfad in einen absoluten, normalisierten Pfad auflösen und prüfen, ob dieser vollständig innerhalb eines vom User registrierten Channel_Folder oder Root_Folder liegt, bevor der Lesezugriff durchgeführt wird.
5. IF eine Anfrage des Renderer_Process einen Pfad referenziert, der nach Normalisierung außerhalb aller registrierten Channel_Folder und Root_Folder liegt, Pfad-Traversal-Sequenzen (z. B. `..`) enthält oder auf symbolische Links außerhalb der registrierten Ordner verweist, THEN THE Main_Process SHALL die Anfrage ablehnen, dem Renderer_Process einen Fehler mit Kennzeichnung „Zugriff verweigert" zurückgeben, keine Dateiinhalte preisgeben und einen Sicherheits-Logeintrag mit Zeitstempel und angefragtem Pfad erstellen.
6. THE Discord_Archive_Viewer SHALL ausschließlich lesende Dateisystemoperationen auf Channel_Folder und Root_Folder ausführen und keine Schreib-, Änderungs-, Umbenennungs- oder Löschoperationen auf darin enthaltenen Dateien oder Verzeichnissen durchführen.
7. THE Discord_Archive_Viewer SHALL während der Laufzeit keine ausgehenden Netzwerkanfragen an externe Hosts initiieren, mit alleiniger Ausnahme der vom User explizit ausgelösten Aktion „In HTML öffnen", die die Ziel-URL oder den Dateipfad an das Standard-Programm des Betriebssystems übergibt, ohne dass die App selbst eine Netzwerkverbindung aufbaut.
8. THE Discord_Archive_Viewer SHALL in Export_JSON enthaltene Felder, die Tokens, Authentifizierungsdaten, API-Keys oder Bot-Credentials darstellen, weder in der Benutzeroberfläche darstellen noch außerhalb des flüchtigen Arbeitsspeichers persistieren oder in Logdateien schreiben.
9. IF eine Anfrage des Renderer_Process Parameter enthält, die die maximal zulässige Pfadlänge des Betriebssystems überschreiten, ungültige Zeichen enthalten oder nicht den von der Preload_API definierten Typen entsprechen, THEN THE Main_Process SHALL die Anfrage ohne Ausführung ablehnen und einen Validierungsfehler an den Renderer_Process zurückgeben.

### Requirement 10: Einstellungen und lokale Persistenz

**User Story:** Als User möchte ich, dass die App sich meine zuletzt gewählten Ordner, das Theme und die Fenstergröße merkt, damit ich nach einem Neustart sofort weiterarbeiten kann.

#### Acceptance Criteria

1. THE Settings_Store SHALL die Liste der registrierten Channel_Folder und Root_Folder (jeweils als absoluten Pfad mit maximal 4096 Zeichen, bis zu maximal 500 Einträgen pro Liste) lokal in einer Konfigurationsdatei innerhalb des userData-Verzeichnisses der App persistieren.
2. THE Settings_Store SHALL die Theme-Einstellung (zulässige Werte: „dark" oder „light"), die Fensterposition (x, y als ganzzahlige Pixelkoordinaten) und die Fenstergröße (Breite zwischen 800 und 7680 Pixeln, Höhe zwischen 600 und 4320 Pixeln) lokal persistieren.
3. WHEN eine Änderung an registrierten Ordnern, Theme, Fensterposition oder Fenstergröße erfolgt, THE Settings_Store SHALL die Konfigurationsdatei innerhalb von 2 Sekunden aktualisieren und die Schreiboperation atomar (über temporäre Datei und Rename) durchführen, sodass keine teilweise geschriebenen Konfigurationen entstehen.
4. WHEN die App gestartet wird, THE Discord_Archive_Viewer SHALL die zuletzt registrierten Ordner automatisch erneut durch den Folder_Scanner verarbeiten und die Channel-Liste rekonstruieren.
5. THE Settings_Store SHALL keine Nachrichteninhalte, Anhänge, Authentifizierungs-Tokens, Passwörter oder API-Keys in der Konfigurationsdatei speichern.
6. IF ein zuvor registrierter Pfad beim Start nicht mehr existiert oder nicht lesbar ist, THEN THE Discord_Archive_Viewer SHALL den Eintrag in der Channel-Liste mit dem Status „nicht verfügbar" sowie einer für den User sichtbaren Begründung (Pfad fehlt oder kein Lesezugriff) markieren, den Eintrag in der Konfiguration beibehalten und erst nach expliziter Bestätigung des Users über eine Entfernen-Aktion löschen.
7. IF die Konfigurationsdatei beim Start fehlt, leer ist oder nicht als gültige Konfiguration interpretiert werden kann, THEN THE Settings_Store SHALL eine neue Konfiguration mit Standardwerten (leere Ordnerlisten, Theme „dark", Standardfenstergröße 1280x800, zentrierte Fensterposition) initialisieren und dem User eine Hinweismeldung über den Reset anzeigen, ohne den Start der App zu blockieren.

### Requirement 11: Build-Pipeline für Portable EXE und Installer

**User Story:** Als User möchte ich die App entweder als Portable EXE ohne Installation oder als klassischen Installer beziehen, damit ich je nach Umgebung flexibel bin.

#### Acceptance Criteria

1. THE Build_Pipeline SHALL die npm-Scripte `dev`, `build`, `dist`, `dist:portable` und `dist:installer` in der `package.json` bereitstellen, sodass jedes Script über `npm run <name>` mit Exit-Code 0 bei Erfolg und Exit-Code ungleich 0 bei Fehler ausführbar ist.
2. WHEN das Script `npm run dev` ausgeführt wird, THE Build_Pipeline SHALL eine Entwicklungsinstanz mit Vite-Hot-Reload für den Renderer und automatischem Neustart für den Main_Process innerhalb von maximal 30 Sekunden nach Script-Start starten und das Anwendungsfenster anzeigen.
3. IF beim Start von `npm run dev` der Renderer- oder Main_Process-Build fehlschlägt, THEN THE Build_Pipeline SHALL den Vorgang mit Exit-Code ungleich 0 abbrechen und eine Fehlermeldung mit Hinweis auf das fehlerhafte Modul auf der Konsole ausgeben.
4. WHEN das Script `npm run build` ausgeführt wird, THE Build_Pipeline SHALL Renderer und Main_Process zu produktionsreifen Bundles kompilieren und die Build-Artefakte im Ausgabeverzeichnis ablegen.
5. IF während `npm run build` Kompilierungs- oder Bundling-Fehler auftreten, THEN THE Build_Pipeline SHALL den Build mit Exit-Code ungleich 0 beenden, eine Fehlermeldung mit Angabe der fehlerhaften Datei ausgeben und keine unvollständigen Artefakte im Ausgabeverzeichnis hinterlassen.
6. WHEN das Script `npm run dist:portable` ausgeführt wird, THE Build_Pipeline SHALL über electron-builder eine Portable EXE für Windows x64 erzeugen, die ohne vorherige Installation und ohne Administratorrechte auf einem unterstützten Windows-System (Windows 10 oder neuer, x64) startbar ist.
7. WHEN das Script `npm run dist:installer` ausgeführt wird, THE Build_Pipeline SHALL über electron-builder einen Windows-NSIS-Installer für x64 erzeugen, der die Anwendung auf einem unterstützten Windows-System (Windows 10 oder neuer, x64) installiert und einen Eintrag im Startmenü sowie eine Deinstallationsoption registriert.
8. WHEN das Script `npm run dist` ausgeführt wird, THE Build_Pipeline SHALL in einem einzigen Lauf sowohl die Portable EXE als auch den NSIS-Installer für Windows x64 erzeugen und beide Artefakte im selben Ausgabeverzeichnis ablegen.
9. IF während eines `dist`-, `dist:portable`- oder `dist:installer`-Laufs das Verpacken durch electron-builder fehlschlägt, THEN THE Build_Pipeline SHALL den Vorgang mit Exit-Code ungleich 0 abbrechen, eine Fehlermeldung mit Angabe der fehlgeschlagenen Stufe ausgeben und keine unvollständigen Installations- oder Portable-Artefakte zurücklassen.

### Requirement 12: Dokumentation und README

**User Story:** Als User möchte ich eine klare Anleitung, damit ich die App starten, Ordner hinzufügen und eigene Builds erstellen kann.

#### Acceptance Criteria

1. THE Discord_Archive_Viewer SHALL eine README-Datei im Projektstamm bereitstellen, die mindestens die Abschnitte "Installation", "Entwicklungsmodus starten", "Ordner hinzufügen", "Builds erstellen", "Fehlerbehandlung" und "Sicherheitsarchitektur" enthält.
2. THE README SHALL die exakten Befehle (inklusive npm-Script-Namen) zum Installieren der Abhängigkeiten und zum Starten der App im Entwicklungsmodus auflisten, sodass die App nach Ausführung dieser Befehle ohne weitere manuelle Schritte startet.
3. THE README SHALL Schritt-für-Schritt-Anleitungen mit jeweils maximal 10 Schritten enthalten, die beschreiben, wie ein einzelner Channel_Folder hinzugefügt wird und wie ein Root_Folder mit verschachtelten Channel_Folder hinzugefügt wird.
4. THE README SHALL die exakten npm-Script-Namen und Befehle zum Erstellen einer Portable EXE und eines Installers auflisten sowie den Ordner angeben, in dem die erzeugten Build-Artefakte abgelegt werden.
5. THE README SHALL einen Abschnitt "Fehlerbehandlung" enthalten, der für jeden der folgenden Fälle eine konkrete Handlungsanweisung beschreibt: fehlende Mediendateien, fehlende Export_JSON, ungültige Export_JSON sowie unzugängliche Ordner.
6. THE README SHALL einen mit "Datenintegrität" überschriebenen Hinweis enthalten, der ausdrücklich feststellt, dass der Discord_Archive_Viewer Originaldateien in Channel_Folder oder Root_Folder ausschließlich liest und niemals verändert, verschiebt oder löscht.
7. THE README SHALL einen mit "Sicherheitsarchitektur" überschriebenen Abschnitt enthalten, der die folgenden Eigenschaften jeweils mit einer kurzen Erläuterung auflistet: ausschließlich lokale Verarbeitung, kein Cloud-Upload, keine Token-Speicherung, aktivierte contextIsolation und deaktiviertes nodeIntegration.
8. IF eine in der README beschriebene Anweisung, ein Befehl oder ein npm-Script-Name nicht mit der tatsächlichen Implementierung übereinstimmt, THEN THE Discord_Archive_Viewer SHALL diese Abweichung als Dokumentationsfehler behandeln und die README vor Auslieferung entsprechend korrigieren.
