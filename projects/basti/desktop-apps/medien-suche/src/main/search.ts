import Fuse from 'fuse.js';
import {
  buildLocalTitleVariants,
  normalizeTitle,
  parseInputList,
  parseMediaName,
  similarity
} from '../shared/media';
import type {
  AppSettings,
  MatchHit,
  MatchReason,
  MediaItem,
  MediaSource,
  ParsedQuery,
  SearchRequest,
  SearchResult,
  TmdbMetadata
} from '../shared/types';
import { searchTmdb } from './tmdb';

interface SearchContext {
  activeSources: MediaSource[];
  allItems: MediaItem[];
}

interface MatchTuning {
  strictness: number;
  fuseThreshold: number;
  fileScore: number;
  folderScore: number;
  tokenOverlap: number;
  variantOverlap: number;
  maxMatches: number;
  maxCandidates: number;
}

const GENERIC_FOLDER_NAMES = new Set([
  'bonus',
  'deleted scene',
  'deleted scenes',
  'extra',
  'extras',
  'featurette',
  'featurettes',
  'movie',
  'movies',
  'other',
  'others',
  'sample',
  'samples',
  'screen',
  'screens',
  'soundtrack',
  'special',
  'specials',
  'subtitle',
  'subtitles',
  'info'
]);

const TOKEN_STOPWORDS = new Set([
  'and',
  'und',
  'of',
  'in',
  'to',
  'for',
  'part',
  'movie',
  'film',
  'season',
  'staffel',
  'episode',
  'folge'
]);

export async function searchMedia(
  request: SearchRequest,
  activeItems: MediaItem[],
  settings: AppSettings,
  context: SearchContext
): Promise<SearchResult[]> {
  const queries = parseInputList(request.text).map(parseMediaName);
  const tuning = createMatchTuning(settings.matchStrictness);
  const activeFuse = createFuse(activeItems, tuning);
  const activeSourceIds = new Set(context.activeSources.map((source) => source.id));
  const inactiveItems = context.allItems.filter((item) => !activeSourceIds.has(item.sourceId));
  const inactiveFuse = createFuse(inactiveItems, tuning);
  const results: SearchResult[] = [];

  for (const query of queries) {
    const tmdb =
      request.useTmdb && settings.tmdbKey ? await searchTmdb(query, settings.tmdbKey) : null;
    const variants = buildSearchVariants(query, tmdb, settings, tuning);
    const candidateHits = findMatches(query, variants, activeFuse, tuning);
    const inactiveMatches = findMatches(query, variants, inactiveFuse, tuning).slice(0, 8);
    const uniqueHits = dedupeByPath(candidateHits).slice(0, tuning.maxMatches);
    const plexMatches = uniqueHits.filter((hit) => hit.item.sourceKind === 'plex');
    const localMatches = uniqueHits.filter((hit) => hit.item.sourceKind !== 'plex');
    const duplicates = findDuplicates(uniqueHits);
    const quality = [...new Set(uniqueHits.flatMap((hit) => hit.item.quality))];
    const status = plexMatches.length > 0 ? 'plex' : localMatches.length > 0 ? 'local' : 'missing';

    results.push({
      query,
      status,
      plexMatches,
      localMatches,
      duplicates,
      quality,
      missingReason:
        status === 'missing'
          ? getMissingReason(context.activeSources, activeItems, inactiveMatches)
          : null,
      variants,
      inactiveMatches,
      closestMatches: status === 'missing' ? findClosest(query, activeFuse, tuning) : [],
      tmdb
    });
  }

  return results;
}

function createFuse(items: MediaItem[], tuning: MatchTuning): Fuse<MediaItem> {
  return new Fuse(items, {
    includeScore: true,
    threshold: tuning.fuseThreshold,
    ignoreLocation: true,
    keys: [
      { name: 'titleNorm', weight: 0.9 },
      { name: 'name', weight: 0.1 }
    ]
  });
}

function buildSearchVariants(
  query: ParsedQuery,
  tmdb: TmdbMetadata | null,
  settings: AppSettings,
  tuning: MatchTuning
): string[] {
  const variants = new Set<string>();

  for (const variant of buildLocalTitleVariants(query.title)) {
    variants.add(variant);
    variants.add(normalizeTitle(variant));
  }

  if (query.year) {
    variants.add(`${query.title} ${query.year}`);
  }

  if (tmdb) {
    for (const variant of [tmdb.title, tmdb.originalTitle, ...tmdb.aliases]) {
      if (!variant) {
        continue;
      }
      variants.add(variant);
      variants.add(normalizeTitle(variant));
    }
  }

  for (const alias of settings.manualAliases ?? []) {
    if (normalizeTitle(alias.query) === query.titleNorm || normalizeTitle(alias.query) === normalizeTitle(query.raw)) {
      variants.add(alias.alias);
      variants.add(normalizeTitle(alias.alias));
    }
  }

  return [...variants]
    .map((variant) => variant.trim())
    .filter(Boolean)
    .filter((variant) => isMeaningfulVariant(query, normalizeTitle(variant), tuning));
}

function findMatches(query: ParsedQuery, variants: string[], fuse: Fuse<MediaItem>, tuning: MatchTuning): MatchHit[] {
  const hits = new Map<string, MatchHit>();
  const queryNorm = query.titleNorm;
  const queryTokens = tokens(queryNorm);

  for (const variant of variants) {
    const variantNorm = normalizeTitle(variant);
    if (!variantNorm) {
      continue;
    }

    const entries = fuse.search(variantNorm).slice(0, tuning.maxCandidates);

    for (const entry of entries) {
      const item = entry.item;
      const fuseScore = Math.max(0, 1 - (entry.score ?? 1));
      const titleScore = Math.max(fuseScore, similarity(variantNorm, item.titleNorm));
      const directMatch = isDirectTitleMatch(item.titleNorm, variantNorm);

      if (!isUsefulMatch(query, item, variantNorm, titleScore, directMatch, queryTokens, tuning)) {
        continue;
      }

      const reason = getReason(query, variantNorm, item, titleScore, directMatch);
      const score = directMatch ? Math.max(titleScore, 0.92) : titleScore;
      const existing = hits.get(item.path);

      if (!existing || existing.score < score) {
        hits.set(item.path, {
          item,
          score,
          reason,
          matchedVariant: variant
        });
      }
    }
  }

  return [...hits.values()].sort(compareHits);
}

function findClosest(query: ParsedQuery, fuse: Fuse<MediaItem>, tuning: MatchTuning): MatchHit[] {
  return fuse
    .search(query.titleNorm || query.title)
    .filter((entry) => Math.max(0, 1 - (entry.score ?? 1)) >= Math.max(0.58, tuning.fileScore - 0.18))
    .slice(0, 3)
    .map((entry) => ({
      item: entry.item,
      score: Math.max(0, 1 - (entry.score ?? 1)),
      reason: 'Fuzzy' as MatchReason,
      matchedVariant: query.title
    }));
}

function isUsefulMatch(
  query: ParsedQuery,
  item: MediaItem,
  variantNorm: string,
  titleScore: number,
  directMatch: boolean,
  queryTokens: string[],
  tuning: MatchTuning
): boolean {
  if (!query.titleNorm || !item.titleNorm) {
    return false;
  }

  if (isGenericContainer(item)) {
    return false;
  }

  if (query.year && item.year && Math.abs(query.year - item.year) > 1) {
    return false;
  }

  if (query.season && item.season && query.season !== item.season) {
    return false;
  }

  if (query.episode && item.episode && query.episode !== item.episode) {
    return false;
  }

  const itemTokens = tokens(item.titleNorm);
  const overlap = tokenOverlap(queryTokens, itemTokens);
  const variantTokens = tokens(variantNorm);
  const variantOverlap = tokenOverlap(queryTokens, variantTokens);
  const oneWordQuery = queryTokens.length === 1;
  const hasExactQueryToken = oneWordQuery && itemTokens.includes(queryTokens[0]);
  const isFolder = item.itemType === 'folder';
  const firstPartAlias = query.titleNorm === `${variantNorm} 1`;
  const variantIsBroadAlias = variantNorm !== query.titleNorm && !firstPartAlias && variantOverlap < tuning.variantOverlap;
  const strongEnoughForFolder = directMatch || (titleScore >= tuning.folderScore && overlap >= tuning.tokenOverlap + 0.12);
  const strongEnoughForFile = directMatch || (titleScore >= tuning.fileScore && overlap >= tuning.tokenOverlap);

  if (variantIsBroadAlias) {
    return false;
  }

  if (isFolder && !strongEnoughForFolder) {
    return false;
  }

  if (!isFolder && !strongEnoughForFile) {
    return false;
  }

  if (oneWordQuery && !directMatch && !hasExactQueryToken) {
    return false;
  }

  if (variantTokens.length === 1 && !directMatch && overlap < 0.75) {
    return false;
  }

  if (directMatch && variantNorm !== query.titleNorm && !firstPartAlias && overlap < tuning.tokenOverlap) {
    return false;
  }

  if (query.mediaType === 'movie' && item.mediaType === 'series' && !directMatch && overlap < 0.92) {
    return false;
  }

  return true;
}

function getReason(
  query: ParsedQuery,
  variantNorm: string,
  item: MediaItem,
  titleScore: number,
  directMatch: boolean
): MatchReason {
  if (query.year && item.year && Math.abs(query.year - item.year) <= 1 && (directMatch || titleScore >= 0.78)) {
    return 'Jahr passt';
  }

  if (variantNorm !== query.titleNorm) {
    return 'TMDb-Alias';
  }

  if (directMatch) {
    return 'Dateiname';
  }

  return titleScore >= 0.75 ? 'Dateiname' : 'Fuzzy';
}

function getMissingReason(
  activeSources: MediaSource[],
  activeItems: MediaItem[],
  inactiveMatches: MatchHit[]
): string {
  if (activeSources.length === 0) {
    return 'Kein aktiver Suchort';
  }

  if (activeItems.length === 0) {
    return activeSources.some((source) => !source.lastIndexedAt) ? 'Quelle nicht aktualisiert' : 'Index leer';
  }

  if (inactiveMatches.length > 0) {
    return 'Nur in deaktivierter Quelle gefunden';
  }

  if (activeSources.some((source) => !source.lastIndexedAt)) {
    return 'Quelle nicht aktualisiert';
  }

  return 'Kein ähnlicher Dateiname';
}

function dedupeByPath(hits: MatchHit[]): MatchHit[] {
  const seen = new Set<string>();
  const result: MatchHit[] = [];

  for (const hit of hits) {
    if (seen.has(hit.item.path)) {
      continue;
    }
    seen.add(hit.item.path);
    result.push(hit);
  }

  return result;
}

function findDuplicates(hits: MatchHit[]): MatchHit[] {
  const grouped = new Map<string, MatchHit[]>();

  for (const hit of hits.filter((entry) => entry.score >= 0.82)) {
    const key = [
      hit.item.titleNorm,
      hit.item.year ?? '',
      hit.item.season ?? '',
      hit.item.episode ?? ''
    ].join('|');
    grouped.set(key, [...(grouped.get(key) ?? []), hit]);
  }

  return [...grouped.values()]
    .filter((group) => group.length > 1)
    .flat()
    .sort(compareHits);
}

function isMeaningfulVariant(query: ParsedQuery, variantNorm: string, tuning: MatchTuning): boolean {
  if (!variantNorm) {
    return false;
  }

  const variantTokens = tokens(variantNorm);
  const queryTokens = tokens(query.titleNorm);

  if (variantTokens.length === 0) {
    return false;
  }

  if (queryTokens.length === 1) {
    return variantTokens.includes(queryTokens[0]);
  }

  if (variantTokens.length === 1 && queryTokens.length > 1) {
    return query.titleNorm === `${variantNorm} 1`;
  }

  if (queryTokens.length >= 4 && variantTokens.length < 3) {
    return variantTokens.some((token) => queryTokens.slice(-2).includes(token));
  }

  if (tokenOverlap(queryTokens, variantTokens) < tuning.variantOverlap) {
    return false;
  }

  return true;
}

function isDirectTitleMatch(itemTitleNorm: string, variantNorm: string): boolean {
  return itemTitleNorm === variantNorm || containsTokenSequence(itemTitleNorm, variantNorm);
}

function containsTokenSequence(value: string, sequence: string): boolean {
  return ` ${value} `.includes(` ${sequence} `);
}

function isGenericContainer(item: MediaItem): boolean {
  if (item.itemType !== 'folder') {
    return false;
  }

  const title = item.titleNorm || normalizeTitle(item.name);

  return (
    GENERIC_FOLDER_NAMES.has(title) ||
    /^s(?:eason)?\s*\d{1,2}$/.test(title) ||
    /^staffel\s*\d{1,2}$/.test(title) ||
    /^book\s+(one|two|three|four|five|1|2|3|4|5)\b/.test(title)
  );
}

function tokens(value: string): string[] {
  return normalizeTitle(value)
    .split(' ')
    .filter((token) => (token.length > 1 || /^\d+$/.test(token)) && !TOKEN_STOPWORDS.has(token));
}

function tokenOverlap(queryTokens: string[], itemTokens: string[]): number {
  if (queryTokens.length === 0 || itemTokens.length === 0) {
    return 0;
  }

  const itemTokenSet = new Set(itemTokens);
  const matched = queryTokens.filter((token) => itemTokenSet.has(token)).length;

  return matched / queryTokens.length;
}

function compareHits(a: MatchHit, b: MatchHit): number {
  const fileBonusA = a.item.itemType === 'file' ? 0.03 : 0;
  const fileBonusB = b.item.itemType === 'file' ? 0.03 : 0;
  return b.score + fileBonusB - (a.score + fileBonusA);
}

function createMatchTuning(value: number | undefined): MatchTuning {
  const strictness = Math.min(100, Math.max(0, Number.isFinite(value) ? Number(value) : 86));
  const ratio = strictness / 100;

  return {
    strictness,
    fuseThreshold: 0.46 - ratio * 0.24,
    fileScore: 0.6 + ratio * 0.22,
    folderScore: 0.78 + ratio * 0.16,
    tokenOverlap: 0.5 + ratio * 0.32,
    variantOverlap: 0.45 + ratio * 0.28,
    maxMatches: strictness >= 80 ? 8 : strictness >= 55 ? 14 : 22,
    maxCandidates: strictness >= 80 ? 20 : strictness >= 55 ? 32 : 46
  };
}
