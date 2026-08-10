import type {
  CanvasEdge,
  CanvasNode,
  CanvasNodeIconPatch,
  CanvasNodeShape,
  CanvasNodeSize,
  CanvasNodeStylePatch,
} from '../formats/canvasFormat';

export type MindmapEventType =
  | 'node.create'
  | 'node.delete'
  | 'node.text.update'
  | 'node.position.update'
  | 'node.note.update'
  | 'node.shape.update'
  | 'node.style.update'
  | 'node.icon.update'
  | 'node.size.update'
  | 'node.lock.update'
  | 'edge.create'
  | 'edge.delete'
  | 'undo.apply'
  | 'redo.apply';

export interface MindmapEvent {
  eventId: string;
  mapId: string;
  type: MindmapEventType;
  timestamp: number;
  actor: 'user' | 'system' | 'import' | 'replay';
  payload: MindmapEventPayload;
  inverse?: {
    type: MindmapEventType;
    payload: MindmapEventPayload;
  };
  replay?: {
    include: boolean;
    importance: 'low' | 'normal' | 'high';
    cleanReplayEligible: boolean;
  };
}

// Commands
export type Command =
  | CreateNodeCommand
  | DeleteNodeCommand
  | UpdateNodeTextCommand
  | UpdateNodePositionCommand
  | UpdateNodeNoteCommand
  | UpdateNodeShapeCommand
  | UpdateNodeStyleCommand
  | UpdateNodeIconCommand
  | UpdateNodeSizeCommand
  | UpdateNodeLockCommand
  | CreateEdgeCommand
  | DeleteEdgeCommand;

export type MindmapEventPayload =
  | { node: CanvasNode; edges?: CanvasEdge[]; note?: string }
  | { nodeId: string; edges?: CanvasEdge[]; note?: string }
  | { nodeId: string; before: string; after: string }
  | { nodeId: string; before: { x: number; y: number }; after: { x: number; y: number } }
  | { nodeId: string; before: CanvasNodeShape | undefined; after: CanvasNodeShape }
  | { nodeId: string; before: Partial<CanvasNodeStylePatch>; after: Partial<CanvasNodeStylePatch> }
  | { nodeId: string; before: Partial<CanvasNodeIconPatch>; after: Partial<CanvasNodeIconPatch> }
  | { nodeId: string; before: CanvasNodeSize; after: CanvasNodeSize }
  | { nodeId: string; before: boolean; after: boolean }
  | { edge: CanvasEdge }
  | { edgeId: string }
  | Record<string, never>;

export interface CreateNodeCommand {
  type: 'node.create';
  mapId: string;
  node: CanvasNode;
  edges?: CanvasEdge[];
  note?: string;
}

export interface DeleteNodeCommand {
  type: 'node.delete';
  mapId: string;
  nodeId: string;
}

export interface UpdateNodeTextCommand {
  type: 'node.text.update';
  mapId: string;
  nodeId: string;
  before: string;
  after: string;
}

export interface UpdateNodePositionCommand {
  type: 'node.position.update';
  mapId: string;
  nodeId: string;
  before: { x: number; y: number };
  after: { x: number; y: number };
}

export interface UpdateNodeNoteCommand {
  type: 'node.note.update';
  mapId: string;
  nodeId: string;
  before: string;
  after: string;
}

export interface UpdateNodeShapeCommand {
  type: 'node.shape.update';
  mapId: string;
  nodeId: string;
  before: CanvasNodeShape | undefined;
  after: CanvasNodeShape;
}

export interface UpdateNodeStyleCommand {
  type: 'node.style.update';
  mapId: string;
  nodeId: string;
  before: Partial<CanvasNodeStylePatch>;
  after: Partial<CanvasNodeStylePatch>;
}

export interface UpdateNodeIconCommand {
  type: 'node.icon.update';
  mapId: string;
  nodeId: string;
  before: Partial<CanvasNodeIconPatch>;
  after: Partial<CanvasNodeIconPatch>;
}

export interface UpdateNodeSizeCommand {
  type: 'node.size.update';
  mapId: string;
  nodeId: string;
  before: CanvasNodeSize;
  after: CanvasNodeSize;
}

export interface UpdateNodeLockCommand {
  type: 'node.lock.update';
  mapId: string;
  nodeId: string;
  before: boolean;
  after: boolean;
}

export interface CreateEdgeCommand {
  type: 'edge.create';
  mapId: string;
  edge: CanvasEdge;
}

export interface DeleteEdgeCommand {
  type: 'edge.delete';
  mapId: string;
  edgeId: string;
}
