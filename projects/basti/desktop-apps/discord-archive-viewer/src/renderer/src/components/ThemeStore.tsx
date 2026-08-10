import React, { useState } from 'react';
import { Modal } from './Modal';
import { THEMES, type Theme } from '../themes';
import type { ThemeOverride } from '../../../shared/types';

interface Props {
  activeThemeId: string;
  overrides: Record<string, ThemeOverride>;
  onSelect: (id: string) => void;
  onCustomize: (theme: Theme) => void;
}

export function ThemeStore({ activeThemeId, overrides, onSelect, onCustomize }: Props) {
  return (
    <div className="theme-grid">
      {THEMES.map((t) => (
        <ThemeCard
          key={t.id}
          theme={t}
          active={activeThemeId === t.id}
          customized={!!overrides[t.id]}
          onSelect={() => onSelect(t.id)}
          onCustomize={() => onCustomize(t)}
        />
      ))}
    </div>
  );
}

function ThemeCard({ theme, active, customized, onSelect, onCustomize }: {
  theme: Theme;
  active: boolean;
  customized: boolean;
  onSelect: () => void;
  onCustomize: () => void;
}) {
  // Wir bauen das Preview mit Inline-Styles aus dem Theme.vars,
  // damit das Theme nicht erst global angewendet werden muss.
  const v = theme.vars;
  const previewStyle: React.CSSProperties = {
    background: v['--bg-primary'] ?? '#000',
  };
  const sidebarBg = v['--bg-secondary'] ?? '#000';
  const accent = v['--accent'] ?? '#5865f2';
  const textMuted = v['--text-muted'] ?? '#888';
  const textPrimary = v['--text-primary'] ?? '#fff';

  return (
    <div className={`theme-card ${active ? 'active' : ''}`} onClick={onSelect}>
      {active && <span className="badge">AKTIV</span>}
      {customized && !active && <span className="badge" style={{ background: 'var(--warning)' }}>Custom</span>}
      <button
        className="gear"
        title="Theme anpassen"
        onClick={(e) => { e.stopPropagation(); onCustomize(); }}
      >
        ⚙
      </button>
      <div className="preview" style={previewStyle}>
        <div className="pv-side" style={{ background: sidebarBg }}>
          <div className="pv-pill" style={{ background: accent, width: '70%' }} />
          <div className="pv-pill" style={{ background: textMuted, width: '85%' }} />
          <div className="pv-pill" style={{ background: textMuted, width: '60%' }} />
          <div className="pv-pill" style={{ background: textMuted, width: '78%' }} />
          <div className="pv-pill" style={{ background: accent, width: '52%' }} />
        </div>
        <div className="pv-main" style={{ background: v['--bg-primary'] }}>
          <div className="pv-row">
            <div className="pv-avatar" style={{ background: accent }} />
            <div className="pv-bubble">
              <div className="pv-line" style={{ background: textPrimary, width: '60%', opacity: 0.85 }} />
              <div className="pv-line" style={{ background: textMuted, width: '90%' }} />
              <div className="pv-line" style={{ background: textMuted, width: '70%' }} />
            </div>
          </div>
          <div className="pv-row">
            <div className="pv-avatar" style={{ background: v['--success'] ?? '#3ba55c' }} />
            <div className="pv-bubble">
              <div className="pv-line" style={{ background: textPrimary, width: '50%', opacity: 0.85 }} />
              <div className="pv-line" style={{ background: textMuted, width: '80%' }} />
            </div>
          </div>
        </div>
        <div className="pv-emoji">{theme.emoji}</div>
      </div>
      <div className="meta">
        <div className="name"><span>{theme.emoji}</span> {theme.name}</div>
        <div className="desc">{theme.description}</div>
      </div>
    </div>
  );
}
