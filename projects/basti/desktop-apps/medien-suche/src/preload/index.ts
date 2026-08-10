import { contextBridge, ipcRenderer } from 'electron';
import type {
  AppSettings,
  DirectoryPickResult,
  FileAction,
  FileActionResult,
  IndexStatus,
  MediaSource,
  NewMediaSource,
  ScanProgress,
  SearchRequest,
  SearchResult,
  SourceUpdate
} from '../shared/types';

const api = {
  listSources: () => ipcRenderer.invoke('sources:list') as Promise<MediaSource[]>,
  addSource: (source: NewMediaSource) => ipcRenderer.invoke('sources:add', source) as Promise<MediaSource>,
  updateSource: (id: number, patch: SourceUpdate) =>
    ipcRenderer.invoke('sources:update', id, patch) as Promise<MediaSource>,
  removeSource: (id: number) => ipcRenderer.invoke('sources:remove', id) as Promise<MediaSource[]>,
  pickDirectory: () => ipcRenderer.invoke('dialog:pick-directory') as Promise<DirectoryPickResult>,
  getIndexStatus: () => ipcRenderer.invoke('index:status') as Promise<IndexStatus>,
  rebuildIndex: () => ipcRenderer.invoke('index:rebuild') as Promise<IndexStatus>,
  rebuildSource: (id: number) => ipcRenderer.invoke('index:rebuild-source', id) as Promise<IndexStatus>,
  searchMedia: (request: SearchRequest) => ipcRenderer.invoke('search:media', request) as Promise<SearchResult[]>,
  performFileAction: (action: FileAction, targetPath: string) =>
    ipcRenderer.invoke('file:action', action, targetPath) as Promise<FileActionResult>,
  exportMissing: (entries: string[], format: 'txt' | 'csv') =>
    ipcRenderer.invoke('export:missing', entries, format) as Promise<FileActionResult>,
  getSettings: () => ipcRenderer.invoke('settings:get') as Promise<AppSettings>,
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('settings:save', settings) as Promise<AppSettings>,
  validateTmdbKey: (key: string) =>
    ipcRenderer.invoke('tmdb:validate', key) as Promise<'active' | 'missing' | 'invalid' | 'offline'>,
  onIndexProgress: (callback: (progress: ScanProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: ScanProgress) => callback(progress);
    ipcRenderer.on('index:progress', listener);
    return () => {
      ipcRenderer.removeListener('index:progress', listener);
    };
  }
};

contextBridge.exposeInMainWorld('mediaApp', api);

export type MediaAppApi = typeof api;
