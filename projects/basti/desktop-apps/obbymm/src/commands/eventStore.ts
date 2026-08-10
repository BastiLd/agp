import { create } from 'zustand';
import type { CanvasFile } from '../formats/canvasFormat';
import { createEmptyCanvas } from '../formats/canvasFormat';
import type { MindmapEvent } from './commandTypes';
import type { CanvasNode, CanvasNodeShape } from '../formats/canvasFormat';

interface EventStoreState {
  currentMapId: string | null;
  canvas: CanvasFile;
  events: MindmapEvent[];
  undoStack: MindmapEvent[];
  redoStack: MindmapEvent[];
  nodeNotes: Record<string, string>;
  selectedNodeId: string | null;

  /* Replay state */
  isReplaying: boolean;
  replayIndex: number;
  replayTimerId: ReturnType<typeof setInterval> | null;

  loadMap: (mapId: string, canvas: CanvasFile, events: MindmapEvent[], nodeNotes?: Record<string, string>) => void;
  applyEvent: (event: MindmapEvent) => void;
  selectNode: (nodeId: string | null) => void;
  undo: () => void;
  redo: () => void;

  /* Replay actions */
  startReplay: () => void;
  stopReplay: () => void;
}

export const useEventStore = create<EventStoreState>((set, get) => ({
  currentMapId: null,
  canvas: createEmptyCanvas(),
  events: [],
  undoStack: [],
  redoStack: [],
  nodeNotes: {},
  selectedNodeId: null,

  /* Replay state */
  isReplaying: false,
  replayIndex: 0,
  replayTimerId: null,

  loadMap: (mapId, canvas, events, nodeNotes = {}) => set({
    currentMapId: mapId,
    canvas,
    events,
    undoStack: events.filter((event) => event.inverse),
    redoStack: [],
    nodeNotes,
    selectedNodeId: null,
  }),

  applyEvent: (event) => set((state) => {
    const projected = applyEventToState(state.canvas, state.nodeNotes, event);
    return {
      ...projected,
      events: [...state.events, event],
      undoStack: event.inverse ? [...state.undoStack, event] : state.undoStack,
      redoStack: [],
      selectedNodeId: resolveSelectionAfterEvent(state.selectedNodeId, event),
    };
  }),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  undo: () => set((state) => {
    const eventToUndo = state.undoStack.at(-1);
    if (!eventToUndo?.inverse) return state;

    const inverseEvent: MindmapEvent = {
      eventId: createEventId('undo'),
      mapId: eventToUndo.mapId,
      type: eventToUndo.inverse.type,
      timestamp: Date.now(),
      actor: 'system',
      payload: eventToUndo.inverse.payload,
    };

    const projected = applyEventToState(state.canvas, state.nodeNotes, inverseEvent);
    return {
      ...projected,
      events: [...state.events, inverseEvent],
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, eventToUndo],
      selectedNodeId: resolveSelectionAfterEvent(state.selectedNodeId, inverseEvent),
    };
  }),

  redo: () => set((state) => {
    const eventToRedo = state.redoStack.at(-1);
    if (!eventToRedo) return state;

    const redoEvent: MindmapEvent = {
      ...eventToRedo,
      eventId: createEventId('redo'),
      timestamp: Date.now(),
      actor: 'system',
    };

    const projected = applyEventToState(state.canvas, state.nodeNotes, redoEvent);
    return {
      ...projected,
      events: [...state.events, redoEvent],
      undoStack: [...state.undoStack, redoEvent],
      redoStack: state.redoStack.slice(0, -1),
      selectedNodeId: resolveSelectionAfterEvent(state.selectedNodeId, redoEvent),
    };
  }),

  /* ── Replay ────────────────────────────────────────── */
  startReplay: () => {
    const state = get();
    // Nothing to replay
    if (state.events.length === 0) return;

    // Stop any existing replay
    if (state.replayTimerId !== null) {
      clearInterval(state.replayTimerId);
    }

    // Save original events; reset canvas to empty
    const savedEvents = [...state.events];

    set({
      isReplaying: true,
      replayIndex: 0,
      canvas: createEmptyCanvas(),
      nodeNotes: {},
      selectedNodeId: null,
    });

    const timerId = setInterval(() => {
      const current = get();
      const idx = current.replayIndex;

      if (idx >= savedEvents.length) {
        // Replay finished
        clearInterval(timerId);
        set({
          isReplaying: false,
          replayTimerId: null,
          // Restore undo/redo stacks from full event list
          undoStack: savedEvents.filter((ev) => ev.inverse),
          redoStack: [],
        });
        return;
      }

      const event = savedEvents[idx];
      const projected = applyEventToState(current.canvas, current.nodeNotes, event);
      set({
        ...projected,
        replayIndex: idx + 1,
      });
    }, 350);

    set({ replayTimerId: timerId });
  },

  stopReplay: () => {
    const state = get();
    if (state.replayTimerId !== null) {
      clearInterval(state.replayTimerId);
    }
    // Re-project all events to get the full canvas state
    const allEvents = state.events;
    let finalCanvas: CanvasFile = createEmptyCanvas();
    let finalNotes: Record<string, string> = {};
    for (const ev of allEvents) {
      const projected = applyEventToState(finalCanvas, finalNotes, ev);
      finalCanvas = projected.canvas;
      finalNotes = projected.nodeNotes;
    }
    set({
      isReplaying: false,
      replayIndex: 0,
      replayTimerId: null,
      canvas: finalCanvas,
      nodeNotes: finalNotes,
      undoStack: allEvents.filter((ev) => ev.inverse),
      redoStack: [],
    });
  },
}));

export function applyEventToState(
  canvas: CanvasFile,
  nodeNotes: Record<string, string>,
  event: MindmapEvent,
): Pick<EventStoreState, 'canvas' | 'nodeNotes'> {
  const payload = event.payload as {
    node?: CanvasFile['nodes'][number];
    edges?: CanvasFile['edges'];
    note?: string;
    nodeId?: string;
    after?: string | { x: number; y: number } | Partial<CanvasNode> | CanvasNodeShape;
    edge?: CanvasFile['edges'][number];
    edgeId?: string;
  };
  const nextCanvas: CanvasFile = {
    ...canvas,
    nodes: [...canvas.nodes],
    edges: [...canvas.edges],
  };
  const nextNotes = { ...nodeNotes };

  switch (event.type) {
    case 'node.create': {
      if (payload.node && !nextCanvas.nodes.some((node) => node.id === payload.node?.id)) {
        nextCanvas.nodes.push(payload.node);
      }
      if (payload.edges) {
        const existingEdgeIds = new Set(nextCanvas.edges.map((edge) => edge.id));
        nextCanvas.edges.push(...payload.edges.filter((edge) => !existingEdgeIds.has(edge.id)));
      }
      if (payload.node && payload.note) {
        nextNotes[payload.node.id] = payload.note;
      }
      break;
    }
    case 'node.delete':
      if (payload.nodeId) {
        nextCanvas.nodes = nextCanvas.nodes.filter((node) => node.id !== payload.nodeId);
        nextCanvas.edges = nextCanvas.edges.filter((edge) => edge.fromNode !== payload.nodeId && edge.toNode !== payload.nodeId);
        delete nextNotes[payload.nodeId];
      }
      break;
    case 'node.text.update':
      if (payload.nodeId && typeof payload.after === 'string') {
        nextCanvas.nodes = nextCanvas.nodes.map((node) => (
          node.id === payload.nodeId ? { ...node, text: payload.after as string } : node
        ));
      }
      break;
    case 'node.position.update':
      if (payload.nodeId && isPoint(payload.after)) {
        const after = payload.after;
        nextCanvas.nodes = nextCanvas.nodes.map((node) => (
          node.id === payload.nodeId
            ? { ...node, x: after.x, y: after.y }
            : node
        ));
      }
      break;
    case 'node.note.update':
      if (payload.nodeId && typeof payload.after === 'string') {
        if (payload.after.trim()) {
          nextNotes[payload.nodeId] = payload.after;
        } else {
          delete nextNotes[payload.nodeId];
        }
      }
      break;
    case 'node.shape.update':
      if (payload.nodeId && 'after' in payload) {
        const after = payload.after as CanvasNodeShape | undefined;
        nextCanvas.nodes = nextCanvas.nodes.map((node) => (
          node.id === payload.nodeId ? { ...node, shape: after } : node
        ));
      }
      break;
    case 'node.style.update':
    case 'node.icon.update':
      if (payload.nodeId && isNodePatch(payload.after)) {
        const after = payload.after;
        nextCanvas.nodes = nextCanvas.nodes.map((node) => (
          node.id === payload.nodeId ? { ...node, ...after } : node
        ));
      }
      break;
    case 'node.size.update':
      if (payload.nodeId && isSizePatch(payload.after)) {
        const after = payload.after;
        nextCanvas.nodes = nextCanvas.nodes.map((node) => (
          node.id === payload.nodeId ? { ...node, width: after.width, height: after.height } : node
        ));
      }
      break;
    case 'node.lock.update':
      if (payload.nodeId && 'after' in payload) {
        const after = payload.after as unknown as boolean;
        nextCanvas.nodes = nextCanvas.nodes.map((node) => (
          node.id === payload.nodeId ? { ...node, locked: after } : node
        ));
      }
      break;
    case 'edge.create':
      if (payload.edge && !nextCanvas.edges.some((edge) => edge.id === payload.edge?.id)) {
        nextCanvas.edges.push(payload.edge);
      }
      break;
    case 'edge.delete':
      if (payload.edgeId) {
        nextCanvas.edges = nextCanvas.edges.filter((edge) => edge.id !== payload.edgeId);
      }
      break;
  }

  return { canvas: nextCanvas, nodeNotes: nextNotes };
}

function isPoint(value: unknown): value is { x: number; y: number } {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'x' in value &&
    'y' in value &&
    typeof value.x === 'number' &&
    typeof value.y === 'number',
  );
}

function isNodePatch(value: unknown): value is Partial<CanvasNode> {
  return Boolean(value && typeof value === 'object' && !('x' in value && 'y' in value));
}

function isSizePatch(value: unknown): value is { width: number; height: number } {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'width' in value &&
    'height' in value &&
    typeof value.width === 'number' &&
    typeof value.height === 'number',
  );
}

function resolveSelectionAfterEvent(selectedNodeId: string | null, event: MindmapEvent): string | null {
  if (event.type === 'node.delete' && 'nodeId' in event.payload && event.payload.nodeId === selectedNodeId) {
    return null;
  }

  if (event.type === 'node.create' && 'node' in event.payload) {
    return event.payload.node.id;
  }

  return selectedNodeId;
}

function createEventId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `evt-${prefix}-${crypto.randomUUID()}`;
  }

  return `evt-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
