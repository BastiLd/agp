import {
  CheckCircle2,
  Copy,
  Database,
  Download,
  ExternalLink,
  FolderOpen,
  FolderPlus,
  HardDrive,
  ListChecks,
  Loader2,
  Monitor,
  Play,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  Usb,
  XCircle
} from 'lucide-react';
import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AppSettings,
  FileAction,
  IndexStatus,
  MatchHit,
  MediaSource,
  SavedCollection,
  ScanProgress,
  SearchResult,
  SourceKind
} from '../../shared/types';

type View = 'search' | 'results' | 'settings';
type SettingsTab = 'sources' | 'search' | 'tmdb' | 'index' | 'extras';
type TmdbStatus = 'active' | 'missing' | 'invalid' | 'offline';

const sourceKindLabels: Record<SourceKind, string> = {
  plex: 'Plex',
  pc: 'PC/NAS',
  usb: 'USB',
  other: 'Sonstiges'
};

const sourceKindIcons: Record<SourceKind, JSX.Element> = {
  plex: <Play size={16} />,
  pc: <Monitor size={16} />,
  usb: <Usb size={16} />,
  other: <HardDrive size={16} />
};

const initialStatus: IndexStatus = {
  itemCount: 0,
  sourceCount: 0,
  lastIndexedAt: null,
  isIndexing: false,
  currentPath: null,
  indexedThisRun: 0
};

const initialSettings: AppSettings = {
  tmdbKey: '',
  matchStrictness: 86,
  collections: [],
  manualAliases: []
};

const presetCollections: SavedCollection[] = [
  {
    id: 'preset-marvel',
    name: 'Marvel',
    createdAt: new Date(0).toISOString(),
    text:
      'Thor 1\nCaptain Amerika the first Avenger\nAvengers\nThor the Dark World\nCaptain Amerika The Winter Soldier\nGuardians of the Galaxy Vol.1\nAvengers Age of Ultron\nAnt-Man\nGuardians of the Galaxy Vol.2\nThor Ragnarök\nAnt-Man and the Wasp\nCaptain Marvel\nBlack Widow\nShang Chi\nEternals'
  },
  {
    id: 'preset-disney',
    name: 'Disney',
    createdAt: new Date(0).toISOString(),
    text: 'Frozen II\nEncanto\nMoana\nZootopia\nRaya and the Last Dragon'
  },
  {
    id: 'preset-action',
    name: 'Action',
    createdAt: new Date(0).toISOString(),
    text: 'Extraction\nExtraction 2\nJohn Wick\nMad Max Fury Road\nThe Equalizer'
  }
];

export function App(): JSX.Element {
  const apiAvailable = Boolean(window.mediaApp);
  const [view, setView] = useState<View>('search');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('sources');
  const [sources, setSources] = useState<MediaSource[]>([]);
  const [sourceKind, setSourceKind] = useState<SourceKind>('plex');
  const [status, setStatus] = useState<IndexStatus>(initialStatus);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [useTmdb, setUseTmdb] = useState(false);
  const [tmdbStatus, setTmdbStatus] = useState<TmdbStatus>('missing');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; hit: MatchHit; query: string } | null>(null);

  const refresh = useCallback(async () => {
    if (!apiAvailable) {
      return;
    }

    const [loadedSources, loadedStatus, loadedSettings] = await Promise.all([
      window.mediaApp.listSources(),
      window.mediaApp.getIndexStatus(),
      window.mediaApp.getSettings()
    ]);

    setSources(loadedSources);
    setStatus(loadedStatus);
    setSettings({ ...initialSettings, ...loadedSettings });
    setUseTmdb(Boolean(loadedSettings.tmdbKey));
    setLoaded(true);
  }, [apiAvailable]);

  useEffect(() => {
    if (!apiAvailable) {
      return;
    }

    refresh().catch((error) => setMessage(error instanceof Error ? error.message : String(error)));
    return window.mediaApp.onIndexProgress((progress: ScanProgress) => {
      setStatus((current) => ({
        ...current,
        ...progress
      }));
    });
  }, [apiAvailable, refresh]);

  useEffect(() => {
    if (!apiAvailable || !loaded) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.mediaApp.saveSettings(settings).catch((error) => {
        setMessage(error instanceof Error ? error.message : String(error));
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [apiAvailable, loaded, settings]);

  useEffect(() => {
    if (!apiAvailable || !loaded) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setTmdbStatus(await window.mediaApp.validateTmdbKey(settings.tmdbKey));
    }, 500);

    return () => window.clearTimeout(timer);
  }, [apiAvailable, loaded, settings.tmdbKey]);

  const resultStats = useMemo(
    () => ({
      plex: results.filter((result) => result.status === 'plex').length,
      local: results.filter((result) => result.status === 'local').length,
      missing: results.filter((result) => result.status === 'missing').length,
      duplicates: results.filter((result) => result.duplicates.length > 0).length
    }),
    [results]
  );

  const missingTitles = useMemo(
    () => results.filter((result) => result.status === 'missing').map((result) => result.query.raw),
    [results]
  );

  if (!apiAvailable) {
    return (
      <div className="boot-error">
        <h1>Medien Suche konnte die App-Schnittstelle nicht laden</h1>
        <p>Bitte die App nach dem Build neu starten.</p>
      </div>
    );
  }

  const addSource = async (kind = sourceKind): Promise<void> => {
    const picked = await window.mediaApp.pickDirectory();
    const pickedPaths = picked.paths?.length ? picked.paths : picked.path ? [picked.path] : [];

    if (picked.canceled || pickedPaths.length === 0) {
      return;
    }

    await Promise.all(
      pickedPaths.map((path) => {
        const name = path.split(/[\\/]/).filter(Boolean).at(-1) ?? path;
        return window.mediaApp.addSource({ name, path, kind });
      })
    );

    await refresh();
    setMessage(`${pickedPaths.length} ${sourceKindLabels[kind]}-Suchort(e) hinzugefügt.`);
  };

  const updateSource = async (source: MediaSource, patch: Partial<MediaSource>): Promise<void> => {
    await window.mediaApp.updateSource(source.id, patch);
    await refresh();
  };

  const removeSource = async (id: number): Promise<void> => {
    setSources(await window.mediaApp.removeSource(id));
    setStatus(await window.mediaApp.getIndexStatus());
  };

  const rebuildIndex = async (): Promise<void> => {
    setMessage(null);
    const nextStatus = await window.mediaApp.rebuildIndex();
    setStatus(nextStatus);
    await refresh();
    setMessage(`Aktive Suchorte aktualisiert: ${nextStatus.itemCount.toLocaleString('de-AT')} Einträge.`);
  };

  const rebuildSource = async (source: MediaSource): Promise<void> => {
    setMessage(null);
    await window.mediaApp.rebuildSource(source.id);
    await refresh();
    setMessage(`${source.name} wurde neu indexiert.`);
  };

  const runSearch = async (): Promise<void> => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setMessage(null);
    try {
      setResults(await window.mediaApp.searchMedia({ text: query, useTmdb }));
      setView('results');
    } finally {
      setIsSearching(false);
    }
  };

  const performAction = async (action: FileAction, path: string): Promise<void> => {
    const result = await window.mediaApp.performFileAction(action, path);
    setMessage(result.message);
    setContextMenu(null);
  };

  const exportMissing = async (format: 'txt' | 'csv'): Promise<void> => {
    const result = await window.mediaApp.exportMissing(missingTitles, format);
    setMessage(result.message);
  };

  const saveCollection = (): void => {
    const name = collectionName.trim() || `Sammlung ${settings.collections.length + 1}`;
    const collection: SavedCollection = {
      id: crypto.randomUUID(),
      name,
      text: query,
      createdAt: new Date().toISOString()
    };
    setSettings((current) => ({
      ...current,
      collections: [...current.collections, collection]
    }));
    setCollectionName('');
    setMessage(`${name} gespeichert.`);
  };

  const deleteCollection = (id: string): void => {
    setSettings((current) => ({
      ...current,
      collections: current.collections.filter((collection) => collection.id !== id)
    }));
  };

  const saveManualAlias = (queryText: string, alias: string): void => {
    setSettings((current) => ({
      ...current,
      manualAliases: [
        ...current.manualAliases.filter(
          (entry) =>
            !(entry.query.toLowerCase() === queryText.toLowerCase() && entry.alias.toLowerCase() === alias.toLowerCase())
        ),
        {
          id: crypto.randomUUID(),
          query: queryText,
          alias,
          createdAt: new Date().toISOString()
        }
      ]
    }));
    setMessage(`Korrektur gespeichert: ${queryText} -> ${alias}`);
    setContextMenu(null);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Search size={22} />
          </div>
          <div>
            <h1>Medien Suche</h1>
            <p>Everything für Filme und Serien</p>
          </div>
        </div>

        <nav className="main-nav">
          <button className={view === 'search' ? 'active' : ''} type="button" onClick={() => setView('search')}>
            <Search size={17} />
            Suche
          </button>
          <button className={view === 'results' ? 'active' : ''} type="button" onClick={() => setView('results')}>
            <ListChecks size={17} />
            Ergebnisse
          </button>
          <button className={view === 'settings' ? 'active' : ''} type="button" onClick={() => setView('settings')}>
            <Settings size={17} />
            Einstellungen
          </button>
        </nav>

        <section className="sidebar-section">
          <div className="section-title">
            <Database size={17} />
            <h2>Index</h2>
          </div>
          <div className="metric-grid">
            <div>
              <span>Einträge</span>
              <strong>{status.itemCount.toLocaleString('de-AT')}</strong>
            </div>
            <div>
              <span>Aktiv</span>
              <strong>{sources.filter((source) => source.active).length}</strong>
            </div>
          </div>
          <button className="wide-button" type="button" onClick={rebuildIndex} disabled={status.isIndexing}>
            {status.isIndexing ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
            Alle aktiven Orte neu indexieren
          </button>
          <p className="fine-print">
            {status.isIndexing
              ? status.currentPath ?? 'Index läuft...'
              : status.lastIndexedAt
                ? `Letzter Lauf: ${new Date(status.lastIndexedAt).toLocaleString('de-AT')}`
                : 'Noch nicht indexiert.'}
          </p>
        </section>
      </aside>

      <main className="workspace" onClick={() => setContextMenu(null)}>
        <div className="topbar">
          <div>
            <span className="eyebrow">{viewLabel(view)}</span>
            <h2>{viewTitle(view)}</h2>
          </div>
          {message && <div className="message">{message}</div>}
        </div>

        {view === 'search' && (
          <SearchView
            query={query}
            setQuery={setQuery}
            useTmdb={useTmdb}
            setUseTmdb={setUseTmdb}
            tmdbKey={settings.tmdbKey}
            tmdbStatus={tmdbStatus}
            dragging={dragging}
            setDragging={setDragging}
            isSearching={isSearching}
            runSearch={runSearch}
            handleDrop={async (event) => {
              event.preventDefault();
              setDragging(false);
              const files = [...event.dataTransfer.files];
              if (files.length === 0) {
                return;
              }
              const texts = await Promise.all(files.map((file) => file.text()));
              setQuery((current) => [current.trim(), ...texts.map((text) => text.trim())].filter(Boolean).join('\n'));
              setMessage(files.length === 1 ? `${files[0].name} geladen.` : `${files.length} TXT-Dateien geladen.`);
            }}
            stats={resultStats}
            strictness={settings.matchStrictness}
          />
        )}

        {view === 'results' && (
          <ResultsView
            results={results}
            missingTitles={missingTitles}
            exportMissing={exportMissing}
            performAction={performAction}
            setContextMenu={setContextMenu}
          />
        )}

        {view === 'settings' && (
          <SettingsView
            settingsTab={settingsTab}
            setSettingsTab={setSettingsTab}
            sources={sources}
            sourceKind={sourceKind}
            setSourceKind={setSourceKind}
            settings={settings}
            setSettings={setSettings}
            tmdbStatus={tmdbStatus}
            addSource={addSource}
            updateSource={updateSource}
            removeSource={removeSource}
            rebuildSource={rebuildSource}
            rebuildIndex={rebuildIndex}
            query={query}
            setQuery={setQuery}
            collectionName={collectionName}
            setCollectionName={setCollectionName}
            saveCollection={saveCollection}
            deleteCollection={deleteCollection}
            missingTitles={missingTitles}
            exportMissing={exportMissing}
          />
        )}

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            hit={contextMenu.hit}
            query={contextMenu.query}
            performAction={performAction}
            saveManualAlias={saveManualAlias}
          />
        )}
      </main>
    </div>
  );
}

function SearchView({
  query,
  setQuery,
  useTmdb,
  setUseTmdb,
  tmdbKey,
  tmdbStatus,
  dragging,
  setDragging,
  isSearching,
  runSearch,
  handleDrop,
  stats,
  strictness
}: {
  query: string;
  setQuery: (value: string | ((current: string) => string)) => void;
  useTmdb: boolean;
  setUseTmdb: (value: boolean) => void;
  tmdbKey: string;
  tmdbStatus: TmdbStatus;
  dragging: boolean;
  setDragging: (value: boolean) => void;
  isSearching: boolean;
  runSearch: () => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  stats: { plex: number; local: number; missing: number; duplicates: number };
  strictness: number;
}): JSX.Element {
  return (
    <>
      <section className="tmdb-panel">
        <div>
          <strong>TMDb: {tmdbStatusLabel(tmdbStatus)}</strong>
          <span>Der Key wird automatisch gespeichert. Mit TMDb werden alternative und deutsche Titel genutzt.</span>
        </div>
        <div className="strictness-chip">
          <strong>Strenge {strictness}%</strong>
          <span>{strictnessLabel(strictness)}</span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={useTmdb}
            disabled={!tmdbKey}
            onChange={(event) => setUseTmdb(event.target.checked)}
          />
          <span>TMDb beim Suchen nutzen</span>
        </label>
      </section>

      <section
        className={`search-area ${dragging ? 'dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className="query-panel">
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={'Extraction; Frozen II\nThor 1\nCaptain Amerika The Winter Soldier\nGuardians of the Galaxy Vol.1'}
          />
          <div className="query-actions">
            <div className="drop-hint">
              <Upload size={17} />
              TXT-Dateien hierher ziehen
            </div>
            <button className="search-button" type="button" onClick={runSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="spin" size={18} /> : <Search size={18} />}
              Suchen
            </button>
          </div>
        </div>
      </section>

      <section className="summary-strip">
        <Stat label="Auf Plex" value={stats.plex} tone="good" />
        <Stat label="PC/NAS/USB" value={stats.local} tone="warn" />
        <Stat label="Fehlt" value={stats.missing} tone="bad" />
        <Stat label="Duplikate" value={stats.duplicates} tone="info" />
      </section>
    </>
  );
}

function ResultsView({
  results,
  missingTitles,
  exportMissing,
  performAction,
  setContextMenu
}: {
  results: SearchResult[];
  missingTitles: string[];
  exportMissing: (format: 'txt' | 'csv') => void;
  performAction: (action: FileAction, path: string) => void;
  setContextMenu: (value: { x: number; y: number; hit: MatchHit; query: string } | null) => void;
}): JSX.Element {
  if (results.length === 0) {
    return (
      <div className="empty-state">
        <ShieldCheck size={34} />
        <h3>Noch keine Ergebnisse</h3>
        <p>Suche starten, dann erscheinen hier Treffer, fehlende Titel und Duplikate.</p>
      </div>
    );
  }

  const foundCount = results.filter((result) => result.status !== 'missing').length;
  const totalMatches = results.reduce((sum, result) => sum + result.plexMatches.length + result.localMatches.length, 0);
  const duplicateTitles = results.filter((result) => result.duplicates.length > 0).length;
  const foundTitles = results.filter((result) => result.status !== 'missing').map((result) => result.query.raw);

  return (
    <>
      <section className="result-summary-grid">
        <Stat label="Gefunden" value={foundCount} tone="good" />
        <Stat label="Fehlt" value={missingTitles.length} tone="bad" />
        <Stat label="Treffer" value={totalMatches} tone="info" />
        <Stat label="Duplikate" value={duplicateTitles} tone="warn" />
      </section>

      <section className="result-snapshot">
        <div>
          <strong>Schnellüberblick</strong>
          <span>{foundCount} gefunden, {missingTitles.length} fehlen, {totalMatches} Treffer insgesamt</span>
        </div>
        <div className="snapshot-list">
          <span className="found">Gefunden: {foundTitles.slice(0, 6).join(', ') || '-'}</span>
          <span className="missing">Fehlt: {missingTitles.slice(0, 8).join(', ') || '-'}</span>
        </div>
      </section>

      <section className="result-toolbar">
        <strong>{results.length} geprüfte Titel</strong>
        <span>{foundCount} gefunden</span>
        <span>{missingTitles.length} fehlen</span>
        <button type="button" onClick={() => exportMissing('txt')} disabled={missingTitles.length === 0}>
          <Download size={16} />
          Fehlende TXT
        </button>
        <button type="button" onClick={() => exportMissing('csv')} disabled={missingTitles.length === 0}>
          <Download size={16} />
          Fehlende CSV
        </button>
      </section>

      <section className="everything-table">
        {results.map((result) => (
          <ResultGroup
            key={result.query.raw}
            result={result}
            performAction={performAction}
            setContextMenu={setContextMenu}
          />
        ))}
      </section>
    </>
  );
}

function ResultGroup({
  result,
  performAction,
  setContextMenu
}: {
  result: SearchResult;
  performAction: (action: FileAction, path: string) => void;
  setContextMenu: (value: { x: number; y: number; hit: MatchHit; query: string } | null) => void;
}): JSX.Element {
  const matches = [...result.plexMatches, ...result.localMatches];
  const visibleMatches = matches.slice(0, 10);
  const hiddenMatches = Math.max(0, matches.length - visibleMatches.length);
  const statusIcon =
    result.status === 'plex' ? <CheckCircle2 size={17} /> : result.status === 'local' ? <HardDrive size={17} /> : <XCircle size={17} />;

  return (
    <article className={`result-group ${result.status}`}>
      <header>
        <div>
          <strong>{result.query.raw}</strong>
          <span className="result-subline">
            {result.status === 'missing'
              ? result.missingReason
              : `${matches.length} starke Treffer${result.duplicates.length ? `, ${result.duplicates.length} Duplikate` : ''}`}
          </span>
        </div>
        <div className="status-pill">
          {statusIcon}
          {result.status === 'plex' ? 'Auf Plex' : result.status === 'local' ? 'Gefunden' : 'Fehlt'}
        </div>
      </header>

      {matches.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Pfad</th>
              <th>Größe</th>
              <th>Geändert</th>
              <th>Quelle</th>
              <th>Qualität</th>
              <th>Treffer</th>
            </tr>
          </thead>
          <tbody>
            {visibleMatches.map((hit) => (
              <MatchRow
                key={hit.item.path}
                hit={hit}
                query={result.query.raw}
                performAction={performAction}
                setContextMenu={setContextMenu}
              />
            ))}
            {hiddenMatches > 0 && (
              <tr className="more-row">
                <td colSpan={7}>+ {hiddenMatches} weitere Treffer ausgeblendet, damit die Liste schnell und lesbar bleibt.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {result.status === 'missing' && (
        <div className="diagnostics">
          {result.inactiveMatches.length > 0 && (
            <p>In deaktivierten Quellen gefunden: {result.inactiveMatches.map((hit) => hit.item.name).join(', ')}</p>
          )}
          {result.closestMatches.length > 0 && (
            <p>Ähnliche Dateinamen: {result.closestMatches.map((hit) => hit.item.name).join(', ')}</p>
          )}
          {result.variants.length > 1 && <p>Geprüfte Varianten: {result.variants.slice(0, 8).join(', ')}</p>}
        </div>
      )}
    </article>
  );
}

function MatchRow({
  hit,
  performAction,
  setContextMenu,
  query
}: {
  hit: MatchHit;
  query: string;
  performAction: (action: FileAction, path: string) => void;
  setContextMenu: (value: { x: number; y: number; hit: MatchHit; query: string } | null) => void;
}): JSX.Element {
  return (
    <tr
      className={hit.score >= 0.86 ? 'strong-hit' : hit.score >= 0.72 ? 'medium-hit' : 'weak-hit'}
      onDoubleClick={() => performAction('open', hit.item.path)}
      onContextMenu={(event) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY, hit, query });
      }}
    >
      <td>
        <div className="match-name-cell">
          <strong title={hit.item.name}>{hit.item.name}</strong>
          <span>{hit.item.itemType === 'folder' ? 'Ordner' : hit.item.extension?.replace('.', '').toUpperCase() || 'Datei'}</span>
        </div>
      </td>
      <td title={hit.item.path}>
        <span className="path-cell">{hit.item.path}</span>
      </td>
      <td>{formatBytes(hit.item.size)}</td>
      <td>{new Date(hit.item.mtimeMs).toLocaleString('de-AT')}</td>
      <td>{sourceKindLabels[hit.item.sourceKind]}</td>
      <td>
        <span className="quality-cell">{hit.item.quality.join(', ') || '-'}</span>
      </td>
      <td>
        <span className={`score-pill ${scoreTone(hit.score)}`}>
          {hit.reason} {Math.round(hit.score * 100)}%
        </span>
      </td>
    </tr>
  );
}

function SettingsView(props: {
  settingsTab: SettingsTab;
  setSettingsTab: (tab: SettingsTab) => void;
  sources: MediaSource[];
  sourceKind: SourceKind;
  setSourceKind: (kind: SourceKind) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings | ((current: AppSettings) => AppSettings)) => void;
  tmdbStatus: TmdbStatus;
  addSource: (kind?: SourceKind) => void;
  updateSource: (source: MediaSource, patch: Partial<MediaSource>) => void;
  removeSource: (id: number) => void;
  rebuildSource: (source: MediaSource) => void;
  rebuildIndex: () => void;
  query: string;
  setQuery: (value: string) => void;
  collectionName: string;
  setCollectionName: (value: string) => void;
  saveCollection: () => void;
  deleteCollection: (id: string) => void;
  missingTitles: string[];
  exportMissing: (format: 'txt' | 'csv') => void;
}): JSX.Element {
  return (
    <>
      <div className="settings-tabs">
        {(['sources', 'search', 'tmdb', 'index', 'extras'] as SettingsTab[]).map((tab) => (
          <button
            key={tab}
            className={props.settingsTab === tab ? 'active' : ''}
            type="button"
            onClick={() => props.setSettingsTab(tab)}
          >
            {settingsTabLabel(tab)}
          </button>
        ))}
      </div>

      {props.settingsTab === 'sources' && <SourceSettings {...props} />}
      {props.settingsTab === 'search' && <SearchSettings {...props} />}
      {props.settingsTab === 'tmdb' && <TmdbSettings {...props} />}
      {props.settingsTab === 'index' && <IndexSettings {...props} />}
      {props.settingsTab === 'extras' && <ExtrasSettings {...props} />}
    </>
  );
}

function SearchSettings({ settings, setSettings }: Parameters<typeof SettingsView>[0]): JSX.Element {
  return (
    <section className="settings-panel narrow">
      <div className="strictness-panel">
        <div>
          <strong>Treffer-Strenge</strong>
          <span>{strictnessLabel(settings.matchStrictness)}</span>
        </div>
        <div className="strictness-value">{settings.matchStrictness}%</div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={settings.matchStrictness}
          onChange={(event) => setSettings((current) => ({ ...current, matchStrictness: Number(event.target.value) }))}
        />
        <div className="range-labels">
          <span>Locker</span>
          <span>Ausgewogen</span>
          <span>Sehr streng</span>
        </div>
      </div>
      <div className="export-box">
        <strong>Empfehlung</strong>
        <span>Für deine Marvel-Listen ist 85-95 gut. Wenn echte Treffer fehlen, kurz auf 70-80 runterstellen und erneut suchen.</span>
      </div>
    </section>
  );
}

function SourceSettings({
  sources,
  sourceKind,
  setSourceKind,
  addSource,
  updateSource,
  removeSource,
  rebuildSource
}: Parameters<typeof SettingsView>[0]): JSX.Element {
  return (
    <section className="settings-panel">
      <div className="source-add-row">
        <select value={sourceKind} onChange={(event) => setSourceKind(event.target.value as SourceKind)}>
          {Object.entries(sourceKindLabels).map(([kind, label]) => (
            <option value={kind} key={kind}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => addSource(sourceKind)}>
          <FolderPlus size={17} />
          Ordner/Platten wählen
        </button>
      </div>

      {(['plex', 'pc', 'usb', 'other'] as SourceKind[]).map((kind) => (
        <div className="source-profile" key={kind}>
          <h3>
            {sourceKindIcons[kind]}
            {sourceKindLabels[kind]}
          </h3>
          {sources.filter((source) => source.kind === kind).map((source) => (
            <div className="source-card" key={source.id}>
              <div className="source-main">
                <strong>{source.name}</strong>
                <span>{source.path}</span>
                <small>
                  {source.reachable ? 'Erreichbar' : 'Nicht erreichbar'} · {source.itemCount.toLocaleString('de-AT')} Medien ·{' '}
                  {source.lastIndexedAt ? new Date(source.lastIndexedAt).toLocaleString('de-AT') : 'nie indexiert'}
                </small>
                {source.lastError && <small className="error-text">{source.lastError}</small>}
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={source.active}
                  onChange={(event) => updateSource(source, { active: event.target.checked })}
                />
                Aktiv
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={source.liveWatch}
                  onChange={(event) => updateSource(source, { liveWatch: event.target.checked })}
                />
                Live
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={source.quickScanOnStart}
                  onChange={(event) => updateSource(source, { quickScanOnStart: event.target.checked })}
                />
                Startscan
              </label>
              <button type="button" onClick={() => rebuildSource(source)} title="Diesen Ort neu indexieren">
                <RefreshCw size={16} />
              </button>
              <button type="button" onClick={() => removeSource(source.id)} title="Suchort entfernen">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

function TmdbSettings({ settings, setSettings, tmdbStatus }: Parameters<typeof SettingsView>[0]): JSX.Element {
  return (
    <section className="settings-panel narrow">
      <label className="field">
        <span>TMDb API Key oder Read Access Token</span>
        <input
          value={settings.tmdbKey}
          onChange={(event) => {
            const next = { ...settings, tmdbKey: event.target.value };
            setSettings(next);
            void window.mediaApp.saveSettings(next);
          }}
          placeholder="Key hier einfügen - wird automatisch gespeichert"
          type="password"
        />
      </label>
      <div className={`tmdb-status ${tmdbStatus}`}>
        <strong>{tmdbStatusLabel(tmdbStatus)}</strong>
        <span>Der Key wird automatisch lokal in der App-Datenbank gespeichert.</span>
      </div>
      <a className="help-link dark" href="https://developer.themoviedb.org/docs/getting-started" target="_blank">
        <ExternalLink size={15} />
        TMDb-Key kostenlos holen
      </a>
    </section>
  );
}

function IndexSettings({ sources, rebuildIndex }: Parameters<typeof SettingsView>[0]): JSX.Element {
  return (
    <section className="settings-panel">
      <button className="search-button" type="button" onClick={rebuildIndex}>
        <RefreshCw size={18} />
        Alle aktiven Orte neu indexieren
      </button>
      <div className="health-grid">
        {sources.map((source) => (
          <div className="health-card" key={source.id}>
            <strong>{source.name}</strong>
            <span>{source.active ? 'Aktiv' : 'Deaktiviert'} · {source.reachable ? 'Erreichbar' : 'Nicht erreichbar'}</span>
            <span>{source.liveWatch ? 'Live-Überwachung an' : 'Live-Überwachung aus'}</span>
            <span>{source.quickScanOnStart ? 'Schnellscan beim Start an' : 'Schnellscan beim Start aus'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExtrasSettings({
  settings,
  setSettings,
  query,
  setQuery,
  collectionName,
  setCollectionName,
  saveCollection,
  deleteCollection,
  missingTitles,
  exportMissing
}: Parameters<typeof SettingsView>[0]): JSX.Element {
  const collections = [...presetCollections, ...settings.collections];

  return (
    <section className="settings-panel">
      <div className="collection-save">
        <input
          value={collectionName}
          onChange={(event) => setCollectionName(event.target.value)}
          placeholder="Sammlungsname, z.B. Marvel Phase 1"
        />
        <button type="button" onClick={saveCollection} disabled={!query.trim()}>
          Sammlung speichern
        </button>
      </div>
      <div className="collection-grid">
        {collections.map((collection) => (
          <div className="collection-card" key={collection.id}>
            <strong>{collection.name}</strong>
            <span>{collection.text.split(/\r?\n/).filter(Boolean).length} Titel</span>
            <button type="button" onClick={() => setQuery(collection.text)}>
              Laden
            </button>
            {!collection.id.startsWith('preset-') && (
              <button type="button" onClick={() => deleteCollection(collection.id)}>
                Löschen
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="export-box">
        <strong>Fehlende Titel exportieren</strong>
        <span>{missingTitles.length} Titel aktuell als fehlend markiert.</span>
        <button type="button" onClick={() => exportMissing('txt')} disabled={missingTitles.length === 0}>
          TXT exportieren
        </button>
        <button type="button" onClick={() => exportMissing('csv')} disabled={missingTitles.length === 0}>
          CSV exportieren
        </button>
      </div>
      <div className="export-box">
        <strong>Manuelle Korrekturen</strong>
        <span>{settings.manualAliases.length} gespeicherte Titel-Zuordnungen.</span>
        {settings.manualAliases.slice(0, 8).map((alias) => (
          <small key={alias.id}>
            {alias.query} {'->'} {alias.alias}
          </small>
        ))}
        <button
          type="button"
          onClick={() => setSettings((current) => ({ ...current, manualAliases: [] }))}
          disabled={settings.manualAliases.length === 0}
        >
          Korrekturen löschen
        </button>
      </div>
      <button
        type="button"
        onClick={() => setSettings((current) => ({ ...current, collections: [] }))}
        disabled={settings.collections.length === 0}
      >
        Eigene Sammlungen löschen
      </button>
    </section>
  );
}

function ContextMenu({
  x,
  y,
  hit,
  query,
  performAction,
  saveManualAlias
}: {
  x: number;
  y: number;
  hit: MatchHit;
  query: string;
  performAction: (action: FileAction, path: string) => void;
  saveManualAlias: (query: string, alias: string) => void;
}): JSX.Element {
  const actions: Array<[FileAction, string, JSX.Element]> = [
    ['open', 'Öffnen', <ExternalLink size={15} />],
    ['open-folder', 'Pfad öffnen', <FolderOpen size={15} />],
    ['copy-name-path', 'Pfad mit Namen kopieren', <Copy size={15} />],
    ['copy-full-path', 'Als Pfad kopieren', <Copy size={15} />],
    ['show-in-folder', 'Im Explorer markieren', <FolderOpen size={15} />]
  ];

  return (
    <div className="context-menu" style={{ left: x, top: y }} onClick={(event) => event.stopPropagation()}>
      {actions.map(([action, label, icon]) => (
        <button key={action} type="button" onClick={() => performAction(action, hit.item.path)}>
          {icon}
          {label}
        </button>
      ))}
      <button type="button" onClick={() => saveManualAlias(query, hit.item.title)}>
        <CheckCircle2 size={15} />
        Als Korrektur speichern
      </button>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }): JSX.Element {
  return (
    <div className={`stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function viewLabel(view: View): string {
  return view === 'search' ? 'Suche' : view === 'results' ? 'Ergebnisse' : 'Einstellungen';
}

function viewTitle(view: View): string {
  return view === 'search'
    ? 'Filme und Serien prüfen'
    : view === 'results'
      ? 'Everything-ähnliche Trefferliste'
      : 'Suchorte, TMDb und Extras';
}

function settingsTabLabel(tab: SettingsTab): string {
  return tab === 'sources'
    ? 'Suchorte'
    : tab === 'search'
      ? 'Suche'
      : tab === 'tmdb'
        ? 'TMDb'
        : tab === 'index'
          ? 'Index'
          : 'Extras';
}

function tmdbStatusLabel(status: TmdbStatus): string {
  return status === 'active'
    ? 'TMDb aktiv'
    : status === 'invalid'
      ? 'Key ungültig'
      : status === 'offline'
        ? 'TMDb offline'
        : 'Key fehlt';
}

function formatBytes(value: number): string {
  if (!value) {
    return '-';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${size.toLocaleString('de-AT', { maximumFractionDigits: unit === 0 ? 0 : 1 })} ${units[unit]}`;
}

function scoreTone(score: number): string {
  if (score >= 0.86) {
    return 'good';
  }

  if (score >= 0.72) {
    return 'warn';
  }

  return 'muted';
}

function strictnessLabel(value: number): string {
  if (value >= 85) {
    return 'Sehr streng: nur klare Titel-Treffer';
  }

  if (value >= 60) {
    return 'Ausgewogen: gute Titel plus wenige Fuzzy-Treffer';
  }

  return 'Locker: mehr Treffer, aber mehr falsche Treffer möglich';
}
