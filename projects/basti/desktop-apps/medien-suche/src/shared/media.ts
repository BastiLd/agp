import type { MediaType, ParsedQuery } from './types';

const QUALITY_PATTERNS: Array<[string, RegExp]> = [
  ['4K', /\b(4k|2160p|uhd)\b/i],
  ['2160p', /\b2160p\b/i],
  ['1080p', /\b1080p|fhd\b/i],
  ['720p', /\b720p\b/i],
  ['HDR', /\bhdr10?\+?|hdr\b/i],
  ['DV', /\b(dv|dolby[ ._-]?vision)\b/i],
  ['Remux', /\bremux\b/i],
  ['BluRay', /\bblu[ ._-]?ray|bdrip|brrip\b/i],
  ['WEB-DL', /\bweb[ ._-]?(dl|rip)\b/i]
];

const VIDEO_EXTENSIONS = new Set([
  '.mkv',
  '.mp4',
  '.avi',
  '.mov',
  '.m4v',
  '.iso',
  '.ts',
  '.wmv',
  '.flv',
  '.mpeg',
  '.mpg'
]);

export function isVideoExtension(extension: string): boolean {
  return VIDEO_EXTENSIONS.has(extension.toLowerCase());
}

export function supportedVideoExtensions(): string[] {
  return [...VIDEO_EXTENSIONS].sort();
}

export function normalizeTitle(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' und ')
    .replace(/\bamerika\b/g, 'america')
    .replace(/\bvolume\b/g, 'vol')
    .replace(/\bvol\.?\s*(\d+)\b/g, 'vol $1')
    .replace(/\bii\b/g, '2')
    .replace(/\biii\b/g, '3')
    .replace(/\biv\b/g, '4')
    .replace(/\bv\b/g, '5')
    .replace(/\b(der|die|das|the|a|an)\b/g, ' ')
    .replace(/['"`´]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildLocalTitleVariants(title: string): string[] {
  const variants = new Set<string>([title]);
  const normalized = normalizeTitle(title);

  if (normalized.endsWith(' 1')) {
    variants.add(normalized.replace(/\s+1$/, ''));
  }

  for (const alias of manualAliases(normalized)) {
    variants.add(alias);
  }

  return [...variants].filter(Boolean);
}

export function extractQuality(value: string): string[] {
  const found = new Set<string>();

  for (const [label, pattern] of QUALITY_PATTERNS) {
    if (pattern.test(value)) {
      found.add(label);
    }
  }

  return [...found];
}

export function parseInputList(text: string): string[] {
  return text
    .split(/[\r\n;]+/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function parseMediaName(rawName: string): ParsedQuery {
  const withoutExtension = rawName.replace(/\.[a-z0-9]{2,5}$/i, '');
  const yearMatch = withoutExtension.match(/\b(19\d{2}|20\d{2})\b/);
  const episodeMatch = withoutExtension.match(/\bS(\d{1,2})\s*E(\d{1,3})\b/i);
  const seasonMatch =
    episodeMatch ??
    withoutExtension.match(/\bS(?:taffel)?\s*(\d{1,2})\b/i) ??
    withoutExtension.match(/\bStaffel\s*(\d{1,2})\b/i);

  const season = seasonMatch ? Number(seasonMatch[1]) : null;
  const episode = episodeMatch ? Number(episodeMatch[2]) : null;
  const mediaType: MediaType = season || episode ? 'series' : 'movie';

  let title = withoutExtension
    .replace(/\[[^\]]*]/g, ' ')
    .replace(/\([^)]*?\b(1080p|720p|2160p|4k|hdr|web|bluray|remux)[^)]*?\)/gi, ' ')
    .replace(/\bS\d{1,2}\s*E\d{1,3}\b/gi, ' ')
    .replace(/\bS(?:taffel)?\s*\d{1,2}\b/gi, ' ')
    .replace(/\bStaffel\s*\d{1,2}\b/gi, ' ')
    .replace(/\b(19\d{2}|20\d{2})\b/g, ' ')
    .replace(/\b(2160p|1080p|720p|4k|uhd|hdr10?\+?|dv|dolby[ ._-]?vision|remux|blu[ ._-]?ray|bdrip|brrip|web[ ._-]?(dl|rip)|x264|x265|h264|h265|hevc|aac|dts|truehd|atmos)\b/gi, ' ')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!title) {
    title = withoutExtension.replace(/[._-]+/g, ' ').trim();
  }

  return {
    raw: rawName.trim(),
    title,
    titleNorm: normalizeTitle(title),
    year: yearMatch ? Number(yearMatch[1]) : null,
    mediaType,
    season,
    episode
  };
}

export function similarity(a: string, b: string): number {
  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return 1;
  }

  if (a.includes(b) || b.includes(a)) {
    return Math.min(0.92, Math.max(a.length, b.length) / Math.min(a.length, b.length) / 8 + 0.72);
  }

  const aPairs = bigrams(a);
  const bPairs = bigrams(b);
  const bCounts = new Map<string, number>();

  for (const pair of bPairs) {
    bCounts.set(pair, (bCounts.get(pair) ?? 0) + 1);
  }

  let intersection = 0;

  for (const pair of aPairs) {
    const count = bCounts.get(pair) ?? 0;
    if (count > 0) {
      intersection += 1;
      bCounts.set(pair, count - 1);
    }
  }

  return (2 * intersection) / (aPairs.length + bPairs.length);
}

function bigrams(value: string): string[] {
  const padded = ` ${value} `;
  const result: string[] = [];

  for (let index = 0; index < padded.length - 1; index += 1) {
    result.push(padded.slice(index, index + 2));
  }

  return result;
}

function manualAliases(normalized: string): string[] {
  const aliases: Record<string, string[]> = {
    'frozen 2': ['die eiskonigin 2', 'eiskonigin 2'],
    extraction: ['tyler rake extraction'],
    'captain america first avenger': ['captain america the first avenger', 'the first avenger'],
    'captain america winter soldier': ['captain america the winter soldier'],
    'guardians of galaxy vol 1': ['guardians of the galaxy vol 1', 'guardians galaxy vol 1'],
    'guardians of galaxy vol 2': ['guardians of the galaxy vol 2', 'guardians galaxy vol 2'],
    'avengers age of ultron': ['age of ultron'],
    'thor 1': ['thor'],
    'shang chi': ['shang chi and the legend of the ten rings', 'shang chi legend ten rings']
  };

  return aliases[normalized] ?? [];
}
