import React, { useMemo } from 'react';
import type { ScanResultChannelMeta } from '../../../shared/types';

export interface SidebarProps {
  channels: ScanResultChannelMeta[];
  pinnedIds: string[];
  collapsedGuilds: string[];
  hiddenIds: string[];
  autoHideEmpty: boolean;
  activeChannelId: string | null;
  busy: boolean;
  onAddChannelFolders: () => void;
  onAddRootFolder: () => void;
  onRescan: () => void;
  onClearAll: () => void;
  onSelectChannel: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onToggleAutoHideEmpty: () => void;
  onToggleGuild: (guild: string) => void;
  onContext: (e: React.MouseEvent, channel: ScanResultChannelMeta) => void;
  onOpenSettings: () => void;

  searchText: string;
  onSearchTextChange: (s: string) => void;
  searchAuthor: string;
  onSearchAuthorChange: (s: string) => void;
  searchFrom: string;
  onSearchFromChange: (s: string) => void;
  searchTo: string;
  onSearchToChange: (s: string) => void;
  searchScope: 'current' | 'global';
  onSearchScopeChange: (s: 'current' | 'global') => void;
  searchCaseSensitive: boolean;
  onSearchCaseChange: (v: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export function Sidebar(props: SidebarProps) {
  const hiddenSet = new Set(props.hiddenIds);
  const visibleChannels = useMemo(() => (
    props.channels.filter((c) => !hiddenSet.has(c.id) && !(props.autoHideEmpty && c.messageCount === 0))
  ), [props.channels, props.hiddenIds, props.autoHideEmpty]);
  const hiddenChannels = useMemo(() => props.channels.filter((c) => hiddenSet.has(c.id)), [props.channels, props.hiddenIds]);
  const autoHiddenCount = useMemo(() => (
    props.autoHideEmpty ? props.channels.filter((c) => !hiddenSet.has(c.id) && c.messageCount === 0).length : 0
  ), [props.channels, props.hiddenIds, props.autoHideEmpty]);

  const grouped = useMemo(() => {
    const map = new Map<string, ScanResultChannelMeta[]>();
    for (const c of visibleChannels) {
      const g = c.guildName || 'Sonstige';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(c);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.channelName.localeCompare(b.channelName));
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visibleChannels]);

  const pinnedSet = new Set(props.pinnedIds);
  const pinned = visibleChannels.filter((c) => pinnedSet.has(c.id));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <span className="logo">DA</span>
          <span>Discord Archive</span>
          <span className="pulse" title="Lokal aktiv" />
        </div>
        <div className="sidebar-actions">
          <button className="btn" disabled={props.busy} onClick={props.onAddChannelFolders}>+ Channel-Ordner</button>
          <button className="btn" disabled={props.busy} onClick={props.onAddRootFolder}>+ Hauptordner</button>
          <button className="btn secondary" disabled={props.busy} onClick={props.onRescan}>↻ Neu scannen</button>
          <button className="btn secondary" onClick={props.onOpenSettings}>⚙ Einstellungen</button>
          <button className="btn danger" disabled={props.busy || props.channels.length === 0} onClick={props.onClearAll}>Alle entfernen</button>
        </div>
        <div className="sidebar-actions">
          <button
            className={`btn secondary ${props.autoHideEmpty ? 'active' : ''}`}
            onClick={props.onToggleAutoHideEmpty}
            title="Leere Channels (0 Nachrichten) werden nur ausgeblendet, nicht gelöscht."
          >
            🙈 Leere Channels {props.autoHideEmpty ? 'ausgeblendet' : 'ausblenden'}{autoHiddenCount > 0 ? ` (${autoHiddenCount})` : ''}
          </button>
        </div>

        <div className="search-box">
          <input
            ref={props.searchInputRef}
            type="text"
            placeholder="Suchen…   Strg+F"
            value={props.searchText}
            onChange={(e) => props.onSearchTextChange(e.target.value)}
          />
        </div>
        <div className="search-controls">
          <input
            type="text"
            placeholder="Autor"
            value={props.searchAuthor}
            onChange={(e) => props.onSearchAuthorChange(e.target.value)}
          />
          <label>Von <input type="date" value={props.searchFrom} onChange={(e) => props.onSearchFromChange(e.target.value)} /></label>
          <label>Bis <input type="date" value={props.searchTo} onChange={(e) => props.onSearchToChange(e.target.value)} /></label>
          <label>
            <input type="checkbox" checked={props.searchCaseSensitive} onChange={(e) => props.onSearchCaseChange(e.target.checked)} />
            Aa
          </label>
          <select value={props.searchScope} onChange={(e) => props.onSearchScopeChange(e.target.value as any)}>
            <option value="current">Channel</option>
            <option value="global">Global</option>
          </select>
        </div>
      </div>

      <div className="channel-list">
        {props.channels.length === 0 && (
          <div className="channel-list-empty">
            Noch keine Channels.<br />
            Wähle einen <b>Channel-Ordner</b> oder einen <b>Hauptordner</b>.
          </div>
        )}
        {props.channels.length > 0 && visibleChannels.length === 0 && hiddenChannels.length === 0 && (
          <div className="channel-list-empty">Alle Channels sind leer und ausgeblendet.</div>
        )}

        {pinned.length > 0 && (
          <div className="guild-group">
            <div className="guild-header" onClick={() => props.onToggleGuild('★_PINNED')}>
              <span className={`caret ${props.collapsedGuilds.includes('★_PINNED') ? 'collapsed' : ''}`}>▾</span>
              <span>★ Angepinnt</span>
              <span className="guild-count">{pinned.length}</span>
            </div>
            {!props.collapsedGuilds.includes('★_PINNED') && pinned.map((c) => (
              <ChannelRow
                key={c.id}
                c={c}
                active={props.activeChannelId === c.id}
                pinned
                hidden={false}
                onClick={() => props.onSelectChannel(c.id)}
                onPin={() => props.onTogglePin(c.id)}
                onHide={() => props.onToggleHidden(c.id)}
                onContext={(e) => props.onContext(e, c)}
              />
            ))}
          </div>
        )}

        {grouped.map(([guild, list]) => {
          const collapsed = props.collapsedGuilds.includes(guild);
          return (
            <div className="guild-group" key={guild}>
              <div className={`guild-header ${collapsed ? 'collapsed' : ''}`} onClick={() => props.onToggleGuild(guild)}>
                <span className="caret">▾</span>
                <span>{guild}</span>
                <span className="guild-count">{list.length}</span>
              </div>
              {!collapsed && list.map((c) => (
                <ChannelRow
                  key={c.id}
                  c={c}
                  active={props.activeChannelId === c.id}
                  pinned={pinnedSet.has(c.id)}
                  hidden={false}
                  onClick={() => props.onSelectChannel(c.id)}
                  onPin={() => props.onTogglePin(c.id)}
                  onHide={() => props.onToggleHidden(c.id)}
                  onContext={(e) => props.onContext(e, c)}
                />
              ))}
            </div>
          );
        })}

        {hiddenChannels.length > 0 && (
          <div className="guild-group">
            <div className="guild-header" onClick={() => props.onToggleGuild('🙈_HIDDEN')}>
              <span className={`caret ${props.collapsedGuilds.includes('🙈_HIDDEN') ? 'collapsed' : ''}`}>▾</span>
              <span>🙈 Ausgeblendet</span>
              <span className="guild-count">{hiddenChannels.length}</span>
            </div>
            {!props.collapsedGuilds.includes('🙈_HIDDEN') && hiddenChannels.map((c) => (
              <ChannelRow
                key={c.id}
                c={c}
                active={props.activeChannelId === c.id}
                pinned={pinnedSet.has(c.id)}
                hidden
                onClick={() => props.onSelectChannel(c.id)}
                onPin={() => props.onTogglePin(c.id)}
                onHide={() => props.onToggleHidden(c.id)}
                onContext={(e) => props.onContext(e, c)}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function ChannelRow({
  c, active, pinned, hidden, onClick, onPin, onHide, onContext,
}: {
  c: ScanResultChannelMeta;
  active: boolean;
  pinned: boolean;
  hidden: boolean;
  onClick: () => void;
  onPin: () => void;
  onHide: () => void;
  onContext: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`channel-item ${active ? 'active' : ''} ${c.available ? '' : 'unavailable'} ${hidden ? 'is-hidden' : ''}`}
      onClick={onClick}
      onContextMenu={onContext}
      title="Klick: öffnen — Rechtsklick: mehr Aktionen"
      role="button"
    >
      <span className="channel-hash">#</span>
      <span className="channel-name">{c.channelName || 'Channel'}</span>
      {(c.sourceCount ?? 1) > 1 && (
        <span className="channel-meta" title={`${c.sourceCount} Personen/Quellen zusammengeführt`}>👥{c.sourceCount}</span>
      )}
      <span className="channel-meta">{c.messageCount}</span>
      <button
        className={`channel-pin ${pinned ? 'pinned' : ''}`}
        onClick={(e) => { e.stopPropagation(); onPin(); }}
        title={pinned ? 'Anpinnung entfernen' : 'Anpinnen'}
      >
        ★
      </button>
      <button
        className={`channel-pin ${hidden ? 'pinned' : ''}`}
        onClick={(e) => { e.stopPropagation(); onHide(); }}
        title={hidden ? 'Wieder einblenden' : 'Ausblenden (nicht löschen)'}
      >
        {hidden ? '👁' : '🙈'}
      </button>
    </div>
  );
}
