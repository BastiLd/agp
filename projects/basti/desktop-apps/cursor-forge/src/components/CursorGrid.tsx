import { Lightbulb, MousePointer2, FolderOpen, Package } from 'lucide-react';
import { CURSOR_ROLES } from '../cursorRoles';
import CursorSlot from './CursorSlot';
import TestArea from './TestArea';
import { useStore } from '../store';

export default function CursorGrid() {
  const { slots, assignedCount } = useStore();
  const count = assignedCount();

  const standard = CURSOR_ROLES.filter(r => !r.isExtended);
  const extended = CURSOR_ROLES.filter(r => r.isExtended);

  return (
    <div className="space-y-4">
      {/* Onboarding-Hinweis, solange nichts zugewiesen ist */}
      {count === 0 && (
        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-blue-400" />
            <span className="text-xs font-semibold text-blue-300">So funktioniert's</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-zinc-400 leading-relaxed">
            <div className="flex gap-2">
              <MousePointer2 size={13} className="shrink-0 mt-0.5 text-zinc-500" />
              <span>
                <strong className="text-zinc-300">1. Dateien zuweisen:</strong> Bilder (PNG, GIF,
                …) oder fertige Cursor (.cur/.ani) auf die Felder ziehen — auch mehrere auf
                einmal.
              </span>
            </div>
            <div className="flex gap-2">
              <FolderOpen size={13} className="shrink-0 mt-0.5 text-zinc-500" />
              <span>
                <strong className="text-zinc-300">2. Oder Ordner importieren:</strong> Dateien
                werden automatisch anhand des Namens zugeordnet (z. B. arrow.png, wait.ani).
              </span>
            </div>
            <div className="flex gap-2">
              <Package size={13} className="shrink-0 mt-0.5 text-zinc-500" />
              <span>
                <strong className="text-zinc-300">3. Anwenden oder exportieren:</strong> Direkt
                als aktives Schema übernehmen — oder als INF-Paket/ZIP teilen.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Standard-Cursor */}
      <div>
        <div className="flex items-center gap-3 mb-2.5">
          <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium whitespace-nowrap">
            Standard-Cursor
          </span>
          <span className="text-[10px] text-zinc-700 font-mono">
            {standard.filter(r => slots.find(s => s.role === r.key)?.sourcePath).length}
            /{standard.length}
          </span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
          {standard.map(role => (
            <CursorSlot key={role.key} role={role} />
          ))}
        </div>
      </div>

      {/* Erweiterte Cursor */}
      <div>
        <div className="flex items-center gap-3 mb-2.5">
          <span className="text-[11px] text-zinc-600 uppercase tracking-widest font-medium whitespace-nowrap">
            Erweiterte Cursor
          </span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
          {extended.map(role => (
            <CursorSlot key={role.key} role={role} />
          ))}
        </div>
        <p className="text-[10px] text-zinc-700 mt-2 leading-relaxed">
          Person & Pin sind nicht in den Standard-Mauseinstellungen sichtbar — beim
          Direkt-Anwenden werden sie automatisch mitgesetzt, im INF-Paket über{' '}
          <code className="text-zinc-600">install_extra.bat</code>.
        </p>
      </div>

      {/* Live-Testbereich */}
      <TestArea />
    </div>
  );
}
