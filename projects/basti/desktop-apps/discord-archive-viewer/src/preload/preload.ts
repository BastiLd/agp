import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/types';
import type { PreloadAPI } from '../shared/preload-api';

const api: PreloadAPI = {
  pickChannelFolders: () => ipcRenderer.invoke(IPC.PICK_CHANNEL_FOLDERS),
  pickRootFolder: () => ipcRenderer.invoke(IPC.PICK_ROOT_FOLDER),
  scan: () => ipcRenderer.invoke(IPC.SCAN),
  rescan: () => ipcRenderer.invoke(IPC.RESCAN),
  getRegisteredFolders: () => ipcRenderer.invoke(IPC.GET_REGISTERED_FOLDERS),
  removeFolder: (id) => ipcRenderer.invoke(IPC.REMOVE_FOLDER, id),
  updateFolder: (id, patch) => ipcRenderer.invoke(IPC.UPDATE_FOLDER, id, patch),
  loadChannel: (channelId) => ipcRenderer.invoke(IPC.LOAD_CHANNEL, channelId),
  openHtml: (channelId, forceBrowser) => ipcRenderer.invoke(IPC.OPEN_HTML, channelId, !!forceBrowser),
  openInBrowser: (channelId) => ipcRenderer.invoke(IPC.OPEN_IN_BROWSER, channelId),
  openWebsite: (channelId) => ipcRenderer.invoke(IPC.OPEN_WEBSITE, channelId),
  exportMarkdown: (channelId) => ipcRenderer.invoke(IPC.EXPORT_MARKDOWN, channelId),
  openFile: (absolutePath) => ipcRenderer.invoke(IPC.OPEN_FILE, absolutePath),
  openChannelFolder: (channelId) => ipcRenderer.invoke(IPC.OPEN_CHANNEL_FOLDER, channelId),
  showFileInExplorer: (absolutePath) => ipcRenderer.invoke(IPC.SHOW_FILE_IN_EXPLORER, absolutePath),
  getSettings: () => ipcRenderer.invoke(IPC.GET_SETTINGS),
  updateSettings: (patch) => ipcRenderer.invoke(IPC.UPDATE_SETTINGS, patch),
  resolveMedia: (channelId, attachmentUrlOrName) =>
    ipcRenderer.invoke(IPC.RESOLVE_MEDIA, channelId, attachmentUrlOrName),
  onScanProgress: (cb) => {
    const listener = (_: unknown, payload: any) => cb(payload);
    ipcRenderer.on(IPC.ON_SCAN_PROGRESS, listener);
    return () => ipcRenderer.off(IPC.ON_SCAN_PROGRESS, listener);
  },
  onLoadProgress: (cb) => {
    const listener = (_: unknown, payload: any) => cb(payload);
    ipcRenderer.on(IPC.ON_LOAD_PROGRESS, listener);
    return () => ipcRenderer.off(IPC.ON_LOAD_PROGRESS, listener);
  },
};

contextBridge.exposeInMainWorld('api', api);
