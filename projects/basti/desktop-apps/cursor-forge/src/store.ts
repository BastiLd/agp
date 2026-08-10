import { create } from 'zustand';
import { SlotState, ExportFormat, Toast } from './types';
import { CURSOR_ROLES } from './cursorRoles';

const STORAGE_KEY = 'cursorforge-state-v2';

interface PersistedState {
  schemeName: string;
  outputDir: string;
  exportFormat: ExportFormat;
  sizes: number[];
  slotPaths: { role: string; path: string; hotspotX: number; hotspotY: number }[];
}

interface AppStore {
  schemeName: string;
  outputDir: string;
  exportFormat: ExportFormat;
  sizes: number[];
  slots: SlotState[];
  isBuilding: boolean;
  buildMessage: string | null;
  buildSuccess: boolean | null;
  dragActive: boolean;
  dragHoveredRole: string | null;
  hotspotEditorRole: string | null;
  toasts: Toast[];

  setSchemeName: (n: string) => void;
  setOutputDir: (d: string) => void;
  setExportFormat: (f: ExportFormat) => void;
  toggleSize: (s: number) => void;
  setSlot: (role: string, data: Partial<SlotState>) => void;
  clearSlot: (role: string) => void;
  clearAll: () => void;
  setIsBuilding: (b: boolean) => void;
  setBuildResult: (success: boolean, msg: string) => void;
  clearBuildMessage: () => void;
  setDragActive: (active: boolean) => void;
  setDragHoveredRole: (role: string | null) => void;
  openHotspotEditor: (role: string | null) => void;
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: number) => void;
  assignedCount: () => number;
  persist: () => void;
}

const emptySlot = (role: string): SlotState => {
  const def = CURSOR_ROLES.find(r => r.key === role);
  return {
    role,
    sourcePath: null,
    previewData: null,
    frames: [],
    width: 32,
    height: 32,
    hotspotX: def?.defaultHotspot[0] ?? 0,
    hotspotY: def?.defaultHotspot[1] ?? 0,
    needsConversion: false,
    isAnimation: false,
    makeAni: false,
    fileSize: 0,
  };
};

const makeInitialSlots = (): SlotState[] => CURSOR_ROLES.map(r => emptySlot(r.key));

let toastCounter = 0;

export function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export const useStore = create<AppStore>((set, get) => {
  const persisted = loadPersisted();

  return {
    schemeName: persisted?.schemeName ?? 'Mein Cursor-Theme',
    outputDir: persisted?.outputDir ?? '',
    exportFormat: persisted?.exportFormat ?? 'inf',
    sizes: persisted?.sizes?.length ? persisted.sizes : [32, 48, 64, 96],
    slots: makeInitialSlots(),
    isBuilding: false,
    buildMessage: null,
    buildSuccess: null,
    dragActive: false,
    dragHoveredRole: null,
    hotspotEditorRole: null,
    toasts: [],

    setSchemeName: n => {
      set({ schemeName: n });
      get().persist();
    },
    setOutputDir: d => {
      set({ outputDir: d });
      get().persist();
    },
    setExportFormat: f => {
      set({ exportFormat: f });
      get().persist();
    },
    toggleSize: s =>
      set(state => {
        const has = state.sizes.includes(s);
        // Mindestens eine Größe muss gewählt bleiben
        if (has && state.sizes.length === 1) return state;
        const sizes = has
          ? state.sizes.filter(x => x !== s)
          : [...state.sizes, s].sort((a, b) => a - b);
        setTimeout(() => get().persist(), 0);
        return { sizes };
      }),

    setSlot: (role, data) => {
      set(state => ({
        slots: state.slots.map(s => (s.role === role ? { ...s, ...data } : s)),
      }));
      get().persist();
    },

    clearSlot: role => {
      set(state => ({
        slots: state.slots.map(s => (s.role === role ? emptySlot(role) : s)),
      }));
      get().persist();
    },

    clearAll: () => {
      set({ slots: makeInitialSlots() });
      get().persist();
    },

    setIsBuilding: b => set({ isBuilding: b }),
    setBuildResult: (success, msg) =>
      set({ buildSuccess: success, buildMessage: msg, isBuilding: false }),
    clearBuildMessage: () => set({ buildMessage: null, buildSuccess: null }),
    setDragActive: active => set({ dragActive: active }),
    setDragHoveredRole: role => set({ dragHoveredRole: role }),
    openHotspotEditor: role => set({ hotspotEditorRole: role }),

    addToast: (type, message) => {
      const id = ++toastCounter;
      set(state => ({ toasts: [...state.toasts.slice(-4), { id, type, message }] }));
      setTimeout(() => get().removeToast(id), type === 'error' ? 6000 : 3500);
    },
    removeToast: id => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

    assignedCount: () => get().slots.filter(s => s.sourcePath !== null).length,

    persist: () => {
      try {
        const s = get();
        const data: PersistedState = {
          schemeName: s.schemeName,
          outputDir: s.outputDir,
          exportFormat: s.exportFormat,
          sizes: s.sizes,
          slotPaths: s.slots
            .filter(sl => sl.sourcePath !== null)
            .map(sl => ({
              role: sl.role,
              path: sl.sourcePath!,
              hotspotX: sl.hotspotX,
              hotspotY: sl.hotspotY,
            })),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        /* Speichern ist optional — Fehler ignorieren */
      }
    },
  };
});
