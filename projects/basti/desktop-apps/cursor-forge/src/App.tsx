import { useEffect, useRef } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import TopBar from './components/TopBar';
import CursorGrid from './components/CursorGrid';
import ExportPanel from './components/ExportPanel';
import Toasts from './components/Toasts';
import HotspotModal from './components/HotspotModal';
import { useStore, loadPersisted } from './store';
import { matchFileToRole } from './cursorRoles';
import { assignFileToSlot, fileName } from './lib/assignFile';

function findSlotAtPosition(x: number, y: number): string | null {
  const elements = document.querySelectorAll<HTMLElement>('[data-cursor-role]');
  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return el.getAttribute('data-cursor-role');
    }
  }
  return null;
}

// Tauri liefert Drag-Positionen in PHYSISCHEN Pixeln, das DOM rechnet in
// CSS-Pixeln. Ohne diese Umrechnung schlagen Drops bei Windows-Skalierung
// (125 %, 150 %, …) fehl bzw. treffen den falschen Slot.
function toLogical(pos: { x: number; y: number }): { x: number; y: number } {
  const scale = window.devicePixelRatio || 1;
  return { x: pos.x / scale, y: pos.y / scale };
}

export default function App() {
  const { setDragActive, setDragHoveredRole } = useStore();
  const restored = useRef(false);

  // Letzte Sitzung wiederherstellen (Zuweisungen inkl. Hotspots)
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    const persisted = loadPersisted();
    if (!persisted?.slotPaths?.length) return;

    (async () => {
      let ok = 0;
      for (const s of persisted.slotPaths) {
        if (
          await assignFileToSlot(s.role, s.path, {
            hotspot: [s.hotspotX, s.hotspotY],
            silent: true,
          })
        ) {
          ok++;
        }
      }
      if (ok > 0) {
        useStore.getState().addToast('info', `Letzte Sitzung wiederhergestellt (${ok} Cursor).`);
      }
    })();
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function handleDrop(paths: string[], role: string | null) {
      const { addToast } = useStore.getState();

      if (paths.length === 1) {
        // Eine Datei: in den Slot unter dem Mauszeiger, sonst per Namens-Matching
        const target = role ?? matchFileToRole(fileName(paths[0]));
        if (!target) {
          addToast('info', 'Bitte die Datei direkt auf ein Cursor-Feld ziehen.');
          return;
        }
        await assignFileToSlot(target, paths[0]);
        return;
      }

      // Mehrere Dateien: automatisch anhand des Dateinamens zuordnen
      let matched = 0;
      for (const p of paths) {
        const r = matchFileToRole(fileName(p));
        if (r && (await assignFileToSlot(r, p, { silent: true }))) matched++;
      }
      if (matched === 0) {
        addToast(
          'error',
          'Keine Datei automatisch zuordenbar — Dateien einzeln auf die Felder ziehen oder passend benennen (Arrow.cur, Wait.ani, …).'
        );
      } else {
        addToast('success', `${matched} von ${paths.length} Dateien automatisch zugeordnet.`);
      }
    }

    getCurrentWebview()
      .onDragDropEvent(event => {
        const payload = event.payload as {
          type: string;
          paths?: string[];
          position?: { x: number; y: number };
        };

        if (payload.type === 'enter') {
          setDragActive(true);
          if (payload.position) {
            const { x, y } = toLogical(payload.position);
            setDragHoveredRole(findSlotAtPosition(x, y));
          }
        } else if (payload.type === 'over' && payload.position) {
          const { x, y } = toLogical(payload.position);
          setDragHoveredRole(findSlotAtPosition(x, y));
        } else if (payload.type === 'leave') {
          setDragActive(false);
          setDragHoveredRole(null);
        } else if (payload.type === 'drop' && payload.paths && payload.paths.length > 0) {
          setDragActive(false);
          setDragHoveredRole(null);
          let role: string | null = null;
          if (payload.position) {
            const { x, y } = toLogical(payload.position);
            role = findSlotAtPosition(x, y);
          }
          void handleDrop(payload.paths, role);
        }
      })
      .then(fn => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
    };
  }, [setDragActive, setDragHoveredRole]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4">
          <CursorGrid />
        </main>
        <ExportPanel />
      </div>
      <Toasts />
      <HotspotModal />
    </div>
  );
}
