import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

const MEDIA_SUBDIRS = [
  '',
  'assets',
  'media',
  'images',
  'attachments',
  'files',
];

function looksLikeRemote(url: string) {
  return /^https?:\/\//i.test(url);
}

function decodeSafe(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function basename(p: string) {
  const cleaned = p.split('?')[0].split('#')[0];
  const idx = Math.max(cleaned.lastIndexOf('/'), cleaned.lastIndexOf('\\'));
  return idx >= 0 ? cleaned.slice(idx + 1) : cleaned;
}

/**
 * Versucht, eine Attachment-URL aus dem Export einer lokalen Datei zuzuordnen.
 * Strategie:
 *  1. Wenn url ein absoluter Pfad ist und existiert → diesen nehmen.
 *  2. Wenn url relativ zu folderPath aufgelöst werden kann → diesen nehmen.
 *  3. Sonst nach Dateiname (basename) in folderPath/assets/media/... suchen.
 *  4. Als Fallback rekursive Suche bis Tiefe 4.
 */
export function resolveLocalAttachment(
  channelFolder: string,
  attachmentUrlOrName: string,
): { absolutePath: string | null; exists: boolean } {
  if (!attachmentUrlOrName) return { absolutePath: null, exists: false };

  const decoded = decodeSafe(attachmentUrlOrName);

  // 1. absoluter Pfad?
  if (path.isAbsolute(decoded)) {
    if (fs.existsSync(decoded)) return { absolutePath: decoded, exists: true };
  }

  // 2. relativ zum channelFolder
  if (!looksLikeRemote(decoded)) {
    const candidate = path.resolve(channelFolder, decoded);
    if (fs.existsSync(candidate)) return { absolutePath: candidate, exists: true };
  }

  // 3. nach basename in bekannten Unterordnern
  const wanted = basename(decoded);
  if (!wanted) return { absolutePath: null, exists: false };

  for (const sub of MEDIA_SUBDIRS) {
    const dir = sub ? path.join(channelFolder, sub) : channelFolder;
    if (!fs.existsSync(dir)) continue;
    try {
      const direct = path.join(dir, wanted);
      if (fs.existsSync(direct)) return { absolutePath: direct, exists: true };
    } catch {
      // ignore
    }
  }

  // 4. flache rekursive Suche bis Tiefe 4
  const found = searchByName(channelFolder, wanted, 4);
  if (found) return { absolutePath: found, exists: true };

  return { absolutePath: null, exists: false };
}

function searchByName(root: string, fileName: string, depth: number): string | null {
  if (depth < 0) return null;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const e of entries) {
    if (e.isFile() && e.name === fileName) return path.join(root, e.name);
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      const r = searchByName(path.join(root, e.name), fileName, depth - 1);
      if (r) return r;
    }
  }
  return null;
}

export function toFileUrl(absolutePath: string): string {
  return pathToFileURL(absolutePath).toString();
}
