import { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SettingsStore } from './settings-store';
import { scanFolders, loadChannelMerged, shortHash } from './folder-scanner';
import { resolveLocalAttachment } from './media-resolver';
import { isPathInsideAny } from './path-guard';
import { generateHtmlForChannelModel } from './html-export';
import { generateWebsiteForChannels } from './website-export';
import { exportMarkdownForChannelModel } from './markdown-export';
import { IPC } from '../shared/types';
import type { AppSettings, ChannelModel, ChannelSourceRef, FolderEntry, ScanResult } from '../shared/types';

protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: false, corsEnabled: true } },
]);

let mainWindow: BrowserWindow | null = null;
const settings = new SettingsStore();
let lastScan: ScanResult | null = null;
const channelIndex: Map<string, ChannelSourceRef[]> = new Map();

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

function looksLikeRemoteUrl(u: string) { return /^(https?:|data:|blob:|file:)/i.test(u); }
function toMediaUrl(absolutePath: string) { return `media://localfile/?p=${encodeURIComponent(absolutePath)}`; }
function resolveUrlForRenderer(folderPath: string, raw: string): string {
  if (!raw) return '';
  if (looksLikeRemoteUrl(raw)) return raw;
  const r = resolveLocalAttachment(folderPath, raw);
  if (r.exists && r.absolutePath) return toMediaUrl(r.absolutePath);
  return raw;
}

function createWindow() {
  const bounds = settings.get().windowBounds;
  mainWindow = new BrowserWindow({
    width: bounds?.width ?? 1280, height: bounds?.height ?? 800,
    x: bounds?.x, y: bounds?.y,
    minWidth: 900, minHeight: 600,
    title: 'Discord Archive Viewer',
    backgroundColor: '#1e1f22',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.on('close', () => {
    if (!mainWindow) return;
    const b = mainWindow.getBounds();
    settings.setWindowBounds({ x: b.x, y: b.y, width: b.width, height: b.height });
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  if (VITE_DEV_SERVER_URL) mainWindow.loadURL(VITE_DEV_SERVER_URL);
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

function registerMediaProtocol() {
  protocol.handle('media', async (request) => {
    try {
      const url = new URL(request.url);
      const encoded = url.searchParams.get('p');
      if (!encoded) return new Response('Missing path', { status: 400 });
      const absolutePath = decodeURIComponent(encoded);
      const allowed = isPathInsideAny(absolutePath, settings.get().folders);
      if (!allowed) return new Response('Forbidden', { status: 403 });
      if (!fs.existsSync(absolutePath)) return new Response('Not found', { status: 404 });
      return net.fetch(pathToFileURL(absolutePath).toString());
    } catch (e: any) { return new Response(`Error: ${e?.message ?? e}`, { status: 500 }); }
  });
}

function sendScanProgress(p: any) { mainWindow?.webContents.send(IPC.ON_SCAN_PROGRESS, p); }

ipcMain.handle(IPC.PICK_CHANNEL_FOLDERS, async () => {
  if (!mainWindow) return { canceled: true };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Channel-Ordner auswählen',
    properties: ['openDirectory', 'multiSelections', 'dontAddToRecent'],
  });
  if (result.canceled || result.filePaths.length === 0) return { canceled: true };
  const entries: FolderEntry[] = result.filePaths.map((p) => ({
    id: shortHash(p), kind: 'channel', path: path.resolve(p), addedAt: new Date().toISOString(),
  }));
  for (const e of entries) settings.addFolder(e);
  return { folders: settings.get().folders.filter((f) => entries.some((e) => e.id === f.id)) };
});

ipcMain.handle(IPC.PICK_ROOT_FOLDER, async () => {
  if (!mainWindow) return { canceled: true };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Hauptordner auswählen',
    properties: ['openDirectory', 'dontAddToRecent'],
  });
  if (result.canceled || result.filePaths.length === 0) return { canceled: true };
  const p = path.resolve(result.filePaths[0]);
  const entry: FolderEntry = { id: shortHash(p), kind: 'root', path: p, addedAt: new Date().toISOString() };
  settings.addFolder(entry);
  return { folder: entry };
});

async function performScan(): Promise<ScanResult> {
  const folders = settings.get().folders;
  const result = await scanFolders(folders, sendScanProgress);
  lastScan = result;
  channelIndex.clear();
  for (const [id, sources] of Object.entries(result.channelSources)) channelIndex.set(id, sources);
  return result;
}

ipcMain.handle(IPC.SCAN, async () => performScan());
ipcMain.handle(IPC.RESCAN, async () => performScan());
ipcMain.handle(IPC.GET_REGISTERED_FOLDERS, async () => settings.get().folders);
ipcMain.handle(IPC.REMOVE_FOLDER, async (_e, id: string) => settings.removeFolder(id));
ipcMain.handle(IPC.UPDATE_FOLDER, async (_e, id: string, patch: Partial<Pick<FolderEntry, 'personLabel'>>) => settings.updateFolder(id, patch));

function sourcesAllowed(sources: ChannelSourceRef[]): boolean {
  const folders = settings.get().folders;
  return sources.every((s) => isPathInsideAny(s.folderPath, folders));
}

ipcMain.handle(IPC.LOAD_CHANNEL, async (_e, channelId: string) => {
  const sources = channelIndex.get(channelId);
  if (!sources || sources.length === 0) return { ok: false, error: { filePath: '', errorType: 'unknown', message: 'Channel nicht im Index. Bitte neu scannen.' } };
  if (!sourcesAllowed(sources)) return { ok: false, error: { filePath: '', errorType: 'unknown', message: 'Zugriff verweigert.' } };
  const result = loadChannelMerged(channelId, sources);
  if (!result.ok) return result;

  const folder = sources[0].folderPath;
  for (const m of result.channel.messages) {
    if (m.authorAvatar) m.authorAvatar = resolveUrlForRenderer(folder, m.authorAvatar);
    for (const att of m.attachments) {
      if (looksLikeRemoteUrl(att.url)) { continue; } // eigenständige CDN-/Web-Links direkt verwenden
      const r = resolveLocalAttachment(folder, att.url || att.fileName);
      if (r.exists && r.absolutePath) {
        att.localPath = r.absolutePath;
        if (!att.fileSizeBytes) {
          try { att.fileSizeBytes = fs.statSync(r.absolutePath).size; } catch { /* ignore */ }
        }
      } else att.localPath = null;
    }
    for (const e of m.embeds) {
      e.imageUrl = resolveUrlForRenderer(folder, e.imageUrl);
      e.thumbnailUrl = resolveUrlForRenderer(folder, e.thumbnailUrl);
      e.authorIconUrl = resolveUrlForRenderer(folder, e.authorIconUrl);
      e.footerIconUrl = resolveUrlForRenderer(folder, e.footerIconUrl);
    }
    for (const r of m.reactions) r.emojiImageUrl = resolveUrlForRenderer(folder, r.emojiImageUrl);
  }
  for (const u of result.channel.users) u.avatarUrl = resolveUrlForRenderer(folder, u.avatarUrl);
  return result;
});

function findHtml(folder: string, jsonFilePath: string): string | null {
  try {
    const entries = fs.readdirSync(folder, { withFileTypes: true });
    const base = path.basename(jsonFilePath, path.extname(jsonFilePath));
    const exact = entries.find((e) => e.isFile() && path.basename(e.name, path.extname(e.name)) === base && /\.html?$/i.test(e.name));
    if (exact) return path.join(folder, exact.name);
    const any = entries.find((e) => e.isFile() && /\.html?$/i.test(e.name));
    return any ? path.join(folder, any.name) : null;
  } catch { return null; }
}

async function openHtmlInternal(channelId: string, forceBrowser: boolean) {
  const sources = channelIndex.get(channelId);
  if (!sources || sources.length === 0) return { ok: false, error: 'Channel unbekannt' };
  let html: string | null = null;
  if (sources.length === 1 && sources[0].format === 'dce') {
    html = findHtml(sources[0].folderPath, sources[0].jsonFilePath);
  }
  if (!html) {
    const loaded = loadChannelMerged(channelId, sources);
    if (!loaded.ok) return { ok: false, error: 'HTML-Generierung fehlgeschlagen: ' + loaded.error.message };
    const gen = generateHtmlForChannelModel(loaded.channel);
    if (!gen.ok) return { ok: false, error: 'HTML-Generierung fehlgeschlagen: ' + gen.error };
    html = gen.htmlPath;
  }
  if (!html) return { ok: false, error: 'Keine HTML-Datei verfügbar.' };
  if (forceBrowser) {
    try { await shell.openExternal(pathToFileURL(html).toString()); return { ok: true }; }
    catch (e: any) { return { ok: false, error: e?.message ?? 'Konnte Browser nicht öffnen.' }; }
  }
  const err = await shell.openPath(html);
  if (err) return { ok: false, error: err };
  return { ok: true };
}

ipcMain.handle(IPC.OPEN_HTML, async (_e, channelId: string, forceBrowser?: boolean) => openHtmlInternal(channelId, !!forceBrowser));
ipcMain.handle(IPC.OPEN_IN_BROWSER, async (_e, channelId: string) => openHtmlInternal(channelId, true));

ipcMain.handle(IPC.OPEN_WEBSITE, async (_e, channelId: string) => {
  const sources = channelIndex.get(channelId);
  if (!sources || sources.length === 0) return { ok: false, error: 'Channel unbekannt' };
  const loaded = loadChannelMerged(channelId, sources);
  if (!loaded.ok) return { ok: false, error: loaded.error.message };
  const gen = generateWebsiteForChannels([loaded.channel]);
  if (!gen.ok) return { ok: false, error: gen.error };
  try { await shell.openExternal(pathToFileURL(gen.htmlPath).toString()); return { ok: true }; }
  catch (e: any) { return { ok: false, error: e?.message ?? 'Konnte Website nicht öffnen.' }; }
});

ipcMain.handle(IPC.EXPORT_MARKDOWN, async (_e, channelId: string) => {
  const sources = channelIndex.get(channelId);
  if (!sources || sources.length === 0) return { ok: false, error: 'Channel unbekannt' };
  const loaded = loadChannelMerged(channelId, sources);
  if (!loaded.ok) return { ok: false, error: loaded.error.message };
  const r = exportMarkdownForChannelModel(loaded.channel);
  if (!r.ok) return { ok: false, error: r.error };
  shell.showItemInFolder(r.filePath);
  return { ok: true, filePath: r.filePath };
});

ipcMain.handle(IPC.OPEN_FILE, async (_e, absolutePath: string) => {
  if (typeof absolutePath !== 'string' || !absolutePath) return { ok: false, error: 'Ungültiger Pfad.' };
  if (!isPathInsideAny(absolutePath, settings.get().folders)) return { ok: false, error: 'Zugriff verweigert.' };
  if (!fs.existsSync(absolutePath)) return { ok: false, error: 'Datei existiert nicht.' };
  const err = await shell.openPath(absolutePath);
  if (err) return { ok: false, error: err };
  return { ok: true };
});

ipcMain.handle(IPC.OPEN_CHANNEL_FOLDER, async (_e, channelId: string) => {
  const sources = channelIndex.get(channelId);
  if (!sources || sources.length === 0) return { ok: false, error: 'Channel unbekannt' };
  const folderPath = sources[0].folderPath;
  if (!fs.existsSync(folderPath)) return { ok: false, error: 'Ordner existiert nicht.' };
  shell.openPath(folderPath);
  return { ok: true };
});

ipcMain.handle(IPC.SHOW_FILE_IN_EXPLORER, async (_e, absolutePath: string) => {
  if (typeof absolutePath !== 'string' || !absolutePath) return { ok: false, error: 'Ungültiger Pfad.' };
  if (!isPathInsideAny(absolutePath, settings.get().folders)) return { ok: false, error: 'Zugriff verweigert.' };
  if (!fs.existsSync(absolutePath)) return { ok: false, error: 'Datei existiert nicht.' };
  shell.showItemInFolder(absolutePath);
  return { ok: true };
});

ipcMain.handle(IPC.GET_SETTINGS, async () => settings.get());
ipcMain.handle(IPC.UPDATE_SETTINGS, async (_e, patch: Partial<AppSettings>) => settings.update(patch));

ipcMain.handle(IPC.RESOLVE_MEDIA, async (_e, channelId: string, attachmentUrlOrName: string) => {
  if (looksLikeRemoteUrl(attachmentUrlOrName)) {
    return { ok: true, exists: true, absolutePath: null, fileUrl: attachmentUrlOrName };
  }
  const sources = channelIndex.get(channelId);
  if (!sources || sources.length === 0) return { ok: false, exists: false, error: 'Channel unbekannt' };
  const r = resolveLocalAttachment(sources[0].folderPath, attachmentUrlOrName);
  if (!r.exists || !r.absolutePath) return { ok: true, exists: false, absolutePath: null, fileUrl: undefined };
  if (!isPathInsideAny(r.absolutePath, settings.get().folders)) return { ok: false, exists: false, error: 'Zugriff verweigert.' };
  return { ok: true, exists: true, absolutePath: r.absolutePath, fileUrl: toMediaUrl(r.absolutePath) };
});

app.whenReady().then(() => {
  settings.load();
  registerMediaProtocol();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

app.on('web-contents-created', (_e, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  contents.on('will-navigate', (event, url) => {
    if (VITE_DEV_SERVER_URL && url.startsWith(VITE_DEV_SERVER_URL)) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
  });
});
