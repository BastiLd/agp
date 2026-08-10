import { create } from 'zustand';
import type { CanvasFile } from '../formats/canvasFormat';
import { createStarterCanvas, serializeCanvas } from '../formats/canvasFormat';
import { createMarkdownDocument } from '../formats/markdownFormat';
import type { MindmapEvent } from '../commands/commandTypes';
import { createDefaultMeta } from '../formats/sidecarFormat';
import type { VaultFile, VaultFileType, VaultStateSnapshot } from './vaultTypes';
import { normalizeFileName, sortVaultFiles } from './vaultIndex';

const STORAGE_KEY = 'obbymm-vault-v1';

interface VaultStore {
  files: VaultFile[];
  activeFileId: string | null;
  searchQuery: string;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  openFile: (fileId: string) => void;
  createMarkdown: (name?: string) => VaultFile;
  createCanvas: (name?: string) => VaultFile;
  updateMarkdownContent: (fileId: string, content: string) => void;
  saveCanvasSnapshot: (
    fileId: string,
    canvas: CanvasFile,
    events: MindmapEvent[],
    nodeNotes: Record<string, string>,
  ) => void;
  setSearchQuery: (query: string) => void;
}

export const useVaultStore = create<VaultStore>((set, get) => ({
  ...loadVault(),
  searchQuery: '',
  saveStatus: 'saved',

  openFile: (fileId) => setAndPersist({ activeFileId: fileId }, set, get),

  createMarkdown: (name = 'New Note') => {
    const fileName = makeUniqueName(get().files, normalizeFileName(name, 'markdown'));
    const file = createVaultFile(fileName, 'markdown', createMarkdownDocument(fileName.replace(/\.md$/i, '')));
    setAndPersist({ files: sortVaultFiles([...get().files, file]), activeFileId: file.id }, set, get);
    return file;
  },

  createCanvas: (name = 'New Mindmap') => {
    const fileName = makeUniqueName(get().files, normalizeFileName(name, 'canvas'));
    const canvas = createStarterCanvas(fileName.replace(/\.canvas$/i, ''));
    const file = createVaultFile(fileName, 'canvas', serializeCanvas(canvas), [], {});
    createDefaultMeta(fileName, fileName.replace(/\.canvas$/i, ''));
    setAndPersist({ files: sortVaultFiles([...get().files, file]), activeFileId: file.id }, set, get);
    return file;
  },

  updateMarkdownContent: (fileId, content) => {
    set({ saveStatus: 'saving' });
    setAndPersist({
      files: get().files.map((file) => file.id === fileId ? { ...file, content, updatedAt: Date.now() } : file),
      saveStatus: 'saved',
    }, set, get);
  },

  saveCanvasSnapshot: (fileId, canvas, events, nodeNotes) => {
    set({ saveStatus: 'saving' });
    setAndPersist({
      files: get().files.map((file) => file.id === fileId
        ? {
            ...file,
            content: serializeCanvas(canvas),
            events,
            nodeNotes,
            updatedAt: Date.now(),
          }
        : file),
      saveStatus: 'saved',
    }, set, get);
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}));

export function getActiveFile(files: VaultFile[], activeFileId: string | null): VaultFile | null {
  return files.find((file) => file.id === activeFileId) ?? null;
}

function loadVault(): VaultStateSnapshot {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as VaultStateSnapshot;
      if (Array.isArray(parsed.files)) {
        return {
          files: parsed.files,
          activeFileId: parsed.activeFileId ?? parsed.files[0]?.id ?? null,
        };
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const starterCanvas = createStarterCanvas('ObbyMM');
  const files: VaultFile[] = [
    createVaultFile('Welcome.md', 'markdown', '# Welcome to ObbyMM\n\nCreate notes, connect ideas, and use [[ObbyMM.canvas]] as a visual starting point.\n'),
    createVaultFile('ObbyMM.canvas', 'canvas', serializeCanvas(starterCanvas), [], {}),
  ];

  return { files, activeFileId: files[1].id };
}

function createVaultFile(
  name: string,
  type: VaultFileType,
  content: string,
  events?: MindmapEvent[],
  nodeNotes?: Record<string, string>,
): VaultFile {
  return {
    id: createId('file'),
    name,
    path: name,
    type,
    content,
    updatedAt: Date.now(),
    events,
    nodeNotes,
  };
}

function setAndPersist(
  partial: Partial<VaultStore>,
  set: (partial: Partial<VaultStore>) => void,
  get: () => VaultStore,
): void {
  set(partial);
  const state = get();
  const snapshot: VaultStateSnapshot = {
    files: state.files,
    activeFileId: state.activeFileId,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function makeUniqueName(files: VaultFile[], preferredName: string): string {
  const existing = new Set(files.map((file) => file.name.toLowerCase()));
  if (!existing.has(preferredName.toLowerCase())) return preferredName;

  const dotIndex = preferredName.lastIndexOf('.');
  const base = dotIndex > 0 ? preferredName.slice(0, dotIndex) : preferredName;
  const extension = dotIndex > 0 ? preferredName.slice(dotIndex) : '';

  let index = 2;
  while (existing.has(`${base} ${index}${extension}`.toLowerCase())) {
    index += 1;
  }

  return `${base} ${index}${extension}`;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
