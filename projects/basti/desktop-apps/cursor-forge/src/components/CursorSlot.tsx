import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  MousePointer, HelpCircle, Loader, Clock, Crosshair, TextCursor,
  PenLine, Ban, ArrowUpDown, ArrowLeftRight, Expand, Shrink, Move,
  ArrowUp, Hand, User, MapPin, Upload, X, Target, Film,
} from 'lucide-react';
import { CursorRoleDef } from '../cursorRoles';
import { useStore } from '../store';
import { assignFileToSlot, fileName, formatBytes } from '../lib/assignFile';

const ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  MousePointer, HelpCircle, Loader, Clock, Crosshair, TextCursor,
  PenLine, Ban, ArrowUpDown, ArrowLeftRight, Expand, Shrink, Move,
  ArrowUp, Hand, User, MapPin,
};

interface Props {
  role: CursorRoleDef;
}

/** Animierte Vorschau: blättert bei ANI/GIF durch alle Frames */
function AnimatedPreview({ slot, alt }: { slot: { previewData: string | null; frames: { base64_png: string; delay_ms: number }[] }; alt: string }) {
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    setFrameIdx(0);
    if (slot.frames.length < 2) return;
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      idx = (idx + 1) % slot.frames.length;
      setFrameIdx(idx);
      timer = setTimeout(tick, Math.max(20, slot.frames[idx]?.delay_ms ?? 100));
    };
    timer = setTimeout(tick, Math.max(20, slot.frames[0]?.delay_ms ?? 100));
    return () => clearTimeout(timer);
  }, [slot.frames]);

  const src =
    slot.frames.length > 1
      ? slot.frames[Math.min(frameIdx, slot.frames.length - 1)].base64_png
      : slot.previewData;

  if (!src) return null;
  return (
    <img
      src={`data:image/png;base64,${src}`}
      alt={alt}
      className="max-h-14 max-w-full object-contain pixelated block"
      draggable={false}
    />
  );
}

export default function CursorSlot({ role }: Props) {
  const { slots, clearSlot, dragHoveredRole, openHotspotEditor, addToast } = useStore();
  const slot = slots.find(s => s.role === role.key)!;
  const [loading, setLoading] = useState(false);

  const Icon = ICONS[role.icon] ?? MousePointer;
  const isAssigned = slot.sourcePath !== null;
  const isDragTarget = dragHoveredRole === role.key;
  const isAnimated = slot.frames.length > 1;

  async function pickFile() {
    try {
      const paths = await invoke<string[]>('pick_cursor_files');
      if (paths.length === 0) return;
      setLoading(true);
      const ok = await assignFileToSlot(role.key, paths[0]);
      if (ok) addToast('success', `${role.name}: „${fileName(paths[0])}" zugewiesen`);
    } catch (e) {
      addToast('error', `Dateiauswahl fehlgeschlagen: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  const borderClass = isDragTarget
    ? 'border-blue-400 bg-blue-950/30 drag-pulse scale-[1.02]'
    : isAssigned
    ? 'border-green-600/50 bg-zinc-900'
    : 'border-zinc-700/50 bg-zinc-900 hover:border-zinc-500';

  return (
    <div
      data-cursor-role={role.key}
      className={`relative flex flex-col rounded-xl border transition-all duration-150 overflow-hidden select-none ${borderClass}`}
      title={role.hint}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
        <div className={`shrink-0 ${isAssigned ? 'text-green-400' : 'text-zinc-500'}`}>
          <Icon size={14} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-zinc-200 truncate leading-tight">{role.name}</div>
          <div className="text-[9px] text-zinc-600 font-mono">{role.key}</div>
        </div>
        {isAssigned && (
          <button
            onClick={() => {
              clearSlot(role.key);
              addToast('info', `${role.name} entfernt`);
            }}
            className="ml-auto shrink-0 text-zinc-600 hover:text-red-400 transition-colors"
            title="Zuweisung entfernen"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Preview area */}
      <div className="mx-2.5 mb-2">
        {loading ? (
          <div className="flex items-center justify-center h-[72px] rounded-lg bg-zinc-800/50">
            <Loader size={16} className="text-zinc-500 animate-spin" />
          </div>
        ) : isAssigned && slot.previewData ? (
          <div className="space-y-1">
            {/* Vorschau (klick öffnet Hotspot-Editor bei konvertierbaren Dateien) */}
            <div
              className={`relative flex items-center justify-center h-[72px] rounded-lg checkerboard overflow-hidden ${
                slot.needsConversion ? 'cursor-pointer hover:ring-1 hover:ring-blue-500/50' : ''
              }`}
              onClick={slot.needsConversion ? () => openHotspotEditor(role.key) : undefined}
              title={slot.needsConversion ? 'Klicken: Hotspot-Editor öffnen' : undefined}
            >
              <AnimatedPreview slot={slot} alt={role.name} />

              {/* Badges */}
              <div className="absolute top-1 right-1 flex gap-1">
                {isAnimated && (
                  <span className="flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 rounded bg-violet-600/80 text-white">
                    <Film size={8} />
                    {slot.frames.length}
                  </span>
                )}
              </div>

              {slot.needsConversion && (
                <div className="absolute bottom-1 right-1 text-red-400/80">
                  <Target size={10} />
                </div>
              )}
            </div>

            {/* Infozeile */}
            <div className="flex items-center gap-1 text-[9px] text-zinc-600">
              <span className="truncate" title={slot.sourcePath ?? ''}>
                {fileName(slot.sourcePath ?? '')}
              </span>
              <span className="ml-auto shrink-0 font-mono">
                {slot.width}×{slot.height}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px]">
              <span className="text-zinc-700 font-mono">{formatBytes(slot.fileSize)}</span>
              {slot.isAnimation && <span className="text-blue-400 font-semibold">ANI</span>}
              {slot.makeAni && <span className="text-violet-400 font-semibold">GIF → ANI</span>}
              {slot.needsConversion && !slot.makeAni && (
                <span className="text-amber-400 font-semibold">→ CUR</span>
              )}
              {slot.needsConversion && (
                <button
                  onClick={() => openHotspotEditor(role.key)}
                  className="ml-auto text-zinc-500 hover:text-red-300 transition-colors font-mono"
                  title="Hotspot bearbeiten"
                >
                  ⌖ {slot.hotspotX},{slot.hotspotY}
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={pickFile}
            className="w-full flex flex-col items-center justify-center gap-1.5 h-[72px] rounded-lg border border-dashed border-zinc-700 hover:border-blue-500/60 hover:bg-blue-950/10 transition-all text-zinc-600 hover:text-blue-400"
          >
            <Upload size={16} />
            <span className="text-[10px]">Datei wählen oder hineinziehen</span>
          </button>
        )}
      </div>

      {/* Bottom action */}
      {isAssigned && (
        <div className="px-2.5 pb-2">
          <button
            onClick={pickFile}
            className="w-full text-[10px] py-1 rounded-md border border-zinc-700/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-all"
          >
            Andere Datei
          </button>
        </div>
      )}

      {/* Drag overlay */}
      {isDragTarget && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-950/50 rounded-xl pointer-events-none">
          <div className="text-blue-200 text-xs font-semibold">Hier ablegen</div>
        </div>
      )}
    </div>
  );
}
