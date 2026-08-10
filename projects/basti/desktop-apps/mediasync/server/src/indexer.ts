import type { MediaDatabase } from './core/database';
import { scanSource } from './core/scanner';
import { getPlexItems } from './plex';
import type { IndexStatus, MediaItem, MediaSource, ScanProgress } from './core/types';

export const PLEX_SOURCE_PATH = 'plex-api://library';
export const PLEX_SOURCE_NAME = 'Plex (API)';

export class Indexer {
  private progress: ScanProgress = { isIndexing: false, currentPath: null, indexedThisRun: 0 };
  private subscribers = new Set<(progress: ScanProgress) => void>();

  constructor(private db: MediaDatabase) {}

  subscribe(listener: (progress: ScanProgress) => void): () => void {
    this.subscribers.add(listener);
    listener(this.progress);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.subscribers) {
      listener(this.progress);
    }
  }

  getStatus(): IndexStatus {
    return this.db.getStatus(this.progress.isIndexing, this.progress.currentPath, this.progress.indexedThisRun);
  }

  /** Create or remove the managed Plex source depending on whether Plex is configured. */
  ensurePlexSource(): MediaSource | null {
    const settings = this.db.getSettings();
    const configured = Boolean(settings.plexUrl.trim() && settings.plexToken.trim());
    const existing = this.db.getSources().find((source) => source.path === PLEX_SOURCE_PATH) ?? null;

    if (configured) {
      return existing ?? this.db.addSource({ name: PLEX_SOURCE_NAME, path: PLEX_SOURCE_PATH, kind: 'plex' });
    }

    if (existing) {
      this.db.removeSource(existing.id);
    }
    return null;
  }

  private async scanOne(source: MediaSource): Promise<Omit<MediaItem, 'id'>[]> {
    if (source.path === PLEX_SOURCE_PATH) {
      const settings = this.db.getSettings();
      return getPlexItems(settings.plexUrl, settings.plexToken, source.id, (path, indexed) => {
        this.progress.currentPath = path;
        this.progress.indexedThisRun = indexed;
        this.notify();
      });
    }

    return scanSource(source, (path, indexed) => {
      this.progress.currentPath = path;
      this.progress.indexedThisRun = indexed;
      this.notify();
    });
  }

  async rebuild(sources: MediaSource[]): Promise<IndexStatus> {
    if (this.progress.isIndexing) {
      return this.getStatus();
    }

    this.progress = { isIndexing: true, currentPath: null, indexedThisRun: 0 };
    this.notify();

    try {
      for (const source of sources) {
        this.progress.currentPath = source.path;
        this.notify();
        try {
          const items = await this.scanOne(source);
          this.db.replaceSourceItems(source.id, items);
          this.progress.indexedThisRun += items.length;
        } catch (error) {
          this.db.markSourceError(source.id, error instanceof Error ? error.message : String(error));
        }
        this.notify();
      }
    } finally {
      this.progress = {
        isIndexing: false,
        currentPath: null,
        indexedThisRun: this.progress.indexedThisRun
      };
      this.notify();
    }

    return this.getStatus();
  }

  async rebuildActive(): Promise<IndexStatus> {
    this.ensurePlexSource();
    return this.rebuild(this.db.getSources().filter((source) => source.active));
  }

  async rebuildOne(id: number): Promise<IndexStatus> {
    const source = this.db.getSource(id);
    if (!source) {
      throw new Error('Quelle nicht gefunden.');
    }
    return this.rebuild([source]);
  }

  async rebuildQuickScan(): Promise<void> {
    this.ensurePlexSource();
    const sources = this.db.getSources().filter((source) => source.active && source.quickScanOnStart);
    if (sources.length > 0) {
      await this.rebuild(sources);
    }
  }
}
