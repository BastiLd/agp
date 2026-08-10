import { constants } from 'node:fs';
import { access, readdir, stat, statfs } from 'node:fs/promises';
import { basename, dirname, resolve, sep } from 'node:path';
import { isVideoExtension } from './core/media';
import type { BrowseEntry, BrowseResult, DiskTarget } from './core/types';

/** True if `target` is one of the roots or lives inside one of them. */
export function isWithinRoots(target: string, roots: string[]): boolean {
  const resolved = resolve(target);
  return roots.some((root) => {
    // Strip a trailing separator so drive roots ("D:\") and "/media/" both work.
    const base = resolve(root).replace(/[\\/]+$/, '');
    return resolved === base || resolved === base + sep || resolved.startsWith(base + sep);
  });
}

async function isWritable(target: string): Promise<boolean> {
  try {
    await access(target, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/** List directories (and video files) under a path, restricted to the allowed roots. */
export async function browse(inputPath: string | undefined, roots: string[]): Promise<BrowseResult> {
  // No path → synthetic listing of the configured media roots.
  if (!inputPath) {
    const entries: BrowseEntry[] = [];
    for (const root of roots) {
      try {
        const info = await stat(root);
        if (info.isDirectory()) {
          entries.push({ name: root, path: resolve(root), isDirectory: true });
        }
      } catch {
        // root not mounted – skip silently
      }
    }
    return { path: '', parent: null, entries, error: null };
  }

  const target = resolve(inputPath);
  if (!isWithinRoots(target, roots)) {
    return { path: target, parent: null, entries: [], error: 'Pfad liegt außerhalb der erlaubten Medien-Roots.' };
  }

  try {
    const dirEntries = await readdir(target, { withFileTypes: true });
    const entries: BrowseEntry[] = dirEntries
      .filter((entry) => entry.isDirectory() || (entry.isFile() && isVideoExtension(entry.name.slice(entry.name.lastIndexOf('.')))))
      .map((entry) => ({
        name: entry.name,
        path: resolve(target, entry.name),
        isDirectory: entry.isDirectory()
      }))
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name, 'de');
      });

    const parent = isWithinRoots(dirname(target), roots) && dirname(target) !== target ? dirname(target) : null;
    return { path: target, parent, entries, error: null };
  } catch (error) {
    return { path: target, parent: null, entries: [], error: error instanceof Error ? error.message : String(error) };
  }
}

/** Disk usage + writability for each mounted media root (move targets). */
export async function listDisks(roots: string[]): Promise<DiskTarget[]> {
  const disks: DiskTarget[] = [];

  for (const root of roots) {
    try {
      const stats = await statfs(root);
      const total = stats.blocks * stats.bsize;
      const free = stats.bavail * stats.bsize;
      disks.push({
        path: resolve(root),
        label: basename(resolve(root)) || resolve(root),
        total,
        free,
        writable: await isWritable(root)
      });
    } catch {
      // not mounted – skip
    }
  }

  return disks;
}
