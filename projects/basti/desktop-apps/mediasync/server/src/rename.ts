import { existsSync, statSync } from 'node:fs';
import { mkdir, readdir, rename, copyFile, rm } from 'node:fs/promises';
import { basename, dirname, extname, join, parse, resolve } from 'node:path';
import { isVideoExtension } from './core/media';
import type {
  MediaItem,
  MetadataTargetRequest,
  RecognitionInfo,
  RenameApplyRequest,
  RenameApplyResult,
  RenamePreviewItem,
  RenamePreviewRequest
} from './core/types';

const QUALITY_TAIL =
  /[\s._-]*(2160p|1080p|720p|480p|bluray|brrip|web[-_. ]?dl|webrip|hdrip|dvdrip|x264|x265|h\.?264|h\.?265|hevc|dts|aac[.\d]*|ac3|yts|etrg|proper|repack|remux|multi|german|dubbed)(?:[\s._-]+.*)?$/i;

function sanitizeName(rawName: string): string {
  return (
    (rawName || 'Unbekannt')
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/[._]+/g, ' ')
      .replace(/\s*-\s*/g, ' - ')
      .replace(/\s+/g, ' ')
      .replace(/^[ ._-]+|[ ._-]+$/g, '') || 'Unbekannt'
  );
}

function cleanTitle(rawName: string, isMovie: boolean): string {
  let cleaned = sanitizeName(rawName);
  if (isMovie) {
    cleaned = cleaned.replace(QUALITY_TAIL, '');
  }
  return cleaned.replace(/\s+/g, ' ').replace(/^[ ._-]+|[ ._-]+$/g, '') || 'Unbekannt';
}

function titleCaseWords(rawName: string): string {
  return sanitizeName(rawName)
    .split(' ')
    .filter(Boolean)
    .map((part) => (/^[A-Z0-9]{2,}$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');
}

function normalizeShowName(rawName: string): string {
  return (
    cleanTitle(rawName, false)
      .replace(/\b(?:season|staffel|saison|series)\s*\d{1,2}\b.*$/i, '')
      .replace(/\b(?:complete|web[- ]?dl|webrip|nf|hulu|x264|x265|720p|1080p|2160p)\b.*$/i, '')
      .replace(/\s+/g, ' ')
      .replace(/^[ ._-]+|[ ._-]+$/g, '') || 'Unbekannt'
  );
}

interface EpisodeParts {
  season: number;
  episode: number;
  index: number;
  end: number;
}

function detectEpisodeParts(name: string): EpisodeParts | null {
  const patterns = [
    /(?:s|season)[\s._-]*(\d{1,2})[\s._-]*(?:e|ep|episode)[\s._-]*(\d{1,3})/i,
    /(\d{1,2})x(\d{1,3})/i
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(name);
    if (match) {
      return {
        season: Number(match[1]),
        episode: Number(match[2]),
        index: match.index,
        end: match.index + match[0].length
      };
    }
  }
  return null;
}

function extractShowNameFromEpisode(name: string): string {
  const episode = detectEpisodeParts(name);
  if (!episode) {
    return normalizeShowName(name);
  }
  const prefix = name.slice(0, episode.index).replace(/[\s._-]+$/g, '');
  return normalizeShowName(/^[a-z]$/i.test(prefix) ? '' : prefix);
}

function cleanEpisodeTitle(stem: string, episode: EpisodeParts | null): string {
  let raw = episode ? stem.slice(episode.end) : stem;
  raw = raw
    .replace(/^[\s._-]+/g, '')
    .replace(/[\s._-]+$/g, '')
    .replace(QUALITY_TAIL, '')
    .replace(/[_-][A-Za-z0-9]{6,12}$/i, '');
  return titleCaseWords(raw || 'Episode');
}

function detectMovieYear(stem: string, fallbackYear?: string): string {
  const explicit = /\b(19\d{2}|20\d{2})\b/.exec(stem);
  const year = explicit ? explicit[1] : String(fallbackYear || '').trim();
  return /^(19\d{2}|20\d{2})$/.test(year) ? year : '';
}

function movieTitleFromStem(stem: string): string {
  return cleanTitle(stem.replace(/\b(19\d{2}|20\d{2})\b/g, ''), true);
}

/** Append " (2)", " (3)" … if the target already exists (never overwrite). */
function uniquePath(targetPath: string, sourcePath: string): { path: string; collided: boolean } {
  if (resolve(targetPath).toLowerCase() === resolve(sourcePath).toLowerCase()) {
    return { path: targetPath, collided: false };
  }
  if (!existsSync(targetPath)) {
    return { path: targetPath, collided: false };
  }
  const parsed = parse(targetPath);
  let index = 2;
  let candidate = join(parsed.dir, `${parsed.name} (${index})${parsed.ext}`);
  while (existsSync(candidate)) {
    index += 1;
    candidate = join(parsed.dir, `${parsed.name} (${index})${parsed.ext}`);
  }
  return { path: candidate, collided: true };
}

async function collectVideoFiles(sourcePath: string): Promise<string[]> {
  const stat = statSync(sourcePath);
  if (stat.isFile()) {
    return isVideoExtension(extname(sourcePath)) ? [sourcePath] : [];
  }

  const files: string[] = [];
  const stack = [sourcePath];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile() && isVideoExtension(extname(entry.name))) {
        files.push(entryPath);
      }
    }
  }
  return files.sort((a, b) => a.localeCompare(b, 'de'));
}

interface RenameContext {
  structureMode: 'plex' | 'none';
  seriesRoot?: string;
  moviesRoot?: string;
}

/** Resolve the show root so we never nest "Season 01" inside another season folder. */
function resolveShowRoot(fileDir: string, showName: string, seriesRoot?: string): string {
  if (seriesRoot) {
    return join(seriesRoot, showName);
  }
  if (/^season\s+\d{1,2}$/i.test(basename(fileDir))) {
    return dirname(fileDir);
  }
  return fileDir;
}

function buildTarget(filePath: string, context: RenameContext): Omit<RenamePreviewItem, 'changed' | 'collision'> {
  const parsed = parse(filePath);
  const episode = detectEpisodeParts(parsed.name);
  const isSeries = Boolean(episode);
  const plex = context.structureMode === 'plex';

  if (isSeries) {
    const season = episode?.season || 1;
    const episodeNumber = episode?.episode || 1;
    const showName = extractShowNameFromEpisode(parsed.name);
    const episodeTitle = cleanEpisodeTitle(parsed.name, episode);
    const newName = `${showName} - S${String(season).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')} - ${episodeTitle}${parsed.ext}`;
    const showRoot = resolveShowRoot(parsed.dir, showName, context.seriesRoot);
    const baseDir = plex ? join(showRoot, `Season ${String(season).padStart(2, '0')}`) : parsed.dir;
    return {
      source: filePath,
      target: join(baseDir, newName),
      label: `${showName} S${String(season).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')}`,
      mediaType: 'series',
      error: episode ? null : 'Keine Episode erkannt – S01E01 als Vorschlag.'
    };
  }

  const year = detectMovieYear(parsed.name);
  const title = movieTitleFromStem(parsed.name);
  const movieBase = year ? `${title} (${year})` : title;
  const baseDir = plex ? join(context.moviesRoot ?? parsed.dir, movieBase) : parsed.dir;
  return {
    source: filePath,
    target: join(baseDir, `${movieBase}${parsed.ext}`),
    label: movieBase,
    mediaType: 'movie',
    error: year ? null : 'Kein Filmjahr erkannt – Vorschlag ohne Jahr.'
  };
}

export async function previewRename(request: RenamePreviewRequest): Promise<RenamePreviewItem[]> {
  const structureMode = request.structureMode === 'none' ? 'none' : 'plex';
  const context: RenameContext = {
    structureMode,
    seriesRoot: request.seriesRoot?.trim() || undefined,
    moviesRoot: request.moviesRoot?.trim() || undefined
  };
  const items: RenamePreviewItem[] = [];

  for (const input of request.paths ?? []) {
    const resolved = resolve(input);
    if (!existsSync(resolved)) {
      items.push({
        source: input,
        target: input,
        label: basename(input),
        mediaType: 'unknown',
        changed: false,
        collision: false,
        error: 'Pfad nicht gefunden.'
      });
      continue;
    }

    const files = await collectVideoFiles(resolved);
    if (files.length === 0) {
      items.push({
        source: resolved,
        target: resolved,
        label: basename(resolved),
        mediaType: 'unknown',
        changed: false,
        collision: false,
        error: 'Keine Videodateien gefunden.'
      });
      continue;
    }

    for (const filePath of files) {
      const base = buildTarget(filePath, context);
      const unique = uniquePath(base.target, filePath);
      const changed = resolve(unique.path).toLowerCase() !== resolve(filePath).toLowerCase();
      items.push({
        ...base,
        target: unique.path,
        changed,
        collision: unique.collided,
        error: base.error
      });
    }
  }

  return items;
}

export async function applyRename(request: RenameApplyRequest): Promise<RenameApplyResult> {
  const failed: RenameApplyResult['failed'] = [];
  let renamed = 0;

  for (const item of request.items ?? []) {
    const source = resolve(item.source);
    const target = resolve(item.target);

    if (source.toLowerCase() === target.toLowerCase()) {
      continue;
    }

    try {
      if (!existsSync(source)) {
        throw new Error('Quelle nicht gefunden.');
      }
      if (existsSync(target)) {
        throw new Error('Ziel existiert bereits.');
      }
      await mkdir(dirname(target), { recursive: true });
      try {
        await rename(source, target);
      } catch (error) {
        // Different filesystem (EXDEV) → copy then remove the original.
        if ((error as NodeJS.ErrnoException).code === 'EXDEV') {
          await copyFile(source, target);
          await rm(source);
        } else {
          throw error;
        }
      }
      renamed += 1;
    } catch (error) {
      failed.push({
        source: item.source,
        target: item.target,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return {
    ok: failed.length === 0,
    renamed,
    failed,
    message:
      failed.length === 0
        ? `${renamed} Datei(en) umbenannt.`
        : `${renamed} umbenannt, ${failed.length} fehlgeschlagen.`
  };
}

const pad2 = (value: number): string => String(value).padStart(2, '0');

/**
 * Decide whether Plex AND Jellyfin would auto-recognise an indexed item.
 * Both players use the same rules: a movie needs a year, a series file needs
 * SxxExx; folders are containers and count as recognised when they carry a
 * usable title. Reuses the fields the scanner already parsed.
 */
export function analyzeItemRecognition(item: MediaItem): RecognitionInfo {
  if (item.itemType === 'folder') {
    const recognized = item.titleNorm.length >= 3;
    return {
      recognized,
      mediaType: item.mediaType,
      season: item.season,
      episode: item.episode,
      year: item.year,
      reason: recognized ? 'Ordner mit erkennbarem Titel' : 'Ordnername zu unklar'
    };
  }

  if (item.mediaType === 'series') {
    const recognized = item.season != null && item.episode != null;
    return {
      recognized,
      mediaType: 'series',
      season: item.season,
      episode: item.episode,
      year: item.year,
      reason: recognized
        ? `Serie erkannt (S${pad2(item.season as number)}E${pad2(item.episode as number)})`
        : 'Keine SxxExx im Dateinamen'
    };
  }

  const recognized = item.year != null;
  return {
    recognized,
    mediaType: 'movie',
    season: null,
    episode: null,
    year: item.year,
    reason: recognized ? `Film erkannt (${item.year})` : 'Kein Jahr im Dateinamen'
  };
}

/**
 * Build a Plex/Jellyfin-conform target from a confirmed TMDb match (port of
 * applyMetadataToRenameJob/mediaBaseFromMetadata). For series the show folder
 * becomes "Show (Jahr)" when a Series-Root is set, which Jellyfin prefers.
 */
export function buildTargetFromMetadata(request: MetadataTargetRequest): RenamePreviewItem {
  const source = resolve(request.source);
  const parsed = parse(source);
  const plex = request.structureMode !== 'none';

  let target: string;
  let label: string;

  if (request.mediaType === 'series') {
    const season = request.season ?? 1;
    const episode = request.episode ?? 1;
    const showName = normalizeShowName(request.title);
    const showFolder = request.year ? `${showName} (${request.year})` : showName;
    const episodeTitle = titleCaseWords(request.episodeTitle || 'Episode');
    const newName = `${showName} - S${pad2(season)}E${pad2(episode)} - ${episodeTitle}${parsed.ext}`;
    const showRoot = resolveShowRoot(parsed.dir, showFolder, request.seriesRoot);
    const baseDir = plex ? join(showRoot, `Season ${pad2(season)}`) : parsed.dir;
    target = join(baseDir, newName);
    label = `${showName} S${pad2(season)}E${pad2(episode)}`;
  } else {
    const title = sanitizeName(request.title);
    const movieBase = request.year ? `${title} (${request.year})` : title;
    const baseDir = plex ? join(request.moviesRoot || parsed.dir, movieBase) : parsed.dir;
    target = join(baseDir, `${movieBase}${parsed.ext}`);
    label = movieBase;
  }

  const unique = uniquePath(target, source);
  return {
    source: request.source,
    target: unique.path,
    label,
    mediaType: request.mediaType === 'series' ? 'series' : 'movie',
    changed: resolve(unique.path).toLowerCase() !== source.toLowerCase(),
    collision: unique.collided,
    error: null
  };
}
