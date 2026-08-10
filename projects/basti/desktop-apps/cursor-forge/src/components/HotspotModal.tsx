import { useEffect, useCallback } from 'react';
import { X, Target, CornerUpLeft } from 'lucide-react';
import { useStore } from '../store';
import { CURSOR_ROLES } from '../cursorRoles';

/**
 * Großer Hotspot-Editor: Klick auf die vergrößerte Vorschau setzt den
 * Klickpunkt pixelgenau; Fadenkreuz-Linien zeigen die aktuelle Position.
 */
export default function HotspotModal() {
  const { hotspotEditorRole, openHotspotEditor, slots, setSlot } = useStore();

  const slot = slots.find(s => s.role === hotspotEditorRole);
  const roleDef = CURSOR_ROLES.find(r => r.key === hotspotEditorRole);

  const close = useCallback(() => openHotspotEditor(null), [openHotspotEditor]);

  useEffect(() => {
    if (!hotspotEditorRole) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotspotEditorRole, close]);

  if (!slot || !slot.previewData || !roleDef) return null;

  function setHotspot(x: number, y: number) {
    if (!slot) return;
    setSlot(slot.role, {
      hotspotX: Math.max(0, Math.min(Math.round(x), slot.width - 1)),
      hotspotY: Math.max(0, Math.min(Math.round(y), slot.height - 1)),
    });
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!slot) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * slot.width;
    const py = ((e.clientY - rect.top) / rect.height) * slot.height;
    setHotspot(px, py);
  }

  const presets: { label: string; x: number; y: number }[] = [
    { label: '↖ Oben links', x: 0, y: 0 },
    { label: '↑ Oben Mitte', x: Math.floor(slot.width / 2), y: 0 },
    { label: '⊙ Zentrum', x: Math.floor(slot.width / 2), y: Math.floor(slot.height / 2) },
    { label: '↓ Unten Mitte', x: Math.floor(slot.width / 2), y: slot.height - 1 },
  ];

  const pctX = (slot.hotspotX / Math.max(1, slot.width - 1)) * 100;
  const pctY = (slot.hotspotY / Math.max(1, slot.height - 1)) * 100;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="modal-in w-[420px] max-w-[90vw] rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
          <Target size={15} className="text-red-400" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-100">Hotspot festlegen</div>
            <div className="text-[11px] text-zinc-500 truncate">
              {roleDef.name} — der Punkt, an dem der Cursor „klickt"
            </div>
          </div>
          <button
            onClick={close}
            className="ml-auto text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Schließen (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Editor */}
        <div className="p-4 space-y-3">
          <div
            className="relative mx-auto w-64 h-64 checkerboard rounded-xl overflow-hidden cursor-crosshair border border-zinc-700"
            onClick={handleClick}
            title="Klicken, um den Hotspot zu setzen"
          >
            <img
              src={`data:image/png;base64,${slot.previewData}`}
              alt={roleDef.name}
              className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none"
              draggable={false}
            />
            {/* Fadenkreuz */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-400/60 pointer-events-none"
              style={{ left: `${pctX}%` }}
            />
            <div
              className="absolute left-0 right-0 h-px bg-red-400/60 pointer-events-none"
              style={{ top: `${pctY}%` }}
            />
            <div
              className="absolute w-3 h-3 rounded-full border-2 border-red-400 bg-red-400/30 pointer-events-none"
              style={{ left: `${pctX}%`, top: `${pctY}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>

          {/* Koordinaten */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-zinc-500">Position:</span>
            <input
              type="number"
              value={slot.hotspotX}
              onChange={e => setHotspot(parseInt(e.target.value, 10) || 0, slot.hotspotY)}
              className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-200 text-center focus:border-blue-500"
              min={0}
              max={slot.width - 1}
            />
            <span className="text-zinc-600">×</span>
            <input
              type="number"
              value={slot.hotspotY}
              onChange={e => setHotspot(slot.hotspotX, parseInt(e.target.value, 10) || 0)}
              className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-200 text-center focus:border-blue-500"
              min={0}
              max={slot.height - 1}
            />
            <span className="text-zinc-600 text-[10px]">
              (von {slot.width}×{slot.height})
            </span>
          </div>

          {/* Schnellwahl */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => setHotspot(p.x, p.y)}
                className="text-[10px] px-2 py-1 rounded-md border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-all"
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setHotspot(roleDef.defaultHotspot[0], roleDef.defaultHotspot[1])}
              className="text-[10px] px-2 py-1 rounded-md border border-zinc-700 text-amber-400/80 hover:text-amber-300 hover:border-amber-600/50 transition-all flex items-center gap-1"
            >
              <CornerUpLeft size={10} />
              Standard
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={close}
            className="text-xs px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
}
