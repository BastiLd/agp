import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView, type AttachmentFilter } from './components/ChatView';
import { SearchResults } from './components/SearchResults';
import { ToastContainer, pushToast } from './components/Toast';
import { ContextMenu, type CtxItem } from './components/ContextMenu';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import { GalleryModal } from './components/GalleryModal';
import { Mascot } from './components/Mascot';
import { applyTheme } from './themes';
import type {
  AppSettings, AttachmentModel, ChannelModel, MessageModel,
  ScanResult, ScanResultChannelMeta, SearchHit, SearchQuery,
} from '../../shared/types';
import { executeSearch } from './search';

const DEFAULT_SETTINGS: AppSettings = {
  folders: [],
  theme: 'discord-dark',
  themeOverrides: {},
  density: 'cozy',
  fontSize: 'medium',
  imageSize: 'large',
  timeFormat: '24h',
  avatarShape: 'circle',
  sidebarWidth: 320,
  pinnedChannelIds: [],
  collapsedGuilds: [],
  hiddenChannelIds: [],
  autoHideEmptyChannels: false,
  showAttachmentFilters: true,
  groupConsecutiveMessages: true,
  hideBots: false,
  showReadingProgress: true,
  showAuthorColors: true,
  wallpaperOpacity: 1,
  showMessageDividers: true,
  stickyDayDividers: false,
  restoreScrollPosition: true,
  customCss: '',
  mascotEnabled: true,
  mascotPosition: { right: 24, bottom: 80 },
  windowBounds: null,
};

export function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [channels, setChannels] = useState<ScanResultChannelMeta[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const loadedChannels = useRef<Map<string, ChannelModel>>(new Map());
  const [activeChannel, setActiveChannel] = useState<ChannelModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingChannel, setLoadingChannel] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchScope, setSearchScope] = useState<'current' | 'global'>('current');
  const [searchCase, setSearchCase] = useState(false);
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searchTruncated, setSearchTruncated] = useState(false);
  const searchTimeout = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [attachmentFilter, setAttachmentFilter] = useState<AttachmentFilter>('all');
  const [jumpToDate, setJumpToDate] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; items: CtxItem[] } | null>(null);
  const [mascotHint, setMascotHint] = useState<string | undefined>(undefined);

  const scrollMap = useRef<Map<string, { anchorMessageId: string | null; anchorOffset: number; atBottom: boolean }>>(new Map());
  const getSavedScroll = useCallback((id: string) => scrollMap.current.get(id) ?? null, []);
  const saveScroll = useCallback((id: string, s: { anchorMessageId: string | null; anchorOffset: number; atBottom: boolean }) => {
    scrollMap.current.set(id, s);
  }, []);

  const searchActive = useMemo(() => (
    searchText.trim().length > 0 || searchAuthor.trim().length > 0 || !!searchFrom || !!searchTo
  ), [searchText, searchAuthor, searchFrom, searchTo]);

  useEffect(() => {
    (async () => {
      const s = await window.api.getSettings();
      setSettings(s);
    })();
  }, []);

  // Theme + Layout-Settings als CSS-Attributes
  useEffect(() => {
    const override = settings.themeOverrides[settings.theme];
    applyTheme(settings.theme, override?.accentColor);
    const fs = override?.fontSize ?? settings.fontSize;
    const dens = override?.density ?? settings.density;
    const root = document.documentElement;
    root.setAttribute('data-fontsize', fs);
    root.setAttribute('data-density', dens);
    root.setAttribute('data-img', settings.imageSize);
    root.setAttribute('data-avatar', settings.avatarShape);
    root.setAttribute('data-dividers', settings.showMessageDividers ? 'on' : 'off');
    root.setAttribute('data-sticky-day', settings.stickyDayDividers ? 'on' : 'off');
    root.style.setProperty('--sidebar-w', `${settings.sidebarWidth}px`);
    root.style.setProperty('--wallpaper-opacity', String(settings.wallpaperOpacity));
  }, [settings]);

  // Custom CSS
  useEffect(() => {
    let style = document.getElementById('user-custom-css') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'user-custom-css';
      document.head.appendChild(style);
    }
    style.textContent = settings.customCss || '';
  }, [settings.customCss]);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = await window.api.updateSettings(patch);
    setSettings(next);
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const res: ScanResult = await window.api.scan();
      setChannels(res.channels);
      for (const err of res.errors) pushToast(`Fehler in ${err.filePath}: ${err.message}`, 'error', 7000);
      for (const skip of res.skippedFolders) pushToast(`Übersprungen: ${skip.path} (${skip.reason})`, 'warning', 7000);
    } catch (e: any) {
      pushToast(`Scan fehlgeschlagen: ${e?.message ?? e}`, 'error');
    } finally { setBusy(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!activeChannelId) { setActiveChannel(null); return; }
    const cached = loadedChannels.current.get(activeChannelId);
    if (cached) { setActiveChannel(cached); return; }
    let cancelled = false;
    setLoadingChannel(true);
    setChannelError(null);
    window.api.loadChannel(activeChannelId).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setChannelError(res.error.message);
        setActiveChannel(null);
      } else {
        loadedChannels.current.set(res.channel.id, res.channel);
        setActiveChannel(res.channel);
        for (const w of res.channel.warnings) pushToast(w, 'warning');
      }
      setLoadingChannel(false);
    }).catch((e) => {
      if (cancelled) return;
      setChannelError(e?.message ?? String(e));
      setLoadingChannel(false);
    });
    return () => { cancelled = true; };
  }, [activeChannelId]);

  const lastPersonLabel = useRef<string>('Ich');
  const askPersonLabel = async (folderIds: string[]) => {
    if (folderIds.length === 0) return;
    const name = window.prompt(
      'Wessen Nachrichten liegen in diesem Ordner? (z. B. dein Name — wichtig bei Discords offiziellem Datenexport, der nur eigene Nachrichten enthält)',
      lastPersonLabel.current,
    );
    if (!name || !name.trim()) return;
    lastPersonLabel.current = name.trim();
    for (const id of folderIds) await window.api.updateFolder(id, { personLabel: name.trim() });
  };
  const onAddChannelFolders = async () => {
    const r = await window.api.pickChannelFolders();
    if ('canceled' in r) return;
    await askPersonLabel(r.folders.map((f) => f.id));
    pushToast(`${r.folders.length} Ordner hinzugefügt — scanne…`, 'info');
    refresh();
  };
  const onAddRootFolder = async () => {
    const r = await window.api.pickRootFolder();
    if ('canceled' in r) return;
    await askPersonLabel([r.folder.id]);
    pushToast('Hauptordner hinzugefügt — scanne…', 'info');
    refresh();
  };
  const onRescan = () => refresh();
  const onClearAll = async () => {
    if (!confirm('Wirklich alle registrierten Ordner aus der App entfernen? Originaldateien bleiben unverändert.')) return;
    const folders = await window.api.getRegisteredFolders();
    for (const f of folders) await window.api.removeFolder(f.id);
    setActiveChannelId(null);
    setActiveChannel(null);
    loadedChannels.current.clear();
    setChannels([]);
    pushToast('Alle Ordner entfernt.', 'info');
  };
  const onTogglePin = (id: string) => {
    const next = settings.pinnedChannelIds.includes(id)
      ? settings.pinnedChannelIds.filter((x) => x !== id)
      : [...settings.pinnedChannelIds, id];
    updateSettings({ pinnedChannelIds: next });
  };
  const onToggleHidden = (id: string) => {
    const next = settings.hiddenChannelIds.includes(id)
      ? settings.hiddenChannelIds.filter((x) => x !== id)
      : [...settings.hiddenChannelIds, id];
    updateSettings({ hiddenChannelIds: next });
  };
  const onToggleAutoHideEmpty = () => updateSettings({ autoHideEmptyChannels: !settings.autoHideEmptyChannels });
  const onToggleGuild = (g: string) => {
    const next = settings.collapsedGuilds.includes(g)
      ? settings.collapsedGuilds.filter((x) => x !== g)
      : [...settings.collapsedGuilds, g];
    updateSettings({ collapsedGuilds: next });
  };
  const onOpenHtml = async () => {
    if (!activeChannelId) return;
    // Wir öffnen IMMER im Browser — das ist konsistent.
    const r = await window.api.openInBrowser(activeChannelId);
    if (!r.ok) pushToast(r.error ?? 'Konnte HTML nicht öffnen.', 'error');
  };
  const onOpenInBrowser = onOpenHtml;
  const onOpenWebsite = async () => {
    if (!activeChannelId) return;
    pushToast('Generiere Website (kann bei vielen Bildern etwas dauern)…', 'info');
    const r = await window.api.openWebsite(activeChannelId);
    if (!r.ok) pushToast(r.error ?? 'Konnte Website nicht öffnen.', 'error');
    else pushToast('Website im Browser geöffnet ✨', 'info');
  };
  const onOpenChannelFolder = async () => {
    if (!activeChannelId) return;
    const r = await window.api.openChannelFolder(activeChannelId);
    if (!r.ok) pushToast(r.error ?? 'Ordner nicht erreichbar.', 'error');
  };
  const onExportMarkdown = async () => {
    if (!activeChannelId) return;
    const r = await window.api.exportMarkdown(activeChannelId);
    if (!r.ok) pushToast(r.error ?? 'Konnte Markdown nicht erstellen.', 'error');
    else pushToast('Markdown exportiert: ' + (r.filePath ?? ''), 'info');
  };

  const runSearch = useCallback(async () => {
    if (!searchActive) { setSearchHits([]); setSearchTruncated(false); return; }
    const query: SearchQuery = {
      text: searchText, caseSensitive: searchCase, author: searchAuthor,
      dateFrom: searchFrom || null, dateTo: searchTo || null,
      scope: searchScope, currentChannelId: activeChannelId,
    };
    if (searchScope === 'global') {
      const missing = channels.filter((m) => !loadedChannels.current.has(m.id));
      for (const m of missing) {
        const r = await window.api.loadChannel(m.id);
        if (r.ok) loadedChannels.current.set(m.id, r.channel);
      }
    }
    const r = executeSearch(query, loadedChannels.current,
      channels.map((c) => ({ id: c.id, displayName: c.displayName })));
    if (r.error) pushToast(r.error, 'error');
    setSearchHits(r.hits);
    setSearchTruncated(r.truncated);
  }, [searchText, searchAuthor, searchFrom, searchTo, searchCase, searchScope, activeChannelId, channels, searchActive]);

  useEffect(() => {
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    searchTimeout.current = window.setTimeout(runSearch, 350);
    return () => { if (searchTimeout.current) window.clearTimeout(searchTimeout.current); };
  }, [runSearch]);

  const onSelectSearchHit = (hit: SearchHit) => {
    setActiveChannelId(hit.channelId);
    setHighlightMessageId(hit.messageId);
    setTimeout(() => setHighlightMessageId(null), 3000);
  };

  const onSidebarContext = (e: React.MouseEvent, c: ScanResultChannelMeta) => {
    e.preventDefault();
    const items: CtxItem[] = [
      { label: '📂 Channel öffnen', onClick: () => setActiveChannelId(c.id) },
      { label: settings.pinnedChannelIds.includes(c.id) ? '☆ Anpinnung entfernen' : '★ Anpinnen', onClick: () => onTogglePin(c.id) },
      { label: settings.hiddenChannelIds.includes(c.id) ? '👁 Wieder einblenden' : '🙈 Ausblenden (nicht löschen)', onClick: () => onToggleHidden(c.id) },
      { separator: true, label: '', onClick: () => {} },
      { label: '🌐 In HTML öffnen', onClick: async () => { await window.api.openInBrowser(c.id); } },
      { label: '✨ Als Website öffnen', onClick: async () => { await window.api.openWebsite(c.id); } },
      { label: '📝 Als Markdown exportieren', onClick: async () => { await window.api.exportMarkdown(c.id); } },
      { label: '📁 Ordner im Explorer', onClick: async () => { await window.api.openChannelFolder(c.id); } },
      { separator: true, label: '', onClick: () => {} },
      { label: '🗑 Aus Liste entfernen', onClick: async () => {
        const folders = await window.api.getRegisteredFolders();
        const matched = folders.find((f) => c.jsonFilePath.startsWith(f.path));
        if (matched) {
          await window.api.removeFolder(matched.id);
          pushToast(`Entfernt: ${matched.path}`, 'info');
          refresh();
        } else {
          pushToast('Konnte zugehörigen Ordner nicht ermitteln.', 'warning');
        }
      } },
    ];
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  };

  const onMessageContext = (e: React.MouseEvent, m: MessageModel, att?: AttachmentModel) => {
    e.preventDefault();
    const items: CtxItem[] = [];
    if (att) {
      items.push({ label: '📂 Datei öffnen', onClick: async () => {
        if (att.localPath) { const r = await window.api.openFile(att.localPath); if (!r.ok) pushToast(r.error ?? 'Fehler', 'error'); }
      }});
      items.push({ label: '📁 Im Explorer anzeigen', onClick: async () => {
        if (att.localPath) { const r = await window.api.showFileInExplorer(att.localPath); if (!r.ok) pushToast(r.error ?? 'Fehler', 'error'); }
      }});
      items.push({ label: '📋 Dateiname kopieren', onClick: () => navigator.clipboard.writeText(att.fileName || att.url) });
      items.push({ separator: true, label: '', onClick: () => {} });
    }
    items.push({ label: '📋 Nachrichtentext kopieren', onClick: () => navigator.clipboard.writeText(m.content || '') });
    items.push({ label: '📋 Autor kopieren', onClick: () => navigator.clipboard.writeText(m.authorName || '') });
    items.push({ label: '📋 Zeitstempel kopieren', onClick: () => navigator.clipboard.writeText(m.timestamp || '') });
    items.push({ label: '📋 Nachrichten-ID kopieren', onClick: () => navigator.clipboard.writeText(m.id) });
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  };

  const switchChannel = (delta: 1 | -1) => {
    if (channels.length === 0) return;
    const idx = activeChannelId ? channels.findIndex((c) => c.id === activeChannelId) : -1;
    const nextIdx = (idx + delta + channels.length) % channels.length;
    setActiveChannelId(channels[nextIdx].id);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const inInput = (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA';

      if (e.ctrlKey && e.key === 'f') { e.preventDefault(); searchInputRef.current?.focus(); searchInputRef.current?.select(); }
      else if (e.ctrlKey && e.key === ',') { e.preventDefault(); setShowSettings(true); }
      else if (e.ctrlKey && (e.key === 'g' || e.key === 'G')) { e.preventDefault(); if (activeChannel) setShowGallery(true); }
      else if (e.ctrlKey && (e.key === 'i' || e.key === 'I')) { e.preventDefault(); if (activeChannel) setShowStats(true); }
      else if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); if (activeChannel) onOpenHtml(); }
      else if (e.ctrlKey && (e.key === 'w' || e.key === 'W')) { e.preventDefault(); if (activeChannel) onOpenWebsite(); }
      else if (e.ctrlKey && (e.key === 't' || e.key === 'T')) { e.preventDefault(); setShowSettings(true); setMascotHint('Theme-Store geöffnet 🎨'); }
      else if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); updateSettings({ mascotEnabled: !settings.mascotEnabled }); }
      else if (e.ctrlKey && e.key === 'ArrowDown' && !inInput) { e.preventDefault(); switchChannel(1); }
      else if (e.ctrlKey && e.key === 'ArrowUp' && !inInput) { e.preventDefault(); switchChannel(-1); }
      else if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        const order = ['small', 'medium', 'large'];
        const cur = order.indexOf(settings.fontSize);
        if (cur < order.length - 1) updateSettings({ fontSize: order[cur + 1] as any });
      }
      else if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        const order = ['small', 'medium', 'large'];
        const cur = order.indexOf(settings.fontSize);
        if (cur > 0) updateSettings({ fontSize: order[cur - 1] as any });
      }
      else if (e.ctrlKey && /^[1-9]$/.test(e.key) && !inInput) {
        e.preventDefault();
        const idx = Number(e.key) - 1;
        if (idx < channels.length) setActiveChannelId(channels[idx].id);
      }
      else if (e.key === 'Escape') {
        if (lightbox) { setLightbox(null); return; }
        if (ctxMenu) { setCtxMenu(null); return; }
        if (showSettings || showStats || showGallery) {
          setShowSettings(false); setShowStats(false); setShowGallery(false); return;
        }
        if (searchActive) { setSearchText(''); setSearchAuthor(''); setSearchFrom(''); setSearchTo(''); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeChannel, lightbox, ctxMenu, showSettings, showStats, showGallery, searchActive, settings, channels, activeChannelId, updateSettings]);

  const draggingRef = useRef(false);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const w = Math.max(240, Math.min(520, e.clientX));
      document.documentElement.style.setProperty('--sidebar-w', `${w}px`);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const w = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w')) || 320;
      updateSettings({ sidebarWidth: w });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [updateSettings]);

  return (
    <div className="app">
      <Sidebar
        channels={channels}
        pinnedIds={settings.pinnedChannelIds}
        collapsedGuilds={settings.collapsedGuilds}
        hiddenIds={settings.hiddenChannelIds}
        autoHideEmpty={settings.autoHideEmptyChannels}
        activeChannelId={activeChannelId}
        busy={busy}
        onAddChannelFolders={onAddChannelFolders}
        onAddRootFolder={onAddRootFolder}
        onRescan={onRescan}
        onClearAll={onClearAll}
        onSelectChannel={(id) => { setActiveChannelId(id); setHighlightMessageId(null); setAttachmentFilter('all'); }}
        onTogglePin={onTogglePin}
        onToggleHidden={onToggleHidden}
        onToggleAutoHideEmpty={onToggleAutoHideEmpty}
        onToggleGuild={onToggleGuild}
        onContext={onSidebarContext}
        onOpenSettings={() => setShowSettings(true)}
        searchText={searchText} onSearchTextChange={setSearchText}
        searchAuthor={searchAuthor} onSearchAuthorChange={setSearchAuthor}
        searchFrom={searchFrom} onSearchFromChange={setSearchFrom}
        searchTo={searchTo} onSearchToChange={setSearchTo}
        searchScope={searchScope} onSearchScopeChange={setSearchScope}
        searchCaseSensitive={searchCase} onSearchCaseChange={setSearchCase}
        searchInputRef={searchInputRef}
      />
      <div className="resizer" onMouseDown={() => { draggingRef.current = true; }} />
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ChatView
          channel={activeChannel}
          loading={loadingChannel}
          error={channelError}
          warnings={activeChannel?.warnings ?? []}
          highlightMessageId={highlightMessageId}
          searchHighlight={searchActive ? searchText : ''}
          attachmentFilter={attachmentFilter}
          onAttachmentFilter={setAttachmentFilter}
          jumpToDate={jumpToDate}
          onJumpToDate={setJumpToDate}
          hideBots={settings.hideBots}
          groupConsecutive={settings.groupConsecutiveMessages}
          showAuthorColors={settings.showAuthorColors}
          showProgress={settings.showReadingProgress}
          timeFormat={settings.timeFormat}
          restoreScrollPosition={settings.restoreScrollPosition}
          onOpenHtml={onOpenHtml}
          onOpenWebsite={onOpenWebsite}
          onOpenChannelFolder={onOpenChannelFolder}
          onOpenStats={() => setShowStats(true)}
          onOpenGallery={() => setShowGallery(true)}
          onExportMarkdown={onExportMarkdown}
          onLightbox={(u) => setLightbox(u)}
          onMessageContext={onMessageContext}
          getSavedScroll={getSavedScroll}
          saveScroll={saveScroll}
        />
        <SearchResults
          hits={searchHits}
          active={searchActive}
          truncated={searchTruncated}
          scope={searchScope}
          onSelect={onSelectSearchHit}
          onClose={() => { setSearchText(''); setSearchAuthor(''); setSearchFrom(''); setSearchTo(''); }}
        />
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onChange={updateSettings}
          onRenameFolder={async (id, label) => { await window.api.updateFolder(id, { personLabel: label }); refresh(); }}
          onRemoveFolder={async (id) => { await window.api.removeFolder(id); refresh(); }}
        />
      )}
      {showStats && activeChannel && <StatsModal channel={activeChannel} onClose={() => setShowStats(false)} />}
      {showGallery && activeChannel && (
        <GalleryModal channel={activeChannel} onClose={() => setShowGallery(false)} onLightbox={(u) => setLightbox(u)} />
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          {/\.(mp4|webm|mov)/i.test(lightbox) ? (
            <video src={lightbox} controls autoPlay />
          ) : (
            <img src={lightbox} alt="" />
          )}
        </div>
      )}

      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />}

      <Mascot
        enabled={settings.mascotEnabled}
        position={settings.mascotPosition}
        onMove={(p) => updateSettings({ mascotPosition: p })}
        hint={mascotHint}
      />

      <ToastContainer />
    </div>
  );
}
