import React, { useEffect, useRef, useState } from 'react';

interface Props {
  enabled: boolean;
  position: { right: number; bottom: number };
  onMove: (p: { right: number; bottom: number }) => void;
  hint?: string;       // optionaler Tipp-Text in Sprechblase
}

const HINTS = [
  'Strg + F öffnet die Suche!',
  'Tipp: Rechtsklick auf einen Channel öffnet das Menü.',
  'Du kannst Channels mit ★ anpinnen.',
  'Strg + I zeigt die Statistiken!',
  'Strg + G öffnet die Galerie.',
  'In den Einstellungen findest du den Theme-Store.',
  'Strg + B öffnet diesen Channel im Browser.',
  'Mit Esc schließt du jedes Modal.',
  'Tipp: Die Sidebar lässt sich per Drag verschieben.',
  'Lokal & sicher — nichts geht ins Internet.',
];

export function Mascot({ enabled, position, onMove, hint }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const [happy, setHappy] = useState(false);
  const [wave, setWave] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; right: number; bottom: number; moved: boolean } | null>(null);

  // Begrüßung beim Start
  useEffect(() => {
    if (!enabled) return;
    setBubble('Hi! Ich bin Disco. 👋');
    setWave(true);
    const t1 = setTimeout(() => setWave(false), 2500);
    const t2 = setTimeout(() => setBubble(null), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [enabled]);

  // Externer Hint
  useEffect(() => {
    if (!enabled || !hint) return;
    setBubble(hint);
    setHappy(true);
    const t1 = setTimeout(() => setHappy(false), 2700);
    const t2 = setTimeout(() => setBubble(null), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [hint, enabled]);

  // Idle-Tipps alle 60s
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => {
      setBubble(HINTS[Math.floor(Math.random() * HINTS.length)]);
      setTimeout(() => setBubble(null), 5000);
    }, 60_000);
    return () => clearInterval(t);
  }, [enabled]);

  if (!enabled) return null;

  const onDown = (e: React.MouseEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      right: position.right,
      bottom: position.bottom,
      moved: false,
    };
    const onMoveDoc = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      if (Math.hypot(dx, dy) > 4) dragRef.current.moved = true;
      const right = Math.max(8, dragRef.current.right - dx);
      const bottom = Math.max(8, dragRef.current.bottom - dy);
      onMove({ right, bottom });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMoveDoc);
      window.removeEventListener('mouseup', onUp);
      const wasDrag = dragRef.current?.moved ?? false;
      dragRef.current = null;
      if (!wasDrag) onPet();
    };
    window.addEventListener('mousemove', onMoveDoc);
    window.addEventListener('mouseup', onUp);
  };

  const onPet = () => {
    setHappy(true);
    setBubble(HINTS[Math.floor(Math.random() * HINTS.length)]);
    setTimeout(() => setHappy(false), 2700);
    setTimeout(() => setBubble(null), 4200);
  };

  const cls = `mascot ${happy ? 'happy' : ''} ${wave ? 'wave' : ''}`;

  return (
    <>
      {bubble && (
        <div
          className="mascot-bubble"
          style={{
            right: position.right + 90,
            bottom: position.bottom + 24,
          }}
        >
          {bubble}
        </div>
      )}
      <div
        ref={ref}
        className={cls}
        style={{ right: position.right, bottom: position.bottom }}
        onMouseDown={onDown}
        title="Hi, ich bin Disco — klick mich an oder zieh mich!"
      >
        <DiscoSvg />
        <div className="mascot-orbit">
          <span>💬</span>
          <span>📦</span>
          <span>✨</span>
        </div>
      </div>
    </>
  );
}

function DiscoSvg() {
  // Freundliches Discord-Cube-Wesen mit Augen, Mund, kleinem Arm zum Winken
  return (
    <svg className="mascot-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mascotBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="color-mix(in srgb, var(--accent) 50%, #000)" />
        </linearGradient>
        <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,150,150,0.9)" />
          <stop offset="100%" stopColor="rgba(255,150,150,0)" />
        </radialGradient>
      </defs>
      {/* Schatten */}
      <ellipse cx="50" cy="92" rx="22" ry="3" fill="rgba(0,0,0,0.25)" />
      {/* Körper als Sprechblase / Cube */}
      <g>
        <rect x="14" y="18" width="72" height="54" rx="14" fill="url(#mascotBody)" stroke="rgba(255,255,255,0.18)" />
        {/* Antenne */}
        <line x1="50" y1="18" x2="50" y2="6" stroke="var(--accent)" strokeWidth="2" />
        <circle cx="50" cy="5" r="3" fill="var(--accent)" />
        {/* Augen */}
        <g className="eye">
          <ellipse cx="38" cy="40" rx="5" ry="6" fill="white" />
          <circle cx="38.5" cy="42" r="2.4" fill="#1a1a2a" />
          <circle cx="40" cy="38.5" r="0.8" fill="white" />
        </g>
        <g className="eye" style={{ animationDelay: '0.15s' }}>
          <ellipse cx="62" cy="40" rx="5" ry="6" fill="white" />
          <circle cx="62.5" cy="42" r="2.4" fill="#1a1a2a" />
          <circle cx="64" cy="38.5" r="0.8" fill="white" />
        </g>
        {/* Wangen */}
        <circle cx="32" cy="52" r="5" fill="url(#cheek)" />
        <circle cx="68" cy="52" r="5" fill="url(#cheek)" />
        {/* Mund */}
        <path d="M42,55 Q50,62 58,55" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* Sprechblasen-Schwanz unten */}
        <path d="M40,72 L50,80 L46,72 Z" fill="url(#mascotBody)" />
        {/* Arm zum Winken */}
        <g className="arm">
          <rect x="78" y="40" width="12" height="6" rx="3" fill="url(#mascotBody)" />
          <circle cx="92" cy="43" r="5" fill="url(#mascotBody)" />
        </g>
      </g>
    </svg>
  );
}
