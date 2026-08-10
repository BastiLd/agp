import { tmdbFetch } from './core/tmdb';
import type { EpisodeInfo, MetadataDetails, MetadataResult, SeasonSummary } from './core/types';

const LANGUAGE = 'de-DE';

export type SearchType = 'movie' | 'tv' | 'auto';

interface TmdbItem {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string | null;
  poster_path?: string | null;
}

interface TmdbSeason {
  season_number?: number;
  name?: string;
  episode_count?: number;
}

interface TmdbEpisode {
  episode_number?: number;
  name?: string;
  overview?: string | null;
  air_date?: string | null;
}

function posterUrl(path: string | null | undefined): string | null {
  return path ? `https://image.tmdb.org/t/p/w185${path}` : null;
}

function yearOf(date: string | undefined): number | null {
  const match = (date ?? '').match(/^\d{4}/);
  return match ? Number(match[0]) : null;
}

function normalize(item: TmdbItem, forced?: 'movie' | 'tv'): MetadataResult {
  const isMovie = forced ? forced === 'movie' : item.media_type === 'movie' || Boolean(item.title);
  return {
    id: item.id,
    mediaType: isMovie ? 'movie' : 'tv',
    title: (isMovie ? item.title : item.name) ?? item.original_title ?? item.original_name ?? 'Unbekannt',
    originalTitle: (isMovie ? item.original_title : item.original_name) ?? null,
    year: yearOf(isMovie ? item.release_date : item.first_air_date),
    overview: item.overview ?? null,
    posterUrl: posterUrl(item.poster_path)
  };
}

/** Search TMDb (movie / tv / multi) – up to 8 results, like Plex Transfer. */
export async function searchMetadata(
  query: string,
  type: SearchType,
  credential: string,
  year?: number | null
): Promise<MetadataResult[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const endpoint = type === 'tv' ? '/search/tv' : type === 'movie' ? '/search/movie' : '/search/multi';
  const params: Record<string, string> = {
    query: normalizedQuery,
    language: LANGUAGE,
    include_adult: 'false',
    page: '1'
  };
  if (year && type === 'movie') {
    params.primary_release_year = String(year);
  }
  if (year && type === 'tv') {
    params.first_air_date_year = String(year);
  }

  const data = await tmdbFetch<{ results?: TmdbItem[] }>(endpoint, params, credential);
  return (data.results ?? [])
    .filter((item) => type !== 'auto' || item.media_type === 'movie' || item.media_type === 'tv')
    .slice(0, 8)
    .map((item) => normalize(item, type === 'auto' ? undefined : type));
}

/** Movie/series details, including the season list for series. */
export async function getDetails(
  id: number,
  type: 'movie' | 'tv',
  credential: string
): Promise<MetadataDetails> {
  const item = await tmdbFetch<TmdbItem & { seasons?: TmdbSeason[] }>(
    type === 'tv' ? `/tv/${id}` : `/movie/${id}`,
    { language: LANGUAGE },
    credential
  );
  const base = normalize(item, type);
  const seasons: SeasonSummary[] =
    type === 'tv'
      ? (item.seasons ?? [])
          .filter((season) => Number.isFinite(Number(season.season_number)))
          .map((season) => ({
            season: Number(season.season_number),
            name: season.name ?? `Season ${season.season_number}`,
            episodeCount: Number(season.episode_count ?? 0)
          }))
      : [];

  return { ...base, seasons };
}

/** All episodes of a season, with their titles. */
export async function getSeason(
  tvId: number,
  season: number,
  credential: string
): Promise<EpisodeInfo[]> {
  const item = await tmdbFetch<{ episodes?: TmdbEpisode[] }>(
    `/tv/${tvId}/season/${season}`,
    { language: LANGUAGE },
    credential
  );
  return (item.episodes ?? [])
    .filter((episode) => Number(episode.episode_number) > 0)
    .map((episode) => ({
      season,
      episode: Number(episode.episode_number),
      title: episode.name ?? `Episode ${episode.episode_number}`,
      overview: episode.overview ?? null,
      airDate: episode.air_date ?? null
    }));
}

/** A single episode (title etc.). */
export async function getEpisode(
  tvId: number,
  season: number,
  episode: number,
  credential: string
): Promise<EpisodeInfo> {
  const item = await tmdbFetch<TmdbEpisode>(
    `/tv/${tvId}/season/${season}/episode/${episode}`,
    { language: LANGUAGE },
    credential
  );
  return {
    season,
    episode,
    title: item.name ?? `Episode ${episode}`,
    overview: item.overview ?? null,
    airDate: item.air_date ?? null
  };
}
