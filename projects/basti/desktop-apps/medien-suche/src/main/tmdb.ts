import type { ParsedQuery, TmdbMetadata } from '../shared/types';

interface TmdbSearchResponse {
  results?: Array<{
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    release_date?: string;
    first_air_date?: string;
    poster_path?: string | null;
    overview?: string | null;
  }>;
}

interface TmdbAlternativeTitlesResponse {
  titles?: Array<{ title?: string }>;
  results?: Array<{ title?: string }>;
}

const searchCache = new Map<string, Promise<TmdbMetadata | null>>();
const alternativeTitleCache = new Map<string, Promise<string[]>>();

export async function searchTmdb(
  query: ParsedQuery,
  credential: string
): Promise<TmdbMetadata | null> {
  if (!credential.trim() || !query.title) {
    return null;
  }

  const cacheKey = [
    credentialFingerprint(credential),
    query.mediaType,
    query.title.toLowerCase(),
    query.year ?? '',
    query.season ?? '',
    query.episode ?? ''
  ].join('|');
  const cached = searchCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const promise = searchTmdbUncached(query, credential);
  searchCache.set(cacheKey, promise);
  return promise;
}

async function searchTmdbUncached(
  query: ParsedQuery,
  credential: string
): Promise<TmdbMetadata | null> {
  const mediaType = query.mediaType === 'series' ? 'tv' : 'movie';

  try {
    const data = await tmdbFetch<TmdbSearchResponse>(
      `/search/${mediaType}`,
      {
        query: query.title,
        language: 'de-DE',
        include_adult: 'false',
        ...(query.year && mediaType === 'movie' ? { year: String(query.year) } : {})
      },
      credential
    );
    const first = data.results?.[0];
    if (!first) {
      return null;
    }

    const title = first.title ?? first.name ?? query.title;
    const originalTitle = first.original_title ?? first.original_name ?? null;
    const date = first.release_date ?? first.first_air_date ?? '';
    const year = date.match(/^\d{4}/)?.[0];
    const aliases = await getAlternativeTitles(mediaType, first.id, credential);

    return {
      id: first.id,
      title,
      originalTitle,
      mediaType,
      year: year ? Number(year) : null,
      posterUrl: first.poster_path ? `https://image.tmdb.org/t/p/w342${first.poster_path}` : null,
      overview: first.overview ?? null,
      aliases: [...new Set([title, originalTitle, ...aliases].filter(Boolean) as string[])]
    };
  } catch {
    return null;
  }
}

export async function validateTmdbKey(credential: string): Promise<'active' | 'missing' | 'invalid' | 'offline'> {
  if (!credential.trim()) {
    return 'missing';
  }

  try {
    await tmdbFetch('/configuration', {}, credential);
    return 'active';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('401') || message.includes('403') ? 'invalid' : 'offline';
  }
}

async function getAlternativeTitles(
  mediaType: 'movie' | 'tv',
  id: number,
  credential: string
): Promise<string[]> {
  const cacheKey = `${credentialFingerprint(credential)}|${mediaType}|${id}`;
  const cached = alternativeTitleCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const promise = getAlternativeTitlesUncached(mediaType, id, credential);
  alternativeTitleCache.set(cacheKey, promise);
  return promise;
}

async function getAlternativeTitlesUncached(
  mediaType: 'movie' | 'tv',
  id: number,
  credential: string
): Promise<string[]> {
  try {
    const data = await tmdbFetch<TmdbAlternativeTitlesResponse>(
      `/${mediaType}/${id}/alternative_titles`,
      {},
      credential
    );

    return [...(data.titles ?? []), ...(data.results ?? [])]
      .map((entry) => entry.title?.trim())
      .filter(Boolean) as string[];
  } catch {
    return [];
  }
}

function credentialFingerprint(credential: string): string {
  const trimmed = credential.trim();
  return `${trimmed.length}:${trimmed.slice(-8)}`;
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string>,
  credential: string
): Promise<T> {
  const searchParams = new URLSearchParams(params);
  const headers: Record<string, string> = {};
  const trimmed = credential.trim();
  const isBearerToken = trimmed.startsWith('eyJ');

  if (isBearerToken) {
    headers.Authorization = `Bearer ${trimmed}`;
  } else {
    searchParams.set('api_key', trimmed);
  }

  const response = await fetch(`https://api.themoviedb.org/3${path}?${searchParams.toString()}`, {
    headers
  });

  if (!response.ok) {
    throw new Error(`TMDb ${response.status}`);
  }

  return (await response.json()) as T;
}
