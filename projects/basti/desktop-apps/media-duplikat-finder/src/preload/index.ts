import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppSettings, DeleteRequest, ExportRow, MediaApi, ScanProgress, ScanResult } from '../shared/types'

const mediaApi: MediaApi = {
  selectFolders: () => ipcRenderer.invoke('select-folders'),
  scanFolders: (folders: string[], strictness) => ipcRenderer.invoke('scan-folders', folders, strictness),
  cancelScan: () => ipcRenderer.send('cancel-scan'),
  onScanProgress: (callback: (progress: ScanProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: ScanProgress): void => callback(progress)
    ipcRenderer.on('scan-progress', listener)
    return () => ipcRenderer.removeListener('scan-progress', listener)
  },
  onScanPartial: (callback: (result: ScanResult) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, result: ScanResult): void => callback(result)
    ipcRenderer.on('scan-partial', listener)
    return () => ipcRenderer.removeListener('scan-partial', listener)
  },
  exportMarked: (rows: ExportRow[]) => ipcRenderer.invoke('export-marked', rows),
  deleteFiles: (request: DeleteRequest) => ipcRenderer.invoke('delete-files', request),
  getVideoThumbnail: (path: string) => ipcRenderer.invoke('get-video-thumbnail', path),
  openPathInExplorer: (path: string) => ipcRenderer.invoke('open-path-in-explorer', path),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('save-settings', settings),
  loadLastResult: () => ipcRenderer.invoke('load-last-result')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('mediaApi', mediaApi)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.mediaApi = mediaApi
}
