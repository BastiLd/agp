import React, { useState } from 'react';
import { Modal } from './Modal';
import { ThemeStore } from './ThemeStore';
import { ThemeCustomizer } from './ThemeCustomizer';
import type { Theme } from '../themes';
import type { AppSettings, ThemeOverride } from '../../../shared/types';

interface Props {
  settings: AppSettings;
  onClose: () => void;
  onChange: (patch: Partial<AppSettings>) => void;
  onRenameFolder?: (id: string, personLabel: string) => void;
  onRemoveFolder?: (id: string) => void;
}

const KBD: React.CSSProperties = {
  display: 'inline-block', padding: '2px 6px', borderRadius: 4,
  background: 'var(--bg-elev)', border: '1px solid var(--border)',
  fontSize: 11, fontFamily: 'Consolas, monospace',
};

export function SettingsModal({ settings, onClose, onChange, onRenameFolder, onRemoveFolder }: Props) {
  const [tab, setTab] = useState<'themes' | 'layout' | 'messages' | 'mascot' | 'advanced' | 'shortcuts'>('themes');
  const [customizing, setCustomizing] = useState<Theme | null>(null);

  const setOverride = (id: string, patch: ThemeOverride) => {
    const next = { ...settings.themeOverrides };
    next[id] = { ...(next[id] ?? {}), ...patch };
    onChange({ themeOverrides: next });
  };
  const resetOverride = (id: string) => {
    const next = { ...settings.themeOverrides };
    delete next[id];
    onChange({ themeOverrides: next });
  };

  return (
    <>
      <Modal title="⚙ Einstellungen" onClose={onClose} wide>
        <div className="tabs" style={{ margin: '-18px -18px 18px' }}>
          <button className={`tab ${tab === 'themes' ? 'active' : ''}`} onClick={() => setTab('themes')}>🎨 Themes (35)</button>
          <button className={`tab ${tab === 'layout' ? 'active' : ''}`} onClick={() => setTab('layout')}>📐 Layout</button>
          <button className={`tab ${tab === 'messages' ? 'active' : ''}`} onClick={() => setTab('messages')}>💬 Nachrichten</button>
          <button className={`tab ${tab === 'mascot' ? 'active' : ''}`} onClick={() => setTab('mascot')}>🦊 Maskottchen</button>
          <button className={`tab ${tab === 'advanced' ? 'active' : ''}`} onClick={() => setTab('advanced')}>🛠 Erweitert</button>
          <button className={`tab ${tab === 'shortcuts' ? 'active' : ''}`} onClick={() => setTab('shortcuts')}>⌨ Shortcuts</button>
        </div>

        {tab === 'themes' && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 0 }}>
              35 Themes verfügbar. Klick auf eine Kachel zum Aktivieren. ⚙ in der Ecke öffnet die Anpassung.
            </p>
            <ThemeStore
              activeThemeId={settings.theme}
              overrides={settings.themeOverrides}
              onSelect={(id) => onChange({ theme: id })}
              onCustomize={(t) => setCustomizing(t)}
            />
          </>
        )}

        {tab === 'layout' && (
          <div className="modal-section">
            <h3>Schrift & Dichte</h3>
            <div className="setting-row">
              <label>Schriftgröße</label>
              <select value={settings.fontSize} onChange={(e) => onChange({ fontSize: e.target.value as any })}>
                <option value="small">Klein</option>
                <option value="medium">Mittel</option>
                <option value="large">Groß</option>
              </select>
            </div>
            <div className="setting-row">
              <label>Dichte</label>
              <select value={settings.density} onChange={(e) => onChange({ density: e.target.value as any })}>
                <option value="cozy">Bequem</option>
                <option value="compact">Kompakt</option>
              </select>
            </div>
            <h3 style={{ marginTop: 18 }}>Bilder & Anhänge</h3>
            <div className="setting-row">
              <label>Bildgröße</label>
              <select value={settings.imageSize} onChange={(e) => onChange({ imageSize: e.target.value as any })}>
                <option value="small">Klein (320×280)</option>
                <option value="medium">Mittel (480×400)</option>
                <option value="large">Groß (600×520)</option>
                <option value="huge">Riesig (820×720)</option>
                <option value="native">Original</option>
              </select>
            </div>
            <h3 style={{ marginTop: 18 }}>Avatare</h3>
            <div className="setting-row">
              <label>Avatar-Form</label>
              <select value={settings.avatarShape} onChange={(e) => onChange({ avatarShape: e.target.value as any })}>
                <option value="circle">Kreis</option>
                <option value="rounded">Abgerundet</option>
                <option value="square">Quadrat</option>
              </select>
            </div>
            <h3 style={{ marginTop: 18 }}>Sidebar</h3>
            <div className="setting-row">
              <label>Sidebar-Breite (px)</label>
              <input
                type="number" min={240} max={520} step={10}
                value={settings.sidebarWidth}
                onChange={(e) => onChange({ sidebarWidth: Math.max(240, Math.min(520, Number(e.target.value) || 320)) })}
              />
            </div>
            <h3 style={{ marginTop: 18 }}>Wallpaper</h3>
            <div className="setting-row">
              <label>Wallpaper-Stärke ({Math.round(settings.wallpaperOpacity * 100)}%)</label>
              <input type="range" min={0} max={100} value={Math.round(settings.wallpaperOpacity * 100)}
                onChange={(e) => onChange({ wallpaperOpacity: Number(e.target.value) / 100 })} />
            </div>
          </div>
        )}

        {tab === 'messages' && (
          <div className="modal-section">
            <h3>Anzeige</h3>
            <Toggle label="Zeitformat 24h" value={settings.timeFormat === '24h'} onChange={(v) => onChange({ timeFormat: v ? '24h' : '12h' })} />
            <Toggle label="Aufeinanderfolgende Nachrichten gruppieren" value={settings.groupConsecutiveMessages} onChange={(v) => onChange({ groupConsecutiveMessages: v })} />
            <Toggle label="Autor-Farben anzeigen" value={settings.showAuthorColors} onChange={(v) => onChange({ showAuthorColors: v })} />
            <Toggle label="Datums-Trennlinien anzeigen" value={settings.showMessageDividers} onChange={(v) => onChange({ showMessageDividers: v })} />
            <Toggle label="Datums-Pille beim Scrollen oben fixieren (sticky)" value={settings.stickyDayDividers} onChange={(v) => onChange({ stickyDayDividers: v })} />
            <Toggle label="Lese-Fortschritts-Balken oben" value={settings.showReadingProgress} onChange={(v) => onChange({ showReadingProgress: v })} />
            <Toggle label='Bots ausblenden (Name endet mit "bot")' value={settings.hideBots} onChange={(v) => onChange({ hideBots: v })} />
            <Toggle label="Anhang-Filter-Leiste anzeigen" value={settings.showAttachmentFilters} onChange={(v) => onChange({ showAttachmentFilters: v })} />
            <h3 style={{ marginTop: 18 }}>Scroll-Verhalten</h3>
            <Toggle
              label="Beim Channel-Wechsel: Scroll-Position wiederherstellen"
              value={settings.restoreScrollPosition}
              onChange={(v) => onChange({ restoreScrollPosition: v })}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 6 }}>
              Wenn aktiv: Du landest beim Zurückwechseln genau an der Stelle, wo du aufgehört hast.<br/>
              Wenn aus: Du landest immer am Ende des Channels.
            </p>
          </div>
        )}

        {tab === 'mascot' && (
          <div className="modal-section">
            <h3>Maskottchen „Disco"</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 0 }}>
              Disco ist ein kleiner Begleiter mit Tipps und sanften Animationen. Frei verschiebbar.
            </p>
            <Toggle label="Maskottchen anzeigen" value={settings.mascotEnabled} onChange={(v) => onChange({ mascotEnabled: v })} />
            <div className="setting-row">
              <label>Position zurücksetzen</label>
              <button className="btn secondary" onClick={() => onChange({ mascotPosition: { right: 24, bottom: 80 } })}>↻ Zurücksetzen</button>
            </div>
          </div>
        )}

        {tab === 'advanced' && (
          <div className="modal-section">
            <h3>Custom CSS</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 0 }}>
              Eigene CSS-Regeln. Wirkt sofort. Beispiel:
              <code style={{ display: 'block', background: 'var(--bg-input)', padding: '6px 10px', borderRadius: 6, marginTop: 6, fontFamily: 'Consolas, monospace' }}>
                .message-author {'{'} font-weight: 900 !important; {'}'}
              </code>
            </p>
            <textarea
              value={settings.customCss}
              placeholder="/* Eigenes CSS hier */"
              onChange={(e) => onChange({ customCss: e.target.value })}
              spellCheck={false}
            />
            <div className="setting-row" style={{ marginTop: 14 }}>
              <label>Daten</label>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {settings.pinnedChannelIds.length} Pins · {settings.folders.length} Ordner · {settings.hiddenChannelIds.length} ausgeblendet
              </span>
            </div>

            <h3 style={{ marginTop: 18 }}>Quellen / Personen</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 0 }}>
              Bei Discords offiziellem Datenexport ("Meine Daten anfordern") enthält jede Quelle nur die
              selbst gesendeten Nachrichten der jeweiligen Person. Fügst du mehrere Quellen für denselben
              Channel hinzu (z. B. deinen Export + den einer anderen Person), werden sie automatisch zu
              einer Unterhaltung zusammengeführt. Hier kannst du festlegen, wessen Nachrichten das sind.
            </p>
            {settings.folders.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Noch keine Ordner hinzugefügt.</p>
            )}
            {settings.folders.map((f) => (
              <div className="setting-row" key={f.id}>
                <label title={f.path} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.path.split(/[\\/]/).filter(Boolean).slice(-2).join(' / ')}
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Name der Person"
                    defaultValue={f.personLabel ?? ''}
                    style={{ width: 150 }}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== f.personLabel) onRenameFolder?.(f.id, v);
                    }}
                  />
                  <button className="btn secondary" onClick={() => onRemoveFolder?.(f.id)}>Entfernen</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'shortcuts' && (
          <div className="modal-section">
            <h3>Tastenkürzel</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 14px', fontSize: 13 }}>
              <span style={KBD}>Strg + F</span><span>Suche fokussieren</span>
              <span style={KBD}>Esc</span><span>Suche / Modal schließen</span>
              <span style={KBD}>Strg + ,</span><span>Einstellungen öffnen</span>
              <span style={KBD}>Strg + G</span><span>Galerie</span>
              <span style={KBD}>Strg + I</span><span>Statistik</span>
              <span style={KBD}>Strg + B</span><span>HTML im Browser öffnen</span>
              <span style={KBD}>Strg + W</span><span>Website öffnen (mit allen Funktionen)</span>
              <span style={KBD}>Strg + T</span><span>Theme-Store öffnen</span>
              <span style={KBD}>Strg + M</span><span>Maskottchen ein/aus</span>
              <span style={KBD}>Strg + ↑ / ↓</span><span>Channel wechseln</span>
              <span style={KBD}>Strg + +/−</span><span>Schriftgröße ändern</span>
              <span style={KBD}>Strg + 1..9</span><span>Direkt zu Channel #N</span>
            </div>
          </div>
        )}
      </Modal>

      {customizing && (
        <ThemeCustomizer
          theme={customizing}
          override={settings.themeOverrides[customizing.id] ?? {}}
          onChange={(patch) => setOverride(customizing.id, patch)}
          onReset={() => { resetOverride(customizing.id); }}
          onClose={() => setCustomizing(null)}
        />
      )}
    </>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="setting-row">
      <label>{label}</label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'unset' }}>
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        {value ? 'An' : 'Aus'}
      </label>
    </div>
  );
}
