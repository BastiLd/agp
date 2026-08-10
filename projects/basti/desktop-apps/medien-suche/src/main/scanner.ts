import { opendir, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { extractQuality, isVideoExtension, parseMediaName } from '../shared/media';
import type { MediaItem, MediaSource } from '../shared/types';

export type ScanProgressCallback = (path: string, indexed: number) => void;

export async function scanSource(
  source: MediaSource,
  onProgress?: ScanProgressCallback
): Promise<Omit<MediaItem, 'id'>[]> {
  const items: Omit<MediaItem, 'id'>[] = [];

  await scanDirectory(source.path, source, items, onProgress);

  return items;
}

async function scanDirectory(
  directoryPath: string,
  source: MediaSource,
  items: Omit<MediaItem, 'id'>[],
  onProgress?: ScanProgressCallback
): Promise<void> {
  let directory;

  try {
    directory = await opendir(directoryPath);
  } catch {
    return;
  }

  const folderItem = await createFolderItem(directoryPath, source);
  if (folderItem) {
    items.push(folderItem);
  }

  for await (const entry of directory) {
    const childPath = join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      await scanDirectory(childPath, source, items, onProgress);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = extname(entry.name).toLowerCase();
    if (!isVideoExtension(extension)) {
      continue;
    }

    try {
      const fileStat = await stat(childPath);
      const parsed = parseMediaName(entry.name);

      items.push({
        path: childPath,
        name: entry.name,
        itemType: 'file',
        extension,
        size: fileStat.size,
        mtimeMs: fileStat.mtimeMs,
        sourceId: source.id,
        sourceKind: source.kind,
        title: parsed.title,
        titleNorm: parsed.titleNorm,
        year: parsed.year,
        mediaType: parsed.mediaType,
        season: parsed.season,
        episode: parsed.episode,
        quality: extractQuality(entry.name)
      });

      if (items.length % 50 === 0) {
        onProgress?.(childPath, items.length);
      }
    } catch {
      continue;
    }
  }
}

async function createFolderItem(
  folderPath: string,
  source: MediaSource
): Promise<Omit<MediaItem, 'id'> | null> {
  const name = basename(folderPath);
  if (!name || name === basename(source.path)) {
    return null;
  }

  const parsed = parseMediaName(name);
  if (!parsed.titleNorm || parsed.titleNorm.length < 3) {
    return null;
  }

  try {
    const folderStat = await stat(folderPath);
    return {
      path: folderPath,
      name,
      itemType: 'folder',
      extension: null,
      size: 0,
      mtimeMs: folderStat.mtimeMs,
      sourceId: source.id,
      sourceKind: source.kind,
      title: parsed.title,
      titleNorm: parsed.titleNorm,
      year: parsed.year,
      mediaType: parsed.mediaType,
      season: parsed.season,
      episode: parsed.episode,
      quality: extractQuality(name)
    };
  } catch {
    return null;
  }
}
