import { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { useStore } from '../store';

/**
 * Live-Testbereich: Die zugewiesenen Cursor werden als echte CSS-Cursor
 * über den Zonen angezeigt — einfach mit der Maus drüberfahren.
 */

// CSS akzeptiert nur kleine Cursor → auf 32 px herunterrechnen
async function makeCssCursor(
  base64: string,
  w: number,
  h: number,
  hx: number,
  hy: number
): Promise<string | null> {
  try {
    const img = new Image();
    img.src = `data:image/png;base64,${base64}`;
    await img.decode();

    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Seitenverhältnis erhalten, zentriert einpassen
    const scale = Math.min(size / w, size / h);
    const dw = w * scale;
    const dh = h * scale;
    const ox = (size - dw) / 2;
    const oy = (size - dh) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, ox, oy, dw, dh);

    const shx = Math.round(Math.min(size - 1, hx * scale + ox));
    const shy = Math.round(Math.min(size - 1, hy * scale + oy));
    return `url("${canvas.toDataURL('image/png')}") ${shx} ${shy}, auto`;
  } catch {
    return null;
  }
}

const ZONES: { role: string; label: string }[] = [
  { role: 'Arrow', label: 'Normal' },
  { role: 'Hand', label: 'Link' },
  { role: 'IBeam', label: 'Text' },
  { role: 'Wait', label: 'Warten' },
  { role: 'Crosshair', label: 'Präzision' },
  { role: 'No', label: 'Verboten' },
  { role: 'SizeAll', label: 'Verschieben' },
];

export default function TestArea() {
  const { slots } = useStore();
  const [cursors, setCursors] = useState<Record<string, string>>({});

  const assigned = ZONES.filter(z => slots.find(s => s.role === z.role)?.sourcePath);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const map: Record<string, string> = {};
      for (const zone of ZONES) {
        const slot = slots.find(s => s.role === zone.role);
        if (!slot?.previewData) continue;
        const css = await makeCssCursor(
          slot.previewData,
          slot.width,
          slot.height,
          slot.hotspotX,
          slot.hotspotY
        );
        if (css) map[zone.role] = css;
      }
      if (!cancelled) setCursors(map);
    })();

    return () => {
      cancelled = true;
    };
  }, [slots]);

  if (assigned.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical size={13} className="text-violet-400" />
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Live-Test
        </span>
        <span className="text-[10px] text-zinc-600">— Maus über die Felder bewegen</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {assigned.map(zone => (
          <div
            key={zone.role}
            className="flex-1 min-w-20 text-center text-[11px] text-zinc-400 border border-dashed border-zinc-700 rounded-lg py-3 px-2 hover:border-violet-500/50 hover:text-zinc-200 hover:bg-violet-950/10 transition-all"
            style={{ cursor: cursors[zone.role] ?? 'auto' }}
          >
            {zone.label}
          </div>
        ))}
      </div>
    </div>
  );
}
