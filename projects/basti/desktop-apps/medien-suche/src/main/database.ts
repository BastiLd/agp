import initSqlJs, {
  type Database as SqlDatabase,
  type SqlJsStatic,
  type SqlValue
} from 'sql.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type {
  AppSettings,
  IndexStatus,
  MediaItem,
  MediaSource,
  NewMediaSource,
  SourceUpdate,
  SourceKind
} from '../shared/types';

interface MediaRow {
  id: number;
  path: string;
  name: string;
  itemType: 'file' | 'folder';
  extension: string | null;
  size: number;
  mtimeMs: number;
  sourceId: number;
  sourceKind: SourceKind;
  title: string;
  titleNorm: string;
  year: number | null;
  mediaType: MediaItem['mediaType'];
  season: number | null;
  episode: number | null;
  qualityJson: string;
}

interface SourceRow {
  id: number;
  name: string;
  path: string;
  kind: SourceKind;
  active: number;
  liveWatch: number;
  quickScanOnStart: number;
  lastIndexedAt: string | null;
  lastError: string | null;
  itemCount: number;
  createdAt: string;
}

export class MediaDatabase {
  private constructor(
    private db: SqlDatabase,
    private dbPath: string
  ) {}

  static async create(dbPath: string): Promise<MediaDatabase> {
    mkdirSync(dirname(dbPath), { recursive: true });
    const SQL = await loadSqlJs();
    const db = existsSync(dbPath)
      ? new SQL.Database(readFileSync(dbPath))
      : new SQL.Database();
    const mediaDb = new MediaDatabase(db, dbPath);
    mediaDb.migrate();
    mediaDb.persist();
    return mediaDb;
  }

  getSources(): MediaSource[] {
    return this.queryAll<SourceRow>(`
      SELECT
        sources.id,
        sources.name,
        sources.path,
        sources.kind,
        sources.active,
        sources.liveWatch,
        sources.quickScanOnStart,
        sources.lastIndexedAt,
        sources.lastError,
        sources.createdAt,
        COUNT(media_items.id) AS itemCount
      FROM sources
      LEFT JOIN media_items ON media_items.source_id = sources.id
      GROUP BY sources.id
      ORDER BY sources.kind, sources.name
    `).map(rowToSource);
  }

  getSource(id: number): MediaSource | null {
    return this.getSources().find((source) => source.id === id) ?? null;
  }

  addSource(source: NewMediaSource): MediaSource {
    this.db.run('INSERT OR IGNORE INTO sources (name, path, kind, active, liveWatch, quickScanOnStart, createdAt) VALUES (?, ?, ?, 1, 0, 0, ?)', [
      source.name,
      source.path,
      source.kind,
      new Date().toISOString()
    ]);
    this.persist();

    const found = this.getSources().find((existing) => existing.path === source.path);
    if (!found) {
      throw new Error(`Quelle konnte nicht gespeichert werden: ${source.path}`);
    }
    return found;
  }

  updateSource(id: number, patch: SourceUpdate): MediaSource {
    const current = this.getSource(id);
    if (!current) {
      throw new Error(`Quelle nicht gefunden: ${id}`);
    }

    this.db.run(
      `
      UPDATE sources
      SET name = ?, kind = ?, active = ?, liveWatch = ?, quickScanOnStart = ?
      WHERE id = ?
      `,
      [
        patch.name ?? current.name,
        patch.kind ?? current.kind,
        boolToInt(patch.active ?? current.active),
        boolToInt(patch.liveWatch ?? current.liveWatch),
        boolToInt(patch.quickScanOnStart ?? current.quickScanOnStart),
        id
      ]
    );
    this.persist();

    const updated = this.getSource(id);
    if (!updated) {
      throw new Error(`Quelle nicht gefunden: ${id}`);
    }
    return updated;
  }

  removeSource(id: number): void {
    this.db.run('DELETE FROM media_items WHERE source_id = ?', [id]);
    this.db.run('DELETE FROM sources WHERE id = ?', [id]);
    this.setSetting('lastIndexedAt', new Date().toISOString(), false);
    this.persist();
  }

  clearIndex(): void {
    this.db.run('DELETE FROM media_items');
    this.persist();
  }

  replaceSourceItems(sourceId: number, items: Omit<MediaItem, 'id'>[]): void {
    this.db.run('BEGIN TRANSACTION');

    try {
      this.db.run('DELETE FROM media_items WHERE source_id = ?', [sourceId]);
      const insert = this.db.prepare(`
        INSERT INTO media_items (
          path, name, item_type, extension, size, mtime_ms, source_id, source_kind,
          title, title_norm, year, media_type, season, episode, quality_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        insert.run([
          item.path,
          item.name,
          item.itemType,
          item.extension,
          item.size,
          item.mtimeMs,
          item.sourceId,
          item.sourceKind,
          item.title,
          item.titleNorm,
          item.year,
          item.mediaType,
          item.season,
          item.episode,
          JSON.stringify(item.quality)
        ]);
      }

      insert.free();
      this.db.run('UPDATE sources SET lastIndexedAt = ?, lastError = NULL WHERE id = ?', [
        new Date().toISOString(),
        sourceId
      ]);
      this.setSetting('lastIndexedAt', new Date().toISOString(), false);
      this.db.run('COMMIT');
      this.persist();
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    }
  }

  markSourceError(sourceId: number, message: string): void {
    this.db.run('UPDATE sources SET lastError = ? WHERE id = ?', [message, sourceId]);
    this.persist();
  }

  getItems(options: { activeOnly?: boolean } = {}): MediaItem[] {
    return this.queryAll<MediaRow>(`
      SELECT
        media_items.id,
        media_items.path,
        media_items.name,
        media_items.item_type AS itemType,
        media_items.extension,
        media_items.size,
        media_items.mtime_ms AS mtimeMs,
        media_items.source_id AS sourceId,
        media_items.source_kind AS sourceKind,
        media_items.title,
        media_items.title_norm AS titleNorm,
        media_items.year,
        media_items.media_type AS mediaType,
        media_items.season,
        media_items.episode,
        media_items.quality_json AS qualityJson
      FROM media_items
      JOIN sources ON sources.id = media_items.source_id
      ${options.activeOnly ? 'WHERE sources.active = 1' : ''}
    `).map(rowToMediaItem);
  }

  getStatus(isIndexing = false, currentPath: string | null = null, indexedThisRun = 0): IndexStatus {
    const row = this.queryOne<{ itemCount: number }>('SELECT COUNT(*) AS itemCount FROM media_items');

    return {
      itemCount: row.itemCount,
      sourceCount: this.getSources().length,
      lastIndexedAt: this.getSetting('lastIndexedAt') || null,
      isIndexing,
      currentPath,
      indexedThisRun
    };
  }

  getSettings(): AppSettings {
    return {
      tmdbKey: this.getSetting('tmdbKey'),
      matchStrictness: parseNumberSetting(this.getSetting('matchStrictness'), 86),
      collections: parseJsonArray(this.getSetting('collections')),
      manualAliases: parseJsonArray(this.getSetting('manualAliases'))
    };
  }

  saveSettings(settings: AppSettings): AppSettings {
    this.setSetting('tmdbKey', settings.tmdbKey.trim());
    this.setSetting('matchStrictness', String(clampNumber(settings.matchStrictness, 0, 100)));
    this.setSetting('collections', JSON.stringify(settings.collections ?? []));
    this.setSetting('manualAliases', JSON.stringify(settings.manualAliases ?? []));
    return this.getSettings();
  }

  getSetting(key: string): string {
    const row = this.queryOptional<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
    return row?.value ?? '';
  }

  setSetting(key: string, value: string, shouldPersist = true): void {
    this.db.run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value]
    );

    if (shouldPersist) {
      this.persist();
    }
  }

  close(): void {
    this.persist();
    this.db.close();
  }

  private migrate(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        kind TEXT NOT NULL CHECK(kind IN ('plex', 'pc', 'usb', 'other')),
        active INTEGER NOT NULL DEFAULT 1,
        liveWatch INTEGER NOT NULL DEFAULT 0,
        quickScanOnStart INTEGER NOT NULL DEFAULT 0,
        lastIndexedAt TEXT,
        lastError TEXT,
        createdAt TEXT NOT NULL
      );
    `);
    this.addColumnIfMissing('sources', 'active', 'INTEGER NOT NULL DEFAULT 1');
    this.addColumnIfMissing('sources', 'liveWatch', 'INTEGER NOT NULL DEFAULT 0');
    this.addColumnIfMissing('sources', 'quickScanOnStart', 'INTEGER NOT NULL DEFAULT 0');
    this.addColumnIfMissing('sources', 'lastIndexedAt', 'TEXT');
    this.addColumnIfMissing('sources', 'lastError', 'TEXT');
    this.db.run(`
      CREATE TABLE IF NOT EXISTS media_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        name TEXT NOT NULL,
        item_type TEXT NOT NULL CHECK(item_type IN ('file', 'folder')),
        extension TEXT,
        size INTEGER NOT NULL,
        mtime_ms REAL NOT NULL,
        source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
        source_kind TEXT NOT NULL,
        title TEXT NOT NULL,
        title_norm TEXT NOT NULL,
        year INTEGER,
        media_type TEXT NOT NULL,
        season INTEGER,
        episode INTEGER,
        quality_json TEXT NOT NULL
      );
    `);
    this.db.run('CREATE INDEX IF NOT EXISTS idx_media_title_norm ON media_items(title_norm)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_media_source_kind ON media_items(source_kind)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_media_series ON media_items(media_type, season, episode)');
    this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  private persist(): void {
    writeFileSync(this.dbPath, Buffer.from(this.db.export()));
  }

  private addColumnIfMissing(table: string, column: string, definition: string): void {
    const columns = this.queryAll<{ name: string }>(`PRAGMA table_info(${table})`);
    if (!columns.some((entry) => entry.name === column)) {
      this.db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  private queryAll<T extends object>(sql: string, params: SqlValue[] = []): T[] {
    const statement = this.db.prepare(sql);
    statement.bind(params);
    const rows: T[] = [];

    while (statement.step()) {
      rows.push(statement.getAsObject() as T);
    }

    statement.free();
    return rows;
  }

  private queryOne<T extends object>(sql: string, params: SqlValue[] = []): T {
    const row = this.queryOptional<T>(sql, params);
    if (!row) {
      throw new Error(`Keine Daten gefunden: ${sql}`);
    }
    return row;
  }

  private queryOptional<T extends object>(sql: string, params: SqlValue[] = []): T | null {
    return this.queryAll<T>(sql, params)[0] ?? null;
  }
}

function rowToMediaItem(row: MediaRow): MediaItem {
  return {
    id: Number(row.id),
    path: row.path,
    name: row.name,
    itemType: row.itemType,
    extension: row.extension,
    size: Number(row.size),
    mtimeMs: Number(row.mtimeMs),
    sourceId: Number(row.sourceId),
    sourceKind: row.sourceKind,
    title: row.title,
    titleNorm: row.titleNorm,
    year: row.year === null ? null : Number(row.year),
    mediaType: row.mediaType,
    season: row.season === null ? null : Number(row.season),
    episode: row.episode === null ? null : Number(row.episode),
    quality: JSON.parse(row.qualityJson) as string[]
  };
}

function rowToSource(row: SourceRow): MediaSource {
  return {
    id: Number(row.id),
    name: row.name,
    path: row.path,
    kind: row.kind,
    active: Boolean(row.active),
    liveWatch: Boolean(row.liveWatch),
    quickScanOnStart: Boolean(row.quickScanOnStart),
    lastIndexedAt: row.lastIndexedAt,
    lastError: row.lastError,
    itemCount: Number(row.itemCount),
    reachable: existsSync(row.path),
    createdAt: row.createdAt
  };
}

function boolToInt(value: boolean): number {
  return value ? 1 : 0;
}

function parseJsonArray(value: string) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseNumberSetting(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

async function loadSqlJs(): Promise<SqlJsStatic> {
  const wasmDirectory = join(process.cwd(), 'node_modules', 'sql.js', 'dist');
  return initSqlJs({
    locateFile: (file) => join(wasmDirectory, file)
  });
}
