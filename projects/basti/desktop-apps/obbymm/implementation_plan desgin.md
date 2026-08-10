# UI Overhaul, Replay & Freie Piktogramme

Diese Implementierungsplanung beschreibt die Umsetzung der gewünschten Features: Ein Design-Mix aus Obsidian und Notion, eine funktionierende Replay-Funktion, anpassbare Größen und Abrundungen wie in PowerPoint sowie frei platzierbare, verlustfrei skalierbare und fixierbare Piktogramme.

## User Review Required

> [!IMPORTANT]
> Bitte lies dir diesen Plan durch und antworte mit einer Bestätigung (z.B. "Plan umsetzen" oder "Passt so"), damit ich mit dem Schreiben des Codes beginnen kann. Ich werde vorher keine Änderungen am Code vornehmen!

## Open Questions

> [!WARNING]
> 1. **Piktogramm-Typen:** Reichen die bestehenden Lucide-Icons (die bereits Vektoren sind und verlustfrei skalieren) als Piktogramme aus, oder möchtest du auch eigene SVGs hochladen können? (In diesem Plan nutzen wir zunächst die Lucide-Icons als frei platzierbare Objekte).
> 2. **Fixieren:** Das "Fixieren" eines Piktogramms (oder Rechtecks) wird über einen Schalter in der rechten Seitenleiste (RightSidebar) umgesetzt, sodass man es nicht mehr aus Versehen verschieben kann. Ist das in deinem Sinne?

## Proposed Changes

---

### UI & Styling (Obsidian/Notion Mix)

Das Design wird minimalistischer und aufgeräumter, ähnlich wie Notion (klare Typografie, dezente Linien) kombiniert mit der Canvas-Ästhetik von Obsidian.

#### [MODIFY] `src/styles/theme-light.css`
- Anpassung der Farben: Mehr Monochrom-Töne, sanftere Schatten (`box-shadow`), Entfernung von harten, klobigen Rändern.
- Anpassung der Schriftarten auf einen sauberen Sans-Serif-Look.

#### [MODIFY] `src/editor/NodeCard.tsx`
- Überarbeitung des HTML/CSS-Gerüsts des Knotens, sodass es eleganter wirkt.
- Integration des `<NodeResizer />` von `@xyflow/react`, der sichtbar wird, wenn der Knoten ausgewählt ist. Dadurch kannst du die Knoten an den Ecken beliebig groß und klein ziehen.
- Wenn ein Knoten als `locked` (fixiert) markiert ist, wird der Resizer ausgeblendet und das Verschieben unterbunden.

---

### Canvas Formate & Sidebar

Wir müssen das Datenmodell anpassen, damit Rechtecke abgerundet werden können und Piktogramme existieren dürfen.

#### [MODIFY] `src/formats/canvasFormat.ts`
- Hinzufügen der Eigenschaft `locked?: boolean` zu `CanvasNode`.
- Einführen eines neuen Knotentyps `type: 'icon'`, der nur das Symbol ohne Textbox oder Rahmen darstellt.
- Das Attribut `cornerRadius` wird für alle Rechtecke beibehalten, aber wir erlauben die freie Einstellung über das UI.

#### [MODIFY] `src/ui/RightSidebar.tsx`
- Hinzufügen eines Sliders ("Abrundung / Border Radius"), um den `cornerRadius` stufenlos einzustellen.
- Hinzufügen eines Toggles "Fixieren / Lock", um das aktuelle Element an Ort und Stelle festzufrieren.
- Hinzufügen eines Buttons/Menüs, um ein frei stehendes Piktogramm auf den Canvas zu setzen.

---

### Replay Funktion

Die "Replay"-Funktion in der Timeline (ReplayPanel) ist momentan nur ein Platzhalter. Wir machen sie funktionsfähig.

#### [MODIFY] `src/commands/eventStore.ts`
- Hinzufügen von `isReplaying`-State.
- Hinzufügen einer Funktion `startReplay()`. Diese leert den aktuellen Canvas-Zustand (bzw. setzt ihn auf den Ursprung zurück) und wendet dann in einem Intervall (z.B. alle 300ms) jedes Event einzeln an.
- Einbauen von `stopReplay()` zum Abbrechen.

#### [MODIFY] `src/ui/ReplayPanel.tsx`
- Der "Replay"-Button führt nun `startReplay()` aus dem Event-Store aus.
- Während des Replays wird visuell angezeigt, welches Event gerade abgespielt wird.

#### [MODIFY] `src/editor/MindmapEditor.tsx`
- Wenn ein Knoten das Flag `locked` hat, setzen wir im `ReactFlow` die Eigenschaft `draggable={false}` für diesen Knoten.

## Verification Plan

### Manuelle Verifikation
1. **UI Test:** Prüfen, ob die Knoten minimalistischer aussehen.
2. **Resizing:** Auswählen eines Knotens und Verändern der Größe über die angezeigten Ziehpunkte.
3. **Piktogramme:** Hinzufügen eines Icons, Skalieren (Qualität muss scharf bleiben da SVG) und Aktivieren von "Fixieren". Danach versuchen, es zu verschieben (sollte nicht gehen).
4. **Replay:** Im Replay-Panel auf "Replay" klicken und beobachten, wie die Mindmap Schritt für Schritt wieder aufgebaut wird.
