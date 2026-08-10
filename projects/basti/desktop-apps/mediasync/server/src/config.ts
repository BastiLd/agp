import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export interface RuntimeConfig {
  port: number;
  host: string;
  configDir: string;
  dbPath: string;
  authEnabled: boolean;
  authPassword: string;
  sessionSecret: string;
  /** Roots the directory browser and move targets are restricted to. */
  mediaRoots: string[];
  /** Values seeded into the settings DB on first run (overridable in the UI). */
  seed: {
    tmdbKey: string;
    plexUrl: string;
    plexToken: string;
    moviesRoot: string;
    seriesRoot: string;
  };
}

function pickConfigDir(): string {
  const fromEnv = process.env.CONFIG_DIR?.trim();
  if (fromEnv) {
    return resolve(fromEnv);
  }
  // In the container /config is a mounted volume; locally fall back to ./data.
  return existsSync('/config') ? '/config' : resolve(process.cwd(), 'data');
}

function parseRoots(): string[] {
  const raw = process.env.MEDIA_ROOTS?.trim();
  const roots = (raw ? raw.split(',') : ['/media'])
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => resolve(entry));
  return [...new Set(roots)];
}

let cached: RuntimeConfig | null = null;

export function loadConfig(): RuntimeConfig {
  if (cached) {
    return cached;
  }

  const configDir = pickConfigDir();
  mkdirSync(configDir, { recursive: true });

  const authPassword = process.env.AUTH_PASSWORD?.trim() ?? '';
  const sessionSecret =
    process.env.SESSION_SECRET?.trim() || randomBytes(32).toString('hex');

  cached = {
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST?.trim() || '0.0.0.0',
    configDir,
    dbPath: join(configDir, 'media-index.db'),
    authEnabled: authPassword.length > 0,
    authPassword,
    sessionSecret,
    mediaRoots: parseRoots(),
    seed: {
      tmdbKey: process.env.TMDB_KEY?.trim() ?? '',
      plexUrl: process.env.PLEX_URL?.trim() ?? '',
      plexToken: process.env.PLEX_TOKEN?.trim() ?? '',
      moviesRoot: process.env.MOVIES_ROOT?.trim() ?? '',
      seriesRoot: process.env.SERIES_ROOT?.trim() ?? ''
    }
  };

  return cached;
}
