export type SourceKind = 'plex' | 'pc' | 'usb' | 'other';

export type MediaType = 'movie' | 'series' | 'unknown';

export interface MediaSource {
  id: number;
  name: string;
  path: string;
  kind: SourceKind;
  active: boolean;
  liveWatch: boolean;
  quickScanOnStart: boolean;
  lastIndexedAt: string | null;
  lastError: string | null;
  itemCount: number;
  reachable: boolean;
  createdAt: string;
}

export interface NewMediaSource {
  name: string;
  path: string;
  kind: SourceKind;
}

export interface SourceUpdate {
  name?: string;
  kind?: SourceKind;
  active?: boolean;
  liveWatch?: boolean;
  quickScanOnStart?: boolean;
}

export interface MediaItem {
  id: number;
  path: string;
  name: string;
  itemType: 'file' | 'folder';
  extension: string | null;
  size: number;
  mtimeMs: number;
  sourceId: number;
  sourceKind: SourceKind;
  title: string;
  titleNorm: string;
  year: number | null;
  mediaType: MediaType;
  season: number | null;
  episode: number | null;
  quality: string[];
}

export interface ParsedQuery {
  raw: string;
  title: string;
  titleNorm: string;
  year: number | null;
  mediaType: MediaType;
  season: number | null;
  episode: number | null;
}

export interface SearchRequest {
  text: string;
  useTmdb: boolean;
}

export type MatchReason = 'Dateiname' | 'TMDb-Alias' | 'Fuzzy' | 'Jahr passt' | 'Manuell';

export interface MatchHit {
  item: MediaItem;
  score: number;
  reason: MatchReason;
  matchedVariant: string;
}

export interface SearchResult {
  query: ParsedQuery;
  status: 'plex' | 'local' | 'missing';
  plexMatches: MatchHit[];
  localMatches: MatchHit[];
  duplicates: MatchHit[];
  quality: string[];
  missingReason: string | null;
  variants: string[];
  inactiveMatches: MatchHit[];
  closestMatches: MatchHit[];
  tmdb?: TmdbMetadata | null;
}

export interface TmdbMetadata {
  id: number;
  title: string;
  originalTitle: string | null;
  mediaType: 'movie' | 'tv';
  year: number | null;
  posterUrl: string | null;
  overview: string | null;
  aliases: string[];
}

export interface IndexStatus {
  itemCount: number;
  sourceCount: number;
  lastIndexedAt: string | null;
  isIndexing: boolean;
  currentPath: string | null;
  indexedThisRun: number;
}

export interface ScanProgress {
  isIndexing: boolean;
  currentPath: string | null;
  indexedThisRun: number;
}

export interface AppSettings {
  tmdbKey: string;
  matchStrictness: number;
  collections: SavedCollection[];
  manualAliases: ManualAlias[];
  plexUrl: string;
  plexToken: string;
  moviesRoot: string;
  seriesRoot: string;
}

export interface SavedCollection {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}

export interface ManualAlias {
  id: string;
  query: string;
  alias: string;
  createdAt: string;
}

export type FileAction = 'open' | 'open-folder' | 'show-in-folder' | 'copy-full-path' | 'copy-name-path';

export interface FileActionResult {
  ok: boolean;
  message: string;
}

export interface DirectoryPickResult {
  canceled: boolean;
  path: string | null;
  paths: string[];
}

// --- Server-side directory browser (replaces the native Electron dialog) ---
export interface BrowseEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export interface BrowseResult {
  path: string;
  parent: string | null;
  entries: BrowseEntry[];
  error: string | null;
}

// --- Mounted disk targets used by the "move" feature ---
export interface DiskTarget {
  path: string;
  label: string;
  total: number;
  free: number;
  writable: boolean;
}

// --- Plex-konformes Umbenennen ---
export interface RenamePreviewRequest {
  paths: string[];
  moviesRoot?: string;
  seriesRoot?: string;
  structureMode?: 'plex' | 'none';
}

export interface RenamePreviewItem {
  source: string;
  target: string;
  label: string;
  mediaType: MediaType;
  changed: boolean;
  collision: boolean;
  error: string | null;
}

export interface RenameApplyRequest {
  items: Array<{ source: string; target: string }>;
  refreshPlex?: boolean;
}

export interface RenameApplyResult {
  ok: boolean;
  renamed: number;
  failed: Array<{ source: string; target: string; error: string }>;
  message: string;
}

// --- Verschieben / Kopieren zwischen Platten ---
export interface MoveRequest {
  paths: string[];
  targetDir: string;
  mode: 'move' | 'copy';
  verify?: boolean;
  refreshPlex?: boolean;
}

export interface MoveResultItem {
  source: string;
  target: string;
  ok: boolean;
  bytes: number;
  error: string | null;
}

export interface MoveResult {
  ok: boolean;
  mode: 'move' | 'copy';
  items: MoveResultItem[];
  message: string;
}

// --- Plex-API ---
export interface PlexLibrary {
  key: string;
  title: string;
  type: string;
  itemCount: number;
}

export interface PlexStatus {
  ok: boolean;
  message: string;
  libraries: PlexLibrary[];
}

export interface PlexRefreshResult {
  ok: boolean;
  refreshed: string[];
  message: string;
}

// --- Auth ---
export interface AuthState {
  authenticated: boolean;
  required: boolean;
}

// --- TMDb-Metadaten (Online-Suche, Staffel/Episode – wie Plex Transfer) ---
export interface MetadataResult {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  originalTitle: string | null;
  year: number | null;
  overview: string | null;
  posterUrl: string | null;
}

export interface SeasonSummary {
  season: number;
  name: string;
  episodeCount: number;
}

export interface MetadataDetails extends MetadataResult {
  seasons: SeasonSummary[];
}

export interface EpisodeInfo {
  season: number;
  episode: number;
  title: string;
  overview: string | null;
  airDate: string | null;
}

// --- Erkennung (Plex/Jellyfin) ---
export interface RecognitionInfo {
  recognized: boolean;
  mediaType: MediaType;
  season: number | null;
  episode: number | null;
  year: number | null;
  reason: string;
}

export interface LibraryEntry extends MediaItem {
  recognition: RecognitionInfo;
}

// Build a Plex/Jellyfin target from a confirmed TMDb match (wie applyMetadataToRenameJob).
export interface MetadataTargetRequest {
  source: string;
  mediaType: 'movie' | 'series';
  title: string;
  year?: number | null;
  season?: number | null;
  episode?: number | null;
  episodeTitle?: string | null;
  structureMode?: 'plex' | 'none';
  moviesRoot?: string;
  seriesRoot?: string;
}
