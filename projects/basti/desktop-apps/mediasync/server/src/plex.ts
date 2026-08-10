import { basename, extname } from 'node:path';
import { extractQuality, normalizeTitle } from './core/media';
import type { MediaItem, PlexLibrary, PlexRefreshResult, PlexStatus } from './core/types';

interface PlexDirectory {
  key: string;
  title: string;
  type: string;
}

interface PlexPart {
  file?: string;
  size?: number;
}

interface PlexMetadata {
  ratingKey?: string;
  title?: string;
  grandparentTitle?: string;
  parentIndex?: number;
  index?: number;
  year?: number;
  addedAt?: number;
  updatedAt?: number;
  Media?: Array<{ Part?: PlexPart[] }>;
}

interface PlexContainer<T> {
  MediaContainer?: {
    size?: number;
    Directory?: T[];
    Metadata?: T[];
  };
}

function normalizeBase(url: string): string {
  return url.replace(/\/+$/, '');
}

async function plexFetch<T>(
  url: string,
  token: string,
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const search = new URLSearchParams({ 'X-Plex-Token': token, ...params });
  const response = await fetch(`${normalizeBase(url)}${path}?${search.toString()}`, {
    headers: { Accept: 'application/json', 'X-Plex-Token': token },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`Plex ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getLibraries(url: string, token: string): Promise<PlexLibrary[]> {
  const data = await plexFetch<PlexContainer<PlexDirectory>>(url, token, '/library/sections');
  const directories = data.MediaContainer?.Directory ?? [];

  return directories.map((directory) => ({
    key: directory.key,
    title: directory.title,
    type: directory.type,
    itemCount: 0
  }));
}

export async function getStatus(url: string, token: string): Promise<PlexStatus> {
  if (!url.trim() || !token.trim()) {
    return { ok: false, message: 'Plex-URL und Token fehlen.', libraries: [] };
  }

  try {
    const libraries = await getLibraries(url, token);
    return {
      ok: true,
      message: `${libraries.length} Bibliothek(en) gefunden.`,
      libraries
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
      libraries: []
    };
  }
}

function timestampToMs(metadata: PlexMetadata): number {
  const seconds = metadata.updatedAt ?? metadata.addedAt ?? 0;
  return seconds > 0 ? seconds * 1000 : Date.now();
}

function firstFile(metadata: PlexMetadata): PlexPart | null {
  return metadata.Media?.[0]?.Part?.[0] ?? null;
}

function movieItem(metadata: PlexMetadata, sourceId: number): Omit<MediaItem, 'id'> | null {
  const title = metadata.title?.trim();
  if (!title) {
    return null;
  }

  const part = firstFile(metadata);
  const file = part?.file ?? `plex://movie/${metadata.ratingKey ?? title}`;
  const name = part?.file ? basename(part.file) : `${title}${metadata.year ? ` (${metadata.year})` : ''}`;

  return {
    path: file,
    name,
    itemType: part?.file ? 'file' : 'folder',
    extension: part?.file ? extname(part.file).toLowerCase() : null,
    size: part?.size ?? 0,
    mtimeMs: timestampToMs(metadata),
    sourceId,
    sourceKind: 'plex',
    title,
    titleNorm: normalizeTitle(title),
    year: metadata.year ?? null,
    mediaType: 'movie',
    season: null,
    episode: null,
    quality: extractQuality(name)
  };
}

function showItem(metadata: PlexMetadata, sourceId: number): Omit<MediaItem, 'id'> | null {
  const title = metadata.title?.trim();
  if (!title) {
    return null;
  }

  return {
    path: `plex://show/${metadata.ratingKey ?? title}`,
    name: title,
    itemType: 'folder',
    extension: null,
    size: 0,
    mtimeMs: timestampToMs(metadata),
    sourceId,
    sourceKind: 'plex',
    title,
    titleNorm: normalizeTitle(title),
    year: metadata.year ?? null,
    mediaType: 'series',
    season: null,
    episode: null,
    quality: []
  };
}

function episodeItem(metadata: PlexMetadata, sourceId: number): Omit<MediaItem, 'id'> | null {
  const show = metadata.grandparentTitle?.trim();
  if (!show) {
    return null;
  }

  const part = firstFile(metadata);
  const file = part?.file ?? `plex://episode/${metadata.ratingKey ?? show}`;
  const name = part?.file ? basename(part.file) : `${show} - S${metadata.parentIndex}E${metadata.index}`;

  return {
    path: file,
    name,
    itemType: part?.file ? 'file' : 'folder',
    extension: part?.file ? extname(part.file).toLowerCase() : null,
    size: part?.size ?? 0,
    mtimeMs: timestampToMs(metadata),
    sourceId,
    sourceKind: 'plex',
    title: show,
    titleNorm: normalizeTitle(show),
    year: metadata.year ?? null,
    mediaType: 'series',
    season: metadata.parentIndex ?? null,
    episode: metadata.index ?? null,
    quality: extractQuality(name)
  };
}

/** Fetch all movies, shows and episodes from Plex as comparable MediaItems. */
export async function getPlexItems(
  url: string,
  token: string,
  sourceId: number,
  onProgress?: (path: string, indexed: number) => void
): Promise<Omit<MediaItem, 'id'>[]> {
  const libraries = await getLibraries(url, token);
  const items: Omit<MediaItem, 'id'>[] = [];

  for (const library of libraries) {
    if (library.type === 'movie') {
      const data = await plexFetch<PlexContainer<PlexMetadata>>(
        url,
        token,
        `/library/sections/${library.key}/all`
      );
      for (const metadata of data.MediaContainer?.Metadata ?? []) {
        const item = movieItem(metadata, sourceId);
        if (item) {
          items.push(item);
        }
      }
    } else if (library.type === 'show') {
      const shows = await plexFetch<PlexContainer<PlexMetadata>>(
        url,
        token,
        `/library/sections/${library.key}/all`
      );
      for (const metadata of shows.MediaContainer?.Metadata ?? []) {
        const item = showItem(metadata, sourceId);
        if (item) {
          items.push(item);
        }
      }

      const episodes = await plexFetch<PlexContainer<PlexMetadata>>(
        url,
        token,
        `/library/sections/${library.key}/all`,
        { type: '4' }
      );
      for (const metadata of episodes.MediaContainer?.Metadata ?? []) {
        const item = episodeItem(metadata, sourceId);
        if (item) {
          items.push(item);
        }
      }
    }

    onProgress?.(`Plex: ${library.title}`, items.length);
  }

  return items;
}

/** Trigger a library refresh for movie + show sections (or all if none match). */
export async function triggerRefresh(url: string, token: string): Promise<PlexRefreshResult> {
  if (!url.trim() || !token.trim()) {
    return { ok: false, refreshed: [], message: 'Plex-URL und Token fehlen.' };
  }

  try {
    const libraries = await getLibraries(url, token);
    const targets = libraries.filter(
      (library) => library.type === 'movie' || library.type === 'show'
    );
    const refreshed: string[] = [];

    for (const library of targets.length > 0 ? targets : libraries) {
      await plexFetch(url, token, `/library/sections/${library.key}/refresh`);
      refreshed.push(library.title);
    }

    return {
      ok: refreshed.length > 0,
      refreshed,
      message: refreshed.length > 0 ? `Refresh ausgelöst: ${refreshed.join(', ')}` : 'Keine Bibliothek gefunden.'
    };
  } catch (error) {
    return {
      ok: false,
      refreshed: [],
      message: error instanceof Error ? error.message : String(error)
    };
  }
}
