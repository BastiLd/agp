import React from 'react';
import { Modal } from './Modal';
import type { Theme } from '../themes';
import type { Density, FontSize, ThemeOverride } from '../../../shared/types';

interface Props {
  theme: Theme;
  override: ThemeOverride;
  onChange: (patch: ThemeOverride) => void;
  onReset: () => void;
  onClose: () => void;
}

export function ThemeCustomizer({ theme, override, onChange, onReset, onClose }: Props) {
  const baseAccent = theme.vars['--accent'] ?? '#5865f2';
  return (
    <Modal title={`⚙ Theme anpassen — ${theme.name}`} onClose={onClose}>
      <div className="modal-section">
        <h3>Akzentfarbe</h3>
        <div className="setting-row">
          <label>Eigene Farbe</label>
          <input
            type="color"
            value={override.accentColor ?? baseAccent}
            onChange={(e) => onChange({ accentColor: e.target.value })}
          />
        </div>
      </div>
      <div className="modal-section">
        <h3>Schrift</h3>
        <div className="setting-row">
          <label>Schriftgröße</label>
          <select
            value={override.fontSize ?? 'medium'}
            onChange={(e) => onChange({ fontSize: e.target.value as FontSize })}
          >
            <option value="small">Klein</option>
            <option value="medium">Mittel</option>
            <option value="large">Groß</option>
          </select>
        </div>
        <div className="setting-row">
          <label>Dichte</label>
          <select
            value={override.density ?? 'cozy'}
            onChange={(e) => onChange({ density: e.target.value as Density })}
          >
            <option value="cozy">Bequem</option>
            <option value="compact">Kompakt</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 16 }}>
        <button className="btn secondary" onClick={onReset}>↻ Zurücksetzen</button>
        <button className="btn" onClick={onClose}>Fertig</button>
      </div>
    </Modal>
  );
}
