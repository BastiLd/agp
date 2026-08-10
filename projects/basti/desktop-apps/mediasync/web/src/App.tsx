import {
  ArrowRight,
  CheckCircle2,
  Database,
  Edit3,
  Eye,
  EyeOff,
  FolderInput,
  FolderPlus,
  FolderTree,
  HardDrive,
  ListChecks,
  Loader2,
  Lock,
  LogOut,
  Monitor,
  Play,
  Plug,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Usb,
  Wand2,
  XCircle
} from 'lucide-react';
import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from './api';
import { FileBrowser } from './panels/FileBrowser';
import { Library } from './panels/Library';
import { MetadataSearch } from './panels/MetadataSearch';
import type {
  AppSettings,
  AuthState,
  BrowseResult,
  DiskTarget,
  IndexStatus,
  MatchHit,
  MediaSource,
  PlexStatus,
  RenamePreviewItem,
  ScanProgress,
  SearchResult,
  SourceKind
} from './shared/types';

type View = 'search' | 'results' | 'library' | 'rename' | 'move' | 'settings';
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
  manualAliases: [],
  plexUrl: '',
  plexToken: '',
  moviesRoot: '',
  seriesRoot: ''
};

export function App(): JSX.Element {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [view, setView] = useState<View>('search');
  const [sources, setSources] = useState<MediaSource[]>([]);
  const [status, setStatus] = useState<IndexStatus>(initialStatus);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [useTmdb, setUseTmdb] = useState(false);
  const [tmdbStatus, setTmdbStatus] = useState<TmdbStatus>('missing');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renamePaths, setRenamePaths] = useState<string[]>([]);
  const [renameToken, setRenameToken] = useState(0);
  const [movePaths, setMovePaths] = useState<string[]>([]);
  const [moveToken, setMoveToken] = useState(0);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      setAuth({ authenticated: false, required: true });
      return;
    }
    setMessage(error instanceof Error ? error.message : String(error));
  }, []);

  const refresh = useCallback(async () => {
    const [loadedSources, loadedStatus, loadedSettings] = await Promise.all([
      api.listSources(),
      api.getIndexStatus(),
      api.getSettings()
    ]);
    setSources(loadedSources);
    setStatus(loadedStatus);
    setSettings({ ...initialSettings, ...loadedSettings });
    setUseTmdb(Boolean(loadedSettings.tmdbKey));
    setLoaded(true);
  }, []);

  // Initial auth check.
  useEffect(() => {
    api.authState().then(setAuth).catch(() => setAuth({ authenticated: false, required: true }));
  }, []);

  // Load data + subscribe to index progress once authenticated.
  useEffect(() => {
    if (!auth?.authenticated) {
      return;
    }
    refresh().catch(handleError);
    return api.onIndexProgress((progress: ScanProgress) => {
      setStatus((current) => ({ ...current, ...progress }));
    });
  }, [auth?.authenticated, refresh, handleError]);

  // Debounced settings save.
  useEffect(() => {
    if (!auth?.authenticated || !loaded) {
      return;
    }
    const timer = window.setTimeout(() => {
      api.saveSettings(settings).catch(handleError);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [auth?.authenticated, loaded, settings, handleError]);

  // Validate TMDb key when it changes.
  useEffect(() => {
    if (!auth?.authenticated || !loaded) {
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        setTmdbStatus(await api.validateTmdbKey(settings.tmdbKey));
      } catch (error) {
        handleError(error);
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [auth?.authenticated, loaded, settings.tmdbKey, handleError]);

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

  if (!auth) {
    return (
      <div className="boot-error">
        <Loader2 className="spin" size={28} />
        <p>MediaSync wird geladen…</p>
      </div>
    );
  }

  if (auth.required && !auth.authenticated) {
    return <LoginView onSuccess={() => setAuth({ authenticated: true, required: true })} />;
  }

  const toggleSelected = (path: string): void => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const runSearch = async (): Promise<void> => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    setMessage(null);
    try {
      setResults(await api.searchMedia({ text: query, useTmdb }));
      setView('results');
    } catch (error) {
      handleError(error);
    } finally {
      setIsSearching(false);
    }
  };

  const addSourcePath = async (path: string, kind: SourceKind): Promise<void> => {
    try {
      const name = path.split(/[\\/]/).filter(Boolean).at(-1) ?? path;
      await api.addSource({ name, path, kind });
      await refresh();
      setMessage(`${sourceKindLabels[kind]}-Quelle hinzugefügt: ${path}`);
    } catch (error) {
      handleError(error);
    }
  };

  const updateSource = async (source: MediaSource, patch: Partial<MediaSource>): Promise<void> => {
    try {
      await api.updateSource(source.id, patch);
      await refresh();
    } catch (error) {
      handleError(error);
    }
  };

  const removeSource = async (id: number): Promise<void> => {
    try {
      setSources(await api.removeSource(id));
      setStatus(await api.getIndexStatus());
    } catch (error) {
      handleError(error);
    }
  };

  const rebuildIndex = async (): Promise<void> => {
    setMessage(null);
    try {
      const next = await api.rebuildIndex();
      setStatus(next);
      await refresh();
      setMessage(`Index aktualisiert: ${next.itemCount.toLocaleString('de-AT')} Einträge.`);
    } catch (error) {
      handleError(error);
    }
  };

  const rebuildSource = async (source: MediaSource): Promise<void> => {
    try {
      await api.rebuildSource(source.id);
      await refresh();
      setMessage(`${source.name} neu indexiert.`);
    } catch (error) {
      handleError(error);
    }
  };

  const logout = async (): Promise<void> => {
    await api.logout().catch(() => undefined);
    setAuth({ authenticated: false, required: true });
  };

  const selectedPaths = [...selected];

  const goRename = (paths: string[]): void => {
    setRenamePaths(paths);
    setRenameToken((token) => token + 1);
    setView('rename');
  };

  const goMove = (paths: string[]): void => {
    setMovePaths(paths);
    setMoveToken((token) => token + 1);
    setView('move');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <FolderTree size={22} />
          </div>
          <div>
            <h1>MediaSync</h1>
            <p>Vergleichen · Umbenennen · Verschieben</p>
          </div>
        </div>

        <nav className="main-nav">
          <button className={view === 'search' ? 'active' : ''} type="button" onClick={() => setView('search')}>
            <Search size={17} /> Suche
          </button>
          <button className={view === 'results' ? 'active' : ''} type="button" onClick={() => setView('results')}>
            <ListChecks size={17} /> Ergebnisse
          </button>
          <button className={view === 'library' ? 'active' : ''} type="button" onClick={() => setView('library')}>
            <Database size={17} /> Bibliothek
          </button>
          <button className={view === 'rename' ? 'active' : ''} type="button" onClick={() => setView('rename')}>
            <Edit3 size={17} /> Umbenennen
          </button>
          <button className={view === 'move' ? 'active' : ''} type="button" onClick={() => setView('move')}>
            <FolderInput size={17} /> Verschieben
          </button>
          <button className={view === 'settings' ? 'active' : ''} type="button" onClick={() => setView('settings')}>
            <Settings size={17} /> Einstellungen
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
            Alle aktiven Quellen indexieren
          </button>
          <p className="fine-print">
            {status.isIndexing
              ? status.currentPath ?? 'Index läuft…'
              : status.lastIndexedAt
                ? `Letzter Lauf: ${new Date(status.lastIndexedAt).toLocaleString('de-AT')}`
                : 'Noch nicht indexiert.'}
          </p>
        </section>

        {selectedPaths.length > 0 && (
          <section className="sidebar-section selection-box">
            <strong>{selectedPaths.length} ausgewählt</strong>
            <button type="button" onClick={() => goRename(selectedPaths)}>
              <Edit3 size={15} /> Umbenennen
            </button>
            <button type="button" onClick={() => goMove(selectedPaths)}>
              <FolderInput size={15} /> Verschieben
            </button>
            <button type="button" onClick={() => setSelected(new Set())}>
              Auswahl leeren
            </button>
          </section>
        )}

        {auth.required && (
          <button className="logout-button" type="button" onClick={logout}>
            <LogOut size={16} /> Abmelden
          </button>
        )}
      </aside>

      <main className="workspace">
        <div className="topbar">
          <div>
            <span className="eyebrow">{viewTitle(view)}</span>
            <h2>{viewSubtitle(view)}</h2>
          </div>
          {message && (
            <div className="message" onClick={() => setMessage(null)}>
              {message}
            </div>
          )}
        </div>

        {view === 'search' && (
          <SearchView
            query={query}
            setQuery={setQuery}
            useTmdb={useTmdb}
            setUseTmdb={setUseTmdb}
            tmdbKey={settings.tmdbKey}
            tmdbStatus={tmdbStatus}
            isSearching={isSearching}
            runSearch={runSearch}
            stats={resultStats}
            strictness={settings.matchStrictness}
          />
        )}

        {view === 'results' && (
          <ResultsView
            results={results}
            missingTitles={missingTitles}
            selected={selected}
            toggleSelected={toggleSelected}
          />
        )}

        {view === 'library' && <Library onError={handleError} onToRename={goRename} onToMove={goMove} />}

        {view === 'rename' && (
          <RenameView
            key={renameToken}
            initialPaths={renamePaths}
            settings={settings}
            onMessage={setMessage}
            onError={handleError}
          />
        )}

        {view === 'move' && (
          <MoveView key={moveToken} initialPaths={movePaths} onMessage={setMessage} onError={handleError} />
        )}

        {view === 'settings' && (
          <SettingsView
            sources={sources}
            settings={settings}
            setSettings={setSettings}
            tmdbStatus={tmdbStatus}
            addSourcePath={addSourcePath}
            updateSource={updateSource}
            removeSource={removeSource}
            rebuildSource={rebuildSource}
            rebuildIndex={rebuildIndex}
            onTmdbStatus={setTmdbStatus}
            onMessage={setMessage}
            onError={handleError}
          />
        )}
      </main>
    </div>
  );
}

function LoginView({ onSuccess }: { onSuccess: () => void }): JSX.Element {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const state = await api.login(password);
      if (state.authenticated) {
        onSuccess();
      } else {
        setError('Falsches Passwort.');
      }
    } catch {
      setError('Falsches Passwort.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark large">
          <Lock size={26} />
        </div>
        <h1>MediaSync</h1>
        <p>Bitte mit deinem Passwort anmelden.</p>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Passwort"
          autoFocus
        />
        {error && <span className="login-error">{error}</span>}
        <button type="submit" disabled={busy}>
          {busy ? <Loader2 className="spin" size={18} /> : <Lock size={18} />} Anmelden
        </button>
      </form>
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
  isSearching,
  runSearch,
  stats,
  strictness
}: {
  query: string;
  setQuery: (value: string) => void;
  useTmdb: boolean;
  setUseTmdb: (value: boolean) => void;
  tmdbKey: string;
  tmdbStatus: TmdbStatus;
  isSearching: boolean;
  runSearch: () => void;
  stats: { plex: number; local: number; missing: number; duplicates: number };
  strictness: number;
}): JSX.Element {
  return (
    <>
      <section className="tmdb-panel">
        <div>
          <strong>TMDb: {tmdbStatusLabel(tmdbStatus)}</strong>
          <span>Mit TMDb werden alternative und deutsche Titel beim Vergleich genutzt.</span>
        </div>
        <div className="strictness-chip">
          <strong>Strenge {strictness}%</strong>
          <span>{strictnessLabel(strictness)}</span>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={useTmdb} disabled={!tmdbKey} onChange={(event) => setUseTmdb(event.target.checked)} />
          <span>TMDb beim Suchen nutzen</span>
        </label>
      </section>

      <section className="search-area">
        <div className="query-panel">
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={'Extraction; Frozen II\nThor 1\nBreaking Bad S01E01'}
          />
          <div className="query-actions">
            <span className="drop-hint">Titel mit Semikolon oder Zeilenumbruch trennen</span>
            <button className="search-button" type="button" onClick={runSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="spin" size={18} /> : <Search size={18} />} Suchen
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
  selected,
  toggleSelected
}: {
  results: SearchResult[];
  missingTitles: string[];
  selected: Set<string>;
  toggleSelected: (path: string) => void;
}): JSX.Element {
  if (results.length === 0) {
    return (
      <div className="empty-state">
        <ShieldCheck size={34} />
        <h3>Noch keine Ergebnisse</h3>
        <p>Starte eine Suche – Treffer, fehlende Titel und Duplikate erscheinen hier.</p>
      </div>
    );
  }

  const foundCount = results.filter((result) => result.status !== 'missing').length;
  const totalMatches = results.reduce((sum, result) => sum + result.plexMatches.length + result.localMatches.length, 0);

  return (
    <>
      <section className="result-summary-grid">
        <Stat label="Gefunden" value={foundCount} tone="good" />
        <Stat label="Fehlt" value={missingTitles.length} tone="bad" />
        <Stat label="Treffer" value={totalMatches} tone="info" />
        <Stat label="Geprüft" value={results.length} tone="warn" />
      </section>

      <section className="everything-table">
        {results.map((result) => (
          <ResultGroup key={result.query.raw} result={result} selected={selected} toggleSelected={toggleSelected} />
        ))}
      </section>
    </>
  );
}

function ResultGroup({
  result,
  selected,
  toggleSelected
}: {
  result: SearchResult;
  selected: Set<string>;
  toggleSelected: (path: string) => void;
}): JSX.Element {
  const matches = [...result.plexMatches, ...result.localMatches].slice(0, 12);
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
              : `${matches.length} Treffer${result.duplicates.length ? `, ${result.duplicates.length} Duplikate` : ''}`}
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
              <th />
              <th>Name</th>
              <th>Pfad</th>
              <th>Größe</th>
              <th>Quelle</th>
              <th>Qualität</th>
              <th>Treffer</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((hit) => (
              <MatchRow key={hit.item.path} hit={hit} selected={selected.has(hit.item.path)} toggleSelected={toggleSelected} />
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}

function MatchRow({
  hit,
  selected,
  toggleSelected
}: {
  hit: MatchHit;
  selected: boolean;
  toggleSelected: (path: string) => void;
}): JSX.Element {
  const selectable = !hit.item.path.startsWith('plex://') && hit.item.path !== 'plex-api://library';
  return (
    <tr className={hit.score >= 0.86 ? 'strong-hit' : hit.score >= 0.72 ? 'medium-hit' : 'weak-hit'}>
      <td>
        {selectable && (
          <input type="checkbox" checked={selected} onChange={() => toggleSelected(hit.item.path)} title="Für Umbenennen/Verschieben auswählen" />
        )}
      </td>
      <td>
        <div className="match-name-cell">
          <strong title={hit.item.name}>{hit.item.name}</strong>
          <span>{hit.item.itemType === 'folder' ? 'Ordner' : hit.item.extension?.replace('.', '').toUpperCase() || 'Datei'}</span>
        </div>
      </td>
      <td title={hit.item.path}>
        <span className="path-cell" onClick={() => navigator.clipboard?.writeText(hit.item.path)}>
          {hit.item.path}
        </span>
      </td>
      <td>{formatBytes(hit.item.size)}</td>
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

function RenameView({
  initialPaths,
  settings,
  onMessage,
  onError
}: {
  initialPaths: string[];
  settings: AppSettings;
  onMessage: (value: string) => void;
  onError: (error: unknown) => void;
}): JSX.Element {
  const [pathsText, setPathsText] = useState(initialPaths.join('\n'));
  const [structureMode, setStructureMode] = useState<'plex' | 'none'>('plex');
  const [refreshPlex, setRefreshPlex] = useState(false);
  const [items, setItems] = useState<RenamePreviewItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [searchItem, setSearchItem] = useState<RenamePreviewItem | null>(null);

  const paths = pathsText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const replaceItem = (updated: RenamePreviewItem): void => {
    setItems((current) => current.map((item) => (item.source === updated.source ? updated : item)));
    setSearchItem(null);
    onMessage(`Übernommen: ${updated.label}`);
  };

  const preview = async (): Promise<void> => {
    setBusy(true);
    try {
      setItems(
        await api.renamePreview({
          paths,
          structureMode,
          moviesRoot: settings.moviesRoot || undefined,
          seriesRoot: settings.seriesRoot || undefined
        })
      );
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  const apply = async (): Promise<void> => {
    const toRename = items.filter((item) => item.changed && !item.error);
    if (toRename.length === 0) {
      onMessage('Keine umbenennbaren Dateien in der Vorschau.');
      return;
    }
    setBusy(true);
    try {
      const result = await api.renameApply({
        items: toRename.map((item) => ({ source: item.source, target: item.target })),
        refreshPlex
      });
      onMessage(result.message);
      setItems([]);
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="action-panel">
      <div className="action-config">
        <label className="field">
          <span>Pfade (eine Datei/ein Ordner pro Zeile)</span>
          <textarea value={pathsText} onChange={(event) => setPathsText(event.target.value)} placeholder="/media/movies/Avatar.2009.1080p.mkv" rows={5} />
        </label>
        <div className="action-options">
          <button type="button" onClick={() => setBrowserOpen(true)}>
            <FolderTree size={16} /> Dateien wählen
          </button>
          <label className="toggle">
            <input type="checkbox" checked={structureMode === 'plex'} onChange={(event) => setStructureMode(event.target.checked ? 'plex' : 'none')} />
            <span>Plex-/Jellyfin-Ordnerstruktur (Filmname (Jahr)/…, Season 01/…)</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={refreshPlex} onChange={(event) => setRefreshPlex(event.target.checked)} />
            <span>Danach Plex-Refresh auslösen</span>
          </label>
          <button type="button" onClick={preview} disabled={busy || paths.length === 0}>
            {busy ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />} Vorschau
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="preview-table">
          <table>
            <thead>
              <tr>
                <th>Aktuell</th>
                <th />
                <th>Neu (Plex / Jellyfin)</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.source} className={item.error ? 'weak-hit' : item.changed ? 'strong-hit' : ''}>
                  <td title={item.source}>{basename(item.source)}</td>
                  <td><ArrowRight size={14} /></td>
                  <td title={item.target}>{relativeTarget(item.source, item.target)}</td>
                  <td>
                    {item.error ? (
                      <span className="score-pill warn">{item.error}</span>
                    ) : item.collision ? (
                      <span className="score-pill warn">Zielname existierte – nummeriert</span>
                    ) : item.changed ? (
                      <span className="score-pill good">Bereit · Plex ✓ Jellyfin ✓</span>
                    ) : (
                      <span className="score-pill muted">Unverändert</span>
                    )}
                  </td>
                  <td>
                    <button type="button" className="link-button" onClick={() => setSearchItem(item)}>
                      <Search size={14} /> Online suchen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="action-bar">
            <span>{items.filter((item) => item.changed && !item.error).length} werden umbenannt</span>
            <button className="search-button" type="button" onClick={apply} disabled={busy}>
              {busy ? <Loader2 className="spin" size={18} /> : <Edit3 size={18} />} Jetzt umbenennen
            </button>
          </div>
        </div>
      )}

      {browserOpen && (
        <FileBrowser
          title="Dateien/Ordner zum Umbenennen wählen"
          onError={onError}
          onClose={() => setBrowserOpen(false)}
          onConfirm={(picked) => {
            setPathsText((current) => [current.trim(), ...picked].filter(Boolean).join('\n'));
            setBrowserOpen(false);
          }}
        />
      )}

      {searchItem && (
        <MetadataSearch
          source={searchItem.source}
          initialQuery={searchItem.label}
          initialType={searchItem.mediaType === 'series' ? 'tv' : searchItem.mediaType === 'movie' ? 'movie' : 'auto'}
          structureMode={structureMode}
          moviesRoot={settings.moviesRoot || undefined}
          seriesRoot={settings.seriesRoot || undefined}
          onApply={replaceItem}
          onClose={() => setSearchItem(null)}
          onError={onError}
        />
      )}
    </section>
  );
}

function MoveView({
  initialPaths,
  onMessage,
  onError
}: {
  initialPaths: string[];
  onMessage: (value: string) => void;
  onError: (error: unknown) => void;
}): JSX.Element {
  const [pathsText, setPathsText] = useState(initialPaths.join('\n'));
  const [disks, setDisks] = useState<DiskTarget[]>([]);
  const [targetDir, setTargetDir] = useState('');
  const [mode, setMode] = useState<'move' | 'copy'>('move');
  const [refreshPlex, setRefreshPlex] = useState(false);
  const [busy, setBusy] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);

  const paths = pathsText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  useEffect(() => {
    api.listDisks().then(setDisks).catch(onError);
  }, [onError]);

  const run = async (): Promise<void> => {
    if (!targetDir) {
      onMessage('Bitte ein Ziel wählen.');
      return;
    }
    setBusy(true);
    try {
      const result = await api.move({ paths, targetDir, mode, verify: true, refreshPlex });
      onMessage(result.message);
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="action-panel">
      <div className="action-config">
        <label className="field">
          <span>Pfade (eine Datei/ein Ordner pro Zeile)</span>
          <textarea value={pathsText} onChange={(event) => setPathsText(event.target.value)} rows={5} placeholder="/media/movies/Avatar (2009)" />
        </label>
        <button type="button" onClick={() => setBrowserOpen(true)}>
          <FolderTree size={16} /> Dateien wählen
        </button>

        <label className="field">
          <span>Ziel-Platte / Ordner</span>
          <select value={targetDir} onChange={(event) => setTargetDir(event.target.value)}>
            <option value="">– Ziel wählen –</option>
            {disks.map((disk) => (
              <option key={disk.path} value={disk.path} disabled={!disk.writable}>
                {disk.label} ({formatBytes(disk.free)} frei{disk.writable ? '' : ', schreibgeschützt'})
              </option>
            ))}
          </select>
        </label>

        <div className="action-options">
          <div className="mode-switch">
            <label className={mode === 'move' ? 'active' : ''}>
              <input type="radio" name="mode" checked={mode === 'move'} onChange={() => setMode('move')} />
              Verschieben (Original löschen)
            </label>
            <label className={mode === 'copy' ? 'active' : ''}>
              <input type="radio" name="mode" checked={mode === 'copy'} onChange={() => setMode('copy')} />
              Kopieren (Original behalten)
            </label>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={refreshPlex} onChange={(event) => setRefreshPlex(event.target.checked)} />
            <span>Danach Plex-Refresh auslösen</span>
          </label>
          <button className="search-button" type="button" onClick={run} disabled={busy || paths.length === 0}>
            {busy ? <Loader2 className="spin" size={18} /> : <FolderInput size={18} />} {mode === 'move' ? 'Verschieben' : 'Kopieren'} starten
          </button>
        </div>
      </div>

      {browserOpen && (
        <FileBrowser
          title="Dateien/Ordner zum Verschieben wählen"
          onError={onError}
          onClose={() => setBrowserOpen(false)}
          onConfirm={(picked) => {
            setPathsText((current) => [current.trim(), ...picked].filter(Boolean).join('\n'));
            setBrowserOpen(false);
          }}
        />
      )}
    </section>
  );
}

function SettingsView({
  sources,
  settings,
  setSettings,
  tmdbStatus,
  addSourcePath,
  updateSource,
  removeSource,
  rebuildSource,
  rebuildIndex,
  onTmdbStatus,
  onMessage,
  onError
}: {
  sources: MediaSource[];
  settings: AppSettings;
  setSettings: (updater: AppSettings | ((current: AppSettings) => AppSettings)) => void;
  tmdbStatus: TmdbStatus;
  addSourcePath: (path: string, kind: SourceKind) => void;
  updateSource: (source: MediaSource, patch: Partial<MediaSource>) => void;
  removeSource: (id: number) => void;
  rebuildSource: (source: MediaSource) => void;
  rebuildIndex: () => void;
  onTmdbStatus: (status: TmdbStatus) => void;
  onMessage: (value: string) => void;
  onError: (error: unknown) => void;
}): JSX.Element {
  const [kind, setKind] = useState<SourceKind>('pc');
  const [browser, setBrowser] = useState<BrowseResult | null>(null);
  const [plex, setPlex] = useState<PlexStatus | null>(null);
  const [showTmdb, setShowTmdb] = useState(false);
  const [showPlexToken, setShowPlexToken] = useState(false);
  const [testingTmdb, setTestingTmdb] = useState(false);

  const openBrowser = async (path?: string): Promise<void> => {
    try {
      setBrowser(await api.browse(path));
    } catch (error) {
      onError(error);
    }
  };

  const testPlex = async (): Promise<void> => {
    try {
      setPlex(await api.plexLibraries());
    } catch (error) {
      onError(error);
    }
  };

  const testTmdb = async (): Promise<void> => {
    setTestingTmdb(true);
    try {
      const status = await api.tmdbTest();
      onTmdbStatus(status);
      onMessage(`TMDb: ${tmdbStatusLabel(status)}`);
    } catch (error) {
      onError(error);
    } finally {
      setTestingTmdb(false);
    }
  };

  return (
    <section className="settings-grid">
      <div className="settings-panel">
        <h3><FolderTree size={17} /> Medien-Quellen</h3>
        <div className="source-add-row">
          <select value={kind} onChange={(event) => setKind(event.target.value as SourceKind)}>
            {(['pc', 'usb', 'plex', 'other'] as SourceKind[]).map((value) => (
              <option key={value} value={value}>{sourceKindLabels[value]}</option>
            ))}
          </select>
          <button type="button" onClick={() => openBrowser()}>
            <FolderPlus size={16} /> Ordner durchsuchen
          </button>
        </div>

        {sources.filter((source) => source.path !== 'plex-api://library').map((source) => (
          <div className="source-card" key={source.id}>
            <div className="source-main">
              <strong>{sourceKindIcons[source.kind]} {source.name}</strong>
              <span>{source.path}</span>
              <small>
                {source.reachable ? 'Erreichbar' : 'Nicht erreichbar'} · {source.itemCount.toLocaleString('de-AT')} Medien
                {source.lastError ? ` · ${source.lastError}` : ''}
              </small>
            </div>
            <label><input type="checkbox" checked={source.active} onChange={(event) => updateSource(source, { active: event.target.checked })} /> Aktiv</label>
            <button type="button" title="Neu indexieren" onClick={() => rebuildSource(source)}><RefreshCw size={15} /></button>
            <button type="button" title="Entfernen" onClick={() => removeSource(source.id)}><Trash2 size={15} /></button>
          </div>
        ))}
        <button className="wide-button" type="button" onClick={rebuildIndex}><RefreshCw size={16} /> Alle aktiven Quellen indexieren</button>
      </div>

      <div className="settings-panel">
        <h3><Plug size={17} /> Plex</h3>
        <label className="field">
          <span>Plex-URL</span>
          <input value={settings.plexUrl} onChange={(event) => setSettings((current) => ({ ...current, plexUrl: event.target.value }))} placeholder="http://192.168.1.10:32400" />
        </label>
        <label className="field">
          <span>Plex-Token</span>
          <div className="secret-field">
            <input
              type={showPlexToken ? 'text' : 'password'}
              value={settings.plexToken}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setSettings((current) => ({ ...current, plexToken: event.target.value }))}
              placeholder="X-Plex-Token"
            />
            <button type="button" title="Anzeigen/Verbergen" onClick={() => setShowPlexToken((value) => !value)}>
              {showPlexToken ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </label>
        <button type="button" onClick={testPlex}><Plug size={15} /> Verbindung testen</button>
        {plex && <div className={`tmdb-status ${plex.ok ? 'active' : 'invalid'}`}><strong>{plex.ok ? 'Verbunden' : 'Fehler'}</strong><span>{plex.message}</span></div>}
      </div>

      <div className="settings-panel">
        <h3><Database size={17} /> TMDb & Vergleich</h3>
        <label className="field">
          <span>TMDb API-Key / Read-Token</span>
          <div className="secret-field">
            <input
              type={showTmdb ? 'text' : 'password'}
              value={settings.tmdbKey}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setSettings((current) => ({ ...current, tmdbKey: event.target.value }))}
              placeholder="Key – wird automatisch gespeichert"
            />
            <button type="button" title="Anzeigen/Verbergen" onClick={() => setShowTmdb((value) => !value)}>
              {showTmdb ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </label>
        <button type="button" onClick={testTmdb} disabled={testingTmdb}>
          {testingTmdb ? <Loader2 className="spin" size={15} /> : <Plug size={15} />} TMDb testen
        </button>
        <div className={`tmdb-status ${tmdbStatus}`}><strong>{tmdbStatusLabel(tmdbStatus)}</strong></div>
        <label className="field">
          <span>Treffer-Strenge: {settings.matchStrictness}%</span>
          <input type="range" min={0} max={100} value={settings.matchStrictness} onChange={(event) => setSettings((current) => ({ ...current, matchStrictness: Number(event.target.value) }))} />
        </label>
      </div>

      <div className="settings-panel">
        <h3><FolderInput size={17} /> Umbenenn-Ziele (optional)</h3>
        <label className="field">
          <span>Movies-Root</span>
          <input value={settings.moviesRoot} onChange={(event) => setSettings((current) => ({ ...current, moviesRoot: event.target.value }))} placeholder="/media/movies" />
        </label>
        <label className="field">
          <span>Series-Root</span>
          <input value={settings.seriesRoot} onChange={(event) => setSettings((current) => ({ ...current, seriesRoot: event.target.value }))} placeholder="/media/series" />
        </label>
        <small className="fine-print">Leer lassen, um im jeweiligen Quellordner umzubenennen.</small>
      </div>

      {browser && (
        <BrowseModal
          browser={browser}
          onNavigate={openBrowser}
          onClose={() => setBrowser(null)}
          onPick={(path) => {
            addSourcePath(path, kind);
            setBrowser(null);
            onMessage(`Quelle hinzugefügt: ${path}`);
          }}
        />
      )}
    </section>
  );
}

function BrowseModal({
  browser,
  onNavigate,
  onClose,
  onPick
}: {
  browser: BrowseResult;
  onNavigate: (path?: string) => void;
  onClose: () => void;
  onPick: (path: string) => void;
}): JSX.Element {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <header>
          <strong>{browser.path || 'Medien-Roots'}</strong>
          <button type="button" onClick={onClose}><XCircle size={18} /></button>
        </header>
        {browser.error && <p className="login-error">{browser.error}</p>}
        <div className="browse-list">
          {browser.parent !== null && (
            <button type="button" onClick={() => onNavigate(browser.parent ?? undefined)}>⬑ Übergeordnet</button>
          )}
          {browser.path === '' && browser.entries.length === 0 && <p className="fine-print">Keine Medien-Roots gemountet.</p>}
          {browser.entries.map((entry) => (
            <div className="browse-row" key={entry.path}>
              <button type="button" className="browse-name" disabled={!entry.isDirectory} onClick={() => onNavigate(entry.path)}>
                {entry.isDirectory ? <FolderTree size={15} /> : <HardDrive size={15} />} {entry.name}
              </button>
              {entry.isDirectory && (
                <button type="button" className="browse-pick" onClick={() => onPick(entry.path)}>Wählen</button>
              )}
            </div>
          ))}
        </div>
        {browser.path && (
          <div className="action-bar">
            <button className="search-button" type="button" onClick={() => onPick(browser.path)}>Diesen Ordner wählen</button>
          </div>
        )}
      </div>
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

function viewTitle(view: View): string {
  switch (view) {
    case 'search':
      return 'Suche';
    case 'results':
      return 'Ergebnisse';
    case 'library':
      return 'Bibliothek';
    case 'rename':
      return 'Umbenennen';
    case 'move':
      return 'Verschieben';
    default:
      return 'Einstellungen';
  }
}

function viewSubtitle(view: View): string {
  switch (view) {
    case 'search':
      return 'Filme und Serien auf dem Server prüfen';
    case 'results':
      return 'Treffer, fehlende Titel und Duplikate';
    case 'library':
      return 'Alle Dateien mit Plex/Jellyfin-Erkennung und Aktionen';
    case 'rename':
      return 'Plex-konforme Namen – erst Vorschau, dann umbenennen';
    case 'move':
      return 'Zwischen Platten verschieben oder kopieren';
    default:
      return 'Quellen, Plex, TMDb und Umbenenn-Ziele';
  }
}

function tmdbStatusLabel(status: TmdbStatus): string {
  return status === 'active' ? 'aktiv' : status === 'invalid' ? 'Key ungültig' : status === 'offline' ? 'offline' : 'Key fehlt';
}

function basename(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path;
}

function relativeTarget(source: string, target: string): string {
  const sourceDir = source.slice(0, source.length - basename(source).length);
  return target.startsWith(sourceDir) ? target.slice(sourceDir.length) : target;
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
  return score >= 0.86 ? 'good' : score >= 0.72 ? 'warn' : 'muted';
}

function strictnessLabel(value: number): string {
  if (value >= 85) {
    return 'Sehr streng: nur klare Treffer';
  }
  if (value >= 60) {
    return 'Ausgewogen';
  }
  return 'Locker: mehr Treffer, mehr Fehlerquote';
}
