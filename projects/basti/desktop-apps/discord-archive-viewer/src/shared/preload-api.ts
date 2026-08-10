import type {
  AppSettings,
  ChannelLoadError,
  ChannelModel,
  FolderEntry,
  ScanResult,
} from './types';

export interface ScanProgress {
  phase: 'starting' | 'scanning' | 'parsing' | 'done';
  scannedCount: number;
  totalEstimate: number;
  currentPath: string;
}

export interface LoadProgress {
  channelId: string;
  channelName: string;
  bytesLoaded: number;
  totalBytes: number;
  percent: number;
}

export interface PreloadAPI {
  pickChannelFolders(): Promise<{ folders: FolderEntry[] } | { canceled: true }>;
  pickRootFolder(): Promise<{ folder: FolderEntry } | { canceled: true }>;
  scan(): Promise<ScanResult>;
  rescan(): Promise<ScanResult>;
  getRegisteredFolders(): Promise<FolderEntry[]>;
  removeFolder(id: string): Promise<FolderEntry[]>;
  updateFolder(id: string, patch: Partial<Pick<FolderEntry, 'personLabel'>>): Promise<FolderEntry[]>;
  loadChannel(channelId: string): Promise<
    | { ok: true; channel: ChannelModel }
    | { ok: false; error: ChannelLoadError }
  >;
  openHtml(channelId: string, forceBrowser?: boolean): Promise<{ ok: boolean; error?: string }>;
  openInBrowser(channelId: string): Promise<{ ok: boolean; error?: string }>;
  openWebsite(channelId: string): Promise<{ ok: boolean; error?: string }>;
  exportMarkdown(channelId: string): Promise<{ ok: boolean; error?: string; filePath?: string }>;
  openFile(absolutePath: string): Promise<{ ok: boolean; error?: string }>;
  openChannelFolder(channelId: string): Promise<{ ok: boolean; error?: string }>;
  showFileInExplorer(absolutePath: string): Promise<{ ok: boolean; error?: string }>;
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>;
  resolveMedia(channelId: string, attachmentUrlOrName: string): Promise<{
    ok: boolean;
    fileUrl?: string;
    absolutePath?: string;
    exists: boolean;
    error?: string;
  }>;
  onScanProgress(cb: (p: ScanProgress) => void): () => void;
  onLoadProgress(cb: (p: LoadProgress) => void): () => void;
}

declare global {
  interface Window {
    api: PreloadAPI;
  }
}
