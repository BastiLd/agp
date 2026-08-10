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
