import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { loadConfig } from './config';
import { MediaDatabase } from './core/database';
import { Indexer } from './indexer';
import { registerRoutes } from './routes';
import type { AppSettings } from './core/types';

const here = dirname(fileURLToPath(import.meta.url));

/** Seed empty settings fields from environment variables on first run. */
function seedSettings(db: MediaDatabase, seed: ReturnType<typeof loadConfig>['seed']): void {
  const current = db.getSettings();
  const next: AppSettings = { ...current };
  let changed = false;

  const fields: Array<keyof typeof seed> = ['tmdbKey', 'plexUrl', 'plexToken', 'moviesRoot', 'seriesRoot'];
  for (const field of fields) {
    if (!current[field] && seed[field]) {
      next[field] = seed[field];
      changed = true;
    }
  }

  if (changed) {
    db.saveSettings(next);
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const db = await MediaDatabase.create(config.dbPath);
  seedSettings(db, config.seed);

  const indexer = new Indexer(db);
  indexer.ensurePlexSource();

  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' }, bodyLimit: 5 * 1024 * 1024 });
  await app.register(cookie);
  await registerRoutes(app, { db, indexer, config });

  // Serve the built web frontend (skipped during local dev when not present).
  const webDir = process.env.WEB_DIR ? resolve(process.env.WEB_DIR) : join(here, 'public');
  if (existsSync(join(webDir, 'index.html'))) {
    await app.register(fastifyStatic, { root: webDir, prefix: '/' });
    app.setNotFoundHandler((request, reply) => {
      if (request.method === 'GET' && !request.url.startsWith('/api/')) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ error: 'Not found' });
    });
  } else {
    app.log.warn(`Web-Build nicht gefunden unter ${webDir} – nur API aktiv.`);
  }

  // Quick-scan configured sources in the background after start.
  void indexer.rebuildQuickScan().catch((error) => app.log.error(error));

  await app.listen({ port: config.port, host: config.host });
  app.log.info(`MediaSync läuft auf http://${config.host}:${config.port} (Auth: ${config.authEnabled ? 'an' : 'aus'})`);

  const shutdown = async (): Promise<void> => {
    await app.close();
    db.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  console.error('MediaSync konnte nicht starten:', error);
  process.exit(1);
});
