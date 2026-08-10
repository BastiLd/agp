import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  shell,
  type OpenDialogOptions
} from 'electron';
import { existsSync, type FSWatcher, watch } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { MediaDatabase } from './database';
import { scanSource } from './scanner';
import { searchMedia } from './search';
import { validateTmdbKey } from './tmdb';
import type { AppSettings, FileAction, NewMediaSource, ScanProgress, SourceUpdate } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let database: MediaDatabase;
let scanProgress: ScanProgress = {
  isIndexing: false,
  currentPath: null,
  indexedThisRun: 0
};

const watchers = new Map<number, FSWatcher>();
const reindexTimers = new Map<number, NodeJS.Timeout>();
const isDev = Boolean(process.env.ELECTRON_RENDERER_URL);

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 740,
    title: 'Medien Suche',
    backgroundColor: '#f6f4ef',
    webPreferences: {
      preload: getPreloadPath(),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function getPreloadPath(): string {
  const mjsPath = join(__dirname, '../preload/index.mjs');
  const jsPath = join(__dirname, '../preload/index.js');
  return existsSync(mjsPath) ? mjsPath : jsPath;
}

app.whenReady().then(async () => {
  database = await MediaDatabase.create(join(app.getPath('userData'), 'media-index.db'));
  registerIpcHandlers();
  createWindow();
  syncWatchers();
  void rebuildQuickScanSources();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeWatchers();
  database?.close();
});

function registerIpcHandlers(): void {
  ipcMain.handle('sources:list', () => database.getSources());

  ipcMain.handle('sources:add', (_event, source: NewMediaSource) => {
    const created = database.addSource(source);
    syncWatchers();
    return created;
  });

  ipcMain.handle('sources:update', (_event, id: number, patch: SourceUpdate) => {
    const updated = database.updateSource(id, patch);
    syncWatchers();
    return updated;
  });

  ipcMain.handle('sources:remove', (_event, id: number) => {
    database.removeSource(id);
    syncWatchers();
    return database.getSources();
  });

  ipcMain.handle('dialog:pick-directory', async () => {
    const options: OpenDialogOptions = {
      properties: ['openDirectory', 'multiSelections'],
      title: 'Einen oder mehrere Medienordner auswählen'
    };
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options);

    return {
      canceled: result.canceled,
      path: result.filePaths[0] ?? null,
      paths: result.filePaths
    };
  });

  ipcMain.handle('index:status', () =>
    database.getStatus(scanProgress.isIndexing, scanProgress.currentPath, scanProgress.indexedThisRun)
  );

  ipcMain.handle('index:rebuild', async () => {
    return rebuildSources(database.getSources().filter((source) => source.active));
  });

  ipcMain.handle('index:rebuild-source', async (_event, id: number) => {
    const source = database.getSource(id);
    if (!source) {
      throw new Error('Quelle nicht gefunden.');
    }
    return rebuildSources([source]);
  });

  ipcMain.handle('file:action', async (_event, action: FileAction, targetPath: string) => {
    return performFileAction(action, targetPath);
  });

  ipcMain.handle('export:missing', async (_event, entries: string[], format: 'txt' | 'csv') => {
    const options = {
      title: 'Fehlende Titel exportieren',
      defaultPath: `fehlende-titel.${format}`,
      filters: [{ name: format === 'csv' ? 'CSV' : 'Text', extensions: [format] }]
    };
    const result = mainWindow
      ? await dialog.showSaveDialog(mainWindow, options)
      : await dialog.showSaveDialog(options);

    if (result.canceled || !result.filePath) {
      return { ok: false, message: 'Export abgebrochen.' };
    }

    const content =
      format === 'csv'
        ? ['Titel', ...entries].map((entry) => `"${entry.replace(/"/g, '""')}"`).join('\n')
        : entries.join('\n');
    await writeFile(result.filePath, content, 'utf8');
    return { ok: true, message: `Export gespeichert: ${result.filePath}` };
  });

  ipcMain.handle('search:media', async (_event, request) => {
    const activeSources = database.getSources().filter((source) => source.active);
    return searchMedia(request, database.getItems({ activeOnly: true }), database.getSettings(), {
      activeSources,
      allItems: database.getItems()
    });
  });

  ipcMain.handle('settings:get', () => database.getSettings());

  ipcMain.handle('settings:save', (_event, settings: AppSettings) => {
    return database.saveSettings(settings);
  });

  ipcMain.handle('tmdb:validate', (_event, key: string) => validateTmdbKey(key));
}

function notifyProgress(): void {
  mainWindow?.webContents.send('index:progress', scanProgress);
}

async function rebuildSources(sources: ReturnType<MediaDatabase['getSources']>) {
  if (scanProgress.isIndexing) {
    return database.getStatus(true, scanProgress.currentPath, scanProgress.indexedThisRun);
  }

  scanProgress = {
    isIndexing: true,
    currentPath: null,
    indexedThisRun: 0
  };
  notifyProgress();

  try {
    for (const source of sources) {
      scanProgress.currentPath = source.path;
      notifyProgress();

      try {
        const items = await scanSource(source, (path, indexed) => {
          scanProgress.currentPath = path;
          scanProgress.indexedThisRun = indexed;
          notifyProgress();
        });

        database.replaceSourceItems(source.id, items);
        scanProgress.indexedThisRun += items.length;
      } catch (error) {
        database.markSourceError(source.id, error instanceof Error ? error.message : String(error));
      }
      notifyProgress();
    }
  } finally {
    scanProgress = {
      isIndexing: false,
      currentPath: null,
      indexedThisRun: scanProgress.indexedThisRun
    };
    notifyProgress();
  }

  syncWatchers();
  return database.getStatus(false, null, scanProgress.indexedThisRun);
}

async function rebuildQuickScanSources(): Promise<void> {
  const sources = database.getSources().filter((source) => source.active && source.quickScanOnStart);
  if (sources.length > 0) {
    await rebuildSources(sources);
  }
}

function syncWatchers(): void {
  closeWatchers();

  for (const source of database.getSources()) {
    if (!source.active || !source.liveWatch || !source.reachable) {
      continue;
    }

    try {
      const watcher = watch(source.path, { recursive: true }, () => scheduleSourceRebuild(source.id));
      watchers.set(source.id, watcher);
    } catch (error) {
      database.markSourceError(source.id, error instanceof Error ? error.message : String(error));
    }
  }
}

function closeWatchers(): void {
  for (const watcher of watchers.values()) {
    watcher.close();
  }
  watchers.clear();

  for (const timer of reindexTimers.values()) {
    clearTimeout(timer);
  }
  reindexTimers.clear();
}

function scheduleSourceRebuild(id: number): void {
  const existing = reindexTimers.get(id);
  if (existing) {
    clearTimeout(existing);
  }

  reindexTimers.set(
    id,
    setTimeout(() => {
      reindexTimers.delete(id);
      const source = database.getSource(id);
      if (source?.active) {
        void rebuildSources([source]);
      }
    }, 2500)
  );
}

async function performFileAction(action: FileAction, targetPath: string) {
  try {
    if (action === 'copy-full-path') {
      clipboard.writeText(targetPath);
      return { ok: true, message: 'Pfad kopiert.' };
    }

    if (action === 'copy-name-path') {
      clipboard.writeText(`${targetPath.split(/[\\/]/).at(-1) ?? targetPath}\n${targetPath}`);
      return { ok: true, message: 'Name und Pfad kopiert.' };
    }

    if (action === 'show-in-folder') {
      shell.showItemInFolder(targetPath);
      return { ok: true, message: 'Im Explorer markiert.' };
    }

    const pathToOpen = action === 'open-folder' ? dirname(targetPath) : targetPath;
    const error = await shell.openPath(pathToOpen);

    if (error && action !== 'open-folder') {
      const fallback = await shell.openPath(dirname(targetPath));
      return {
        ok: !fallback,
        message: fallback || 'Datei konnte nicht direkt geöffnet werden, Ordner wurde geöffnet.'
      };
    }

    return { ok: !error, message: error || 'Geöffnet.' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
