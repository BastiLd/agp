import type {
  AppSettings,
  AuthState,
  BrowseResult,
  DiskTarget,
  EpisodeInfo,
  IndexStatus,
  LibraryEntry,
  MediaSource,
  MetadataDetails,
  MetadataResult,
  MetadataTargetRequest,
  MoveRequest,
  MoveResult,
  NewMediaSource,
  PlexRefreshResult,
  PlexStatus,
  RenameApplyRequest,
  RenameApplyResult,
  RenamePreviewItem,
  RenamePreviewRequest,
  ScanProgress,
  SearchRequest,
  SearchResult,
  SourceUpdate
} from './shared/types';

type SearchType = 'movie' | 'tv' | 'auto';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: init.body ? { 'Content-Type': 'application/json' } : {},
    ...init
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = (await response.json()) as { error?: string };
      message = data.error ?? message;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

const json = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export const api = {
  // Auth
  authState: () => request<AuthState>('/api/auth'),
  login: (password: string) => request<AuthState>('/api/login', json({ password })),
  logout: () => request<{ ok: true }>('/api/logout', { method: 'POST' }),

  // Sources
  listSources: () => request<MediaSource[]>('/api/sources'),
  addSource: (source: NewMediaSource) => request<MediaSource>('/api/sources', json(source)),
  updateSource: (id: number, patch: SourceUpdate) =>
    request<MediaSource>(`/api/sources/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  removeSource: (id: number) => request<MediaSource[]>(`/api/sources/${id}`, { method: 'DELETE' }),
  rebuildSource: (id: number) => request<IndexStatus>(`/api/sources/${id}/rebuild`, { method: 'POST' }),

  // Index
  getIndexStatus: () => request<IndexStatus>('/api/index'),
  rebuildIndex: () => request<IndexStatus>('/api/index/rebuild', { method: 'POST' }),
  onIndexProgress: (callback: (progress: ScanProgress) => void): (() => void) => {
    const source = new EventSource('/api/index/stream');
    source.onmessage = (event) => callback(JSON.parse(event.data) as ScanProgress);
    return () => source.close();
  },

  // Search
  searchMedia: (req: SearchRequest) => request<SearchResult[]>('/api/search', json(req)),

  // Settings
  getSettings: () => request<AppSettings>('/api/settings'),
  saveSettings: (settings: AppSettings) =>
    request<AppSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  validateTmdbKey: (key: string) =>
    request<{ status: 'active' | 'missing' | 'invalid' | 'offline' }>('/api/tmdb/validate', json({ key })).then(
      (result) => result.status
    ),
  tmdbTest: () =>
    request<{ status: 'active' | 'missing' | 'invalid' | 'offline' }>('/api/tmdb/test', { method: 'POST' }).then(
      (result) => result.status
    ),

  // Browser + disks
  browse: (path?: string) =>
    request<BrowseResult>(`/api/browse${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  listDisks: () => request<DiskTarget[]>('/api/disks'),

  // Rename
  renamePreview: (req: RenamePreviewRequest) =>
    request<RenamePreviewItem[]>('/api/rename/preview', json(req)),
  renameApply: (req: RenameApplyRequest) => request<RenameApplyResult>('/api/rename/apply', json(req)),
  renameFromMetadata: (req: MetadataTargetRequest) =>
    request<RenamePreviewItem>('/api/rename/from-metadata', json(req)),

  // Move / copy
  move: (req: MoveRequest) => request<MoveResult>('/api/move', json(req)),

  // Plex
  plexLibraries: () => request<PlexStatus>('/api/plex/libraries'),
  plexRefresh: () => request<PlexRefreshResult>('/api/plex/refresh', { method: 'POST' }),

  // TMDb metadata (online search, seasons, episodes)
  metadataSearch: (query: string, type: SearchType, year?: number | null) =>
    request<MetadataResult[]>('/api/metadata/search', json({ query, type, year })),
  metadataDetails: (id: number, type: 'movie' | 'tv') =>
    request<MetadataDetails>(`/api/metadata/details?id=${id}&type=${type}`),
  metadataSeason: (tvId: number, season: number) =>
    request<EpisodeInfo[]>(`/api/metadata/season?tvId=${tvId}&season=${season}`),
  metadataEpisode: (tvId: number, season: number, episode: number) =>
    request<EpisodeInfo>(`/api/metadata/episode?tvId=${tvId}&season=${season}&episode=${episode}`),

  // Library: all locally-scanned items + recognition
  listItems: (filter?: 'unrecognized' | 'movie' | 'series') =>
    request<LibraryEntry[]>(`/api/items${filter ? `?filter=${filter}` : ''}`)
};
