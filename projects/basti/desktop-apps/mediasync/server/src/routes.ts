import type { FastifyInstance } from 'fastify';
import type { RuntimeConfig } from './config';
import type { MediaDatabase } from './core/database';
import type { Indexer } from './indexer';
import { PLEX_SOURCE_PATH } from './indexer';
import { searchMedia } from './core/search';
import { validateTmdbKey } from './core/tmdb';
import { browse, isWithinRoots, listDisks } from './browse';
import { analyzeItemRecognition, applyRename, buildTargetFromMetadata, previewRename } from './rename';
import { moveItems } from './move';
import { getDetails, getEpisode, getSeason, searchMetadata, type SearchType } from './metadata';
import { getStatus as getPlexStatus, triggerRefresh } from './plex';
import {
  SESSION_COOKIE,
  checkPassword,
  createSessionToken,
  isValidSession,
  sessionCookieOptions
} from './auth';
import type {
  AppSettings,
  AuthState,
  MetadataTargetRequest,
  MoveRequest,
  NewMediaSource,
  RenameApplyRequest,
  RenamePreviewRequest,
  SearchRequest,
  SourceUpdate
} from './core/types';

interface RouteDeps {
  db: MediaDatabase;
  indexer: Indexer;
  config: RuntimeConfig;
}

export async function registerRoutes(app: FastifyInstance, deps: RouteDeps): Promise<void> {
  const { db, indexer, config } = deps;

  // --- Auth gate for every /api route except login + auth-state -------------
  app.addHook('preHandler', async (request, reply) => {
    if (!config.authEnabled) {
      return;
    }
    const path = request.url.split('?')[0];
    if (!path.startsWith('/api/') || path === '/api/login' || path === '/api/auth') {
      return;
    }
    if (!isValidSession(config, request.cookies[SESSION_COOKIE])) {
      reply.code(401).send({ error: 'Nicht angemeldet.' });
    }
  });

  app.get('/api/auth', async (request): Promise<AuthState> => ({
    authenticated: isValidSession(config, request.cookies[SESSION_COOKIE]),
    required: config.authEnabled
  }));

  app.post('/api/login', async (request, reply): Promise<AuthState> => {
    const { password } = (request.body ?? {}) as { password?: string };
    if (!checkPassword(config, password ?? '')) {
      reply.code(401);
      return { authenticated: false, required: config.authEnabled };
    }
    reply.setCookie(SESSION_COOKIE, createSessionToken(config), sessionCookieOptions);
    return { authenticated: true, required: config.authEnabled };
  });

  app.post('/api/logout', async (_request, reply): Promise<{ ok: true }> => {
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  // --- Sources --------------------------------------------------------------
  app.get('/api/sources', async () => {
    const settings = db.getSettings();
    const plexConfigured = Boolean(settings.plexUrl.trim() && settings.plexToken.trim());
    return db.getSources().map((source) =>
      source.path === PLEX_SOURCE_PATH ? { ...source, reachable: plexConfigured } : source
    );
  });

  app.post('/api/sources', async (request, reply) => {
    const body = request.body as NewMediaSource;
    if (!body?.path || !isWithinRoots(body.path, config.mediaRoots)) {
      reply.code(400);
      return { error: `Pfad muss innerhalb der Medien-Roots liegen (${config.mediaRoots.join(', ')}).` };
    }
    return db.addSource({ name: body.name || body.path, path: body.path, kind: body.kind });
  });

  app.patch('/api/sources/:id', async (request) => {
    const id = Number((request.params as { id: string }).id);
    return db.updateSource(id, request.body as SourceUpdate);
  });

  app.delete('/api/sources/:id', async (request) => {
    const id = Number((request.params as { id: string }).id);
    db.removeSource(id);
    return db.getSources();
  });

  app.post('/api/sources/:id/rebuild', async (request) => {
    const id = Number((request.params as { id: string }).id);
    return indexer.rebuildOne(id);
  });

  // --- Index ----------------------------------------------------------------
  app.get('/api/index', async () => indexer.getStatus());

  app.post('/api/index/rebuild', async () => indexer.rebuildActive());

  app.get('/api/index/stream', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    const unsubscribe = indexer.subscribe((progress) => {
      reply.raw.write(`data: ${JSON.stringify(progress)}\n\n`);
    });
    request.raw.on('close', unsubscribe);
  });

  // --- Search ---------------------------------------------------------------
  app.post('/api/search', async (request) => {
    const body = request.body as SearchRequest;
    const activeSources = db.getSources().filter((source) => source.active);
    return searchMedia(body, db.getItems({ activeOnly: true }), db.getSettings(), {
      activeSources,
      allItems: db.getItems()
    });
  });

  // --- Settings -------------------------------------------------------------
  app.get('/api/settings', async () => db.getSettings());

  app.put('/api/settings', async (request) => {
    const saved = db.saveSettings(request.body as AppSettings);
    indexer.ensurePlexSource();
    return saved;
  });

  app.post('/api/tmdb/validate', async (request) => {
    const { key } = (request.body ?? {}) as { key?: string };
    // Wrap in an object: a bare string is sent as text/plain and breaks the
    // frontend's response.json() ("Unexpected token ... is not valid JSON").
    return { status: await validateTmdbKey(key ?? '') };
  });

  // Test the saved key server-side (like Plex "Verbindung testen") so the
  // result never depends on a possibly autofilled input field.
  app.post('/api/tmdb/test', async () => {
    return { status: await validateTmdbKey(db.getSettings().tmdbKey) };
  });

  // --- TMDb metadata (online search, seasons, episodes) ---------------------
  app.post('/api/metadata/search', async (request) => {
    const { query, type, year } = (request.body ?? {}) as {
      query?: string;
      type?: SearchType;
      year?: number;
    };
    return searchMetadata(query ?? '', type ?? 'auto', db.getSettings().tmdbKey, year ?? null);
  });

  app.get('/api/metadata/details', async (request) => {
    const { id, type } = request.query as { id?: string; type?: string };
    return getDetails(Number(id), type === 'tv' ? 'tv' : 'movie', db.getSettings().tmdbKey);
  });

  app.get('/api/metadata/season', async (request) => {
    const { tvId, season } = request.query as { tvId?: string; season?: string };
    return getSeason(Number(tvId), Number(season), db.getSettings().tmdbKey);
  });

  app.get('/api/metadata/episode', async (request) => {
    const { tvId, season, episode } = request.query as { tvId?: string; season?: string; episode?: string };
    return getEpisode(Number(tvId), Number(season), Number(episode), db.getSettings().tmdbKey);
  });

  // --- Library: all locally-scanned items with recognition status -----------
  app.get('/api/items', async (request) => {
    const { filter } = request.query as { filter?: string };
    const plexSource = db.getSources().find((source) => source.path === PLEX_SOURCE_PATH);
    const entries = db
      .getItems()
      .filter((item) => item.sourceId !== plexSource?.id)
      .map((item) => ({ ...item, recognition: analyzeItemRecognition(item) }));

    switch (filter) {
      case 'unrecognized':
        return entries.filter((entry) => !entry.recognition.recognized);
      case 'movie':
        return entries.filter((entry) => entry.recognition.mediaType === 'movie');
      case 'series':
        return entries.filter((entry) => entry.recognition.mediaType === 'series');
      default:
        return entries;
    }
  });

  // --- Browser + disks ------------------------------------------------------
  app.get('/api/browse', async (request) => {
    const { path } = request.query as { path?: string };
    return browse(path, config.mediaRoots);
  });

  app.get('/api/disks', async () => listDisks(config.mediaRoots));

  // --- Rename ---------------------------------------------------------------
  app.post('/api/rename/preview', async (request) => {
    return previewRename(request.body as RenamePreviewRequest);
  });

  app.post('/api/rename/apply', async (request) => {
    const body = request.body as RenameApplyRequest;
    const result = await applyRename(body);
    if (body.refreshPlex) {
      const settings = db.getSettings();
      await triggerRefresh(settings.plexUrl, settings.plexToken);
    }
    return result;
  });

  // Recompute a target from a confirmed TMDb match (title/season/episode).
  app.post('/api/rename/from-metadata', async (request) => {
    return buildTargetFromMetadata(request.body as MetadataTargetRequest);
  });

  // --- Move / copy ----------------------------------------------------------
  app.post('/api/move', async (request, reply) => {
    const body = request.body as MoveRequest;
    if (!body?.targetDir || !isWithinRoots(body.targetDir, config.mediaRoots)) {
      reply.code(400);
      return { error: `Ziel muss innerhalb der Medien-Roots liegen (${config.mediaRoots.join(', ')}).` };
    }
    const result = await moveItems(body);
    if (body.refreshPlex) {
      const settings = db.getSettings();
      await triggerRefresh(settings.plexUrl, settings.plexToken);
    }
    return result;
  });

  // --- Plex -----------------------------------------------------------------
  app.get('/api/plex/libraries', async () => {
    const settings = db.getSettings();
    return getPlexStatus(settings.plexUrl, settings.plexToken);
  });

  app.post('/api/plex/refresh', async () => {
    const settings = db.getSettings();
    return triggerRefresh(settings.plexUrl, settings.plexToken);
  });
}
