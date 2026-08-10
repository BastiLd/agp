import React, { useEffect, useRef } from 'react';

export interface CtxItem {
  label: string;
  onClick: () => void;
  separator?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: CtxItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  // Clamp to viewport
  const w = 240, h = items.length * 32;
  const X = Math.min(x, window.innerWidth - w - 8);
  const Y = Math.min(y, window.innerHeight - h - 8);

  return (
    <div className="ctxmenu" ref={ref} style={{ left: X, top: Y }}>
      {items.map((it, i) =>
        it.separator ? (
          <div key={i} className="sep" />
        ) : (
          <button key={i} onClick={() => { it.onClick(); onClose(); }}>
            {it.label}
          </button>
        ),
      )}
    </div>
  );
}
