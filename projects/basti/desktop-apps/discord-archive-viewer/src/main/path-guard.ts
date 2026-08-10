import * as path from 'node:path';
import * as fs from 'node:fs';
import type { FolderEntry } from '../shared/types';

export function isPathInsideAny(target: string, registeredFolders: FolderEntry[]): boolean {
  if (!target) return false;
  let resolved: string;
  try {
    resolved = path.resolve(target);
    if (fs.existsSync(resolved)) {
      try {
        resolved = fs.realpathSync(resolved);
      } catch {
        // Falls realpath fehlschlägt, mit resolve weitermachen
      }
    }
  } catch {
    return false;
  }
  for (const folder of registeredFolders) {
    let base: string;
    try {
      base = path.resolve(folder.path);
      if (fs.existsSync(base)) {
        try {
          base = fs.realpathSync(base);
        } catch {
          // ignore
        }
      }
    } catch {
      continue;
    }
    const normalizedBase = base.endsWith(path.sep) ? base : base + path.sep;
    const normalizedTarget = resolved.endsWith(path.sep) ? resolved : resolved + path.sep;
    if (normalizedTarget.startsWith(normalizedBase) || resolved === base) {
      return true;
    }
  }
  return false;
}
