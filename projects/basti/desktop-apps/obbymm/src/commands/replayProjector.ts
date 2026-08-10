import type { CanvasFile } from '../formats/canvasFormat';
import { createEmptyCanvas } from '../formats/canvasFormat';
import type { MindmapEvent } from './commandTypes';
import { applyEventToState } from './eventStore';

export interface ReplayProjection {
  canvas: CanvasFile;
  nodeNotes: Record<string, string>;
}

export function projectReplay(
  events: MindmapEvent[],
  eventIndex = events.length,
  initialCanvas: CanvasFile = createEmptyCanvas(),
  initialNodeNotes: Record<string, string> = {},
): ReplayProjection {
  return events.slice(0, eventIndex).reduce<ReplayProjection>(
    (state, event) => applyEventToState(state.canvas, state.nodeNotes, event),
    { canvas: initialCanvas, nodeNotes: initialNodeNotes },
  );
}
