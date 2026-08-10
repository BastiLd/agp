import { app } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AppSettings, FolderEntry } from '../shared/types';

const DEFAULTS: AppSettings = {
  folders: [],
  theme: 'discord-dark',
  themeOverrides: {},
  density: 'cozy',
  fontSize: 'medium',
  imageSize: 'large',
  timeFormat: '24h',
  avatarShape: 'circle',
  sidebarWidth: 320,
  pinnedChannelIds: [],
  collapsedGuilds: [],
  hiddenChannelIds: [],
  autoHideEmptyChannels: false,
  showAttachmentFilters: true,
  groupConsecutiveMessages: true,
  hideBots: false,
  showReadingProgress: true,
  showAuthorColors: true,
  wallpaperOpacity: 1,
  showMessageDividers: true,
  stickyDayDividers: false,
  restoreScrollPosition: true,
  customCss: '',
  mascotEnabled: true,
  mascotPosition: { right: 24, bottom: 80 },
  windowBounds: null,
};

export class SettingsStore {
  private cache: AppSettings = { ...DEFAULTS };
  private filePath: string;

  constructor() {
    const userData = app.getPath('userData');
    this.filePath = path.join(userData, 'settings.json');
  }

  load(): AppSettings {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.cache = { ...DEFAULTS };
        return this.cache;
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      this.cache = {
        ...DEFAULTS,
        ...parsed,
        folders: Array.isArray(parsed.folders) ? parsed.folders : [],
        pinnedChannelIds: Array.isArray(parsed.pinnedChannelIds) ? parsed.pinnedChannelIds : [],
        collapsedGuilds: Array.isArray(parsed.collapsedGuilds) ? parsed.collapsedGuilds : [],
        hiddenChannelIds: Array.isArray(parsed.hiddenChannelIds) ? parsed.hiddenChannelIds : [],
        autoHideEmptyChannels: typeof parsed.autoHideEmptyChannels === 'boolean' ? parsed.autoHideEmptyChannels : false,
        themeOverrides: parsed.themeOverrides && typeof parsed.themeOverrides === 'object' ? parsed.themeOverrides : {},
        mascotPosition: parsed.mascotPosition ?? DEFAULTS.mascotPosition,
        windowBounds: parsed.windowBounds ?? null,
      };
      return this.cache;
    } catch (e) {
      console.warn('SettingsStore: Konfiguration unlesbar, fallback auf Defaults.', e);
      this.cache = { ...DEFAULTS };
      return this.cache;
    }
  }

  get(): AppSettings { return this.cache; }

  private save() {
    try {
      const tmp = this.filePath + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.cache, null, 2), 'utf-8');
      fs.renameSync(tmp, this.filePath);
    } catch (e) {
      console.error('SettingsStore: Konnte Konfiguration nicht speichern.', e);
    }
  }

  update(patch: Partial<AppSettings>): AppSettings {
    this.cache = { ...this.cache, ...patch };
    this.save();
    return this.cache;
  }

  setFolders(folders: FolderEntry[]) { this.cache.folders = folders; this.save(); }
  setWindowBounds(b: { x: number; y: number; width: number; height: number }) { this.cache.windowBounds = b; this.save(); }
  addFolder(entry: FolderEntry) {
    if (!this.cache.folders.some((f) => f.path === entry.path)) {
      this.cache.folders.push(entry); this.save();
    }
  }
  removeFolder(id: string): FolderEntry[] {
    this.cache.folders = this.cache.folders.filter((f) => f.id !== id);
    this.save();
    return this.cache.folders;
  }
  updateFolder(id: string, patch: Partial<Pick<FolderEntry, 'personLabel'>>): FolderEntry[] {
    this.cache.folders = this.cache.folders.map((f) => (f.id === id ? { ...f, ...patch } : f));
    this.save();
    return this.cache.folders;
  }
}
