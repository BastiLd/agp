export interface CanvasFile {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  [key: string]: unknown;
}

export type CanvasNodeShape =
  | 'rounded-rectangle'
  | 'rectangle'
  | 'square'
  | 'pill'
  | 'ellipse'
  | 'circle'
  | 'triangle'
  | 'right-triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | 'parallelogram'
  | 'trapezoid'
  | 'document'
  | 'folder'
  | 'cylinder'
  | 'cube'
  | 'speech-bubble'
  | 'callout'
  | 'cloud'
  | 'line'
  | 'elbow-connector'
  | 'curved-connector'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-both'
  | 'plus'
  | 'minus'
  | 'equals'
  | 'multiply'
  | 'bracket'
  | 'brace'
  | 'flow-process'
  | 'flow-decision'
  | 'flow-data'
  | 'flow-document'
  | 'flow-terminator'
  | 'flow-delay'
  | 'flow-preparation'
  | 'flow-database'
  | 'star'
  | 'burst'
  | 'ribbon'
  | 'star-banner';

export type CanvasNodeShadow = 'none' | 'soft' | 'raised';
export type CanvasNodeIconPlacement = 'top' | 'left' | 'right' | 'background';

export interface CanvasNode {
  id: string;
  type: 'text' | 'file' | 'link' | 'group' | 'icon';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  shape?: CanvasNodeShape;
  cornerRadius?: number;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shadow?: CanvasNodeShadow;
  icon?: string;
  iconPlacement?: CanvasNodeIconPlacement;
  locked?: boolean;
  [key: string]: unknown;
}

export type CanvasNodeStylePatch = Pick<
  CanvasNode,
  'cornerRadius' | 'fillColor' | 'borderColor' | 'borderWidth' | 'shadow'
>;

export type CanvasNodeIconPatch = Pick<CanvasNode, 'icon' | 'iconPlacement'>;

export type CanvasNodeSize = Pick<CanvasNode, 'width' | 'height'>;

export interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide?: 'top' | 'right' | 'bottom' | 'left';
  toNode: string;
  toSide?: 'top' | 'right' | 'bottom' | 'left';
  color?: string;
  label?: string;
  [key: string]: unknown;
}

export function createEmptyCanvas(): CanvasFile {
  return {
    nodes: [],
    edges: [],
  };
}

export function createStarterCanvas(title = 'Central Idea'): CanvasFile {
  return {
    nodes: [
      {
        id: createId('node'),
        type: 'text',
        text: title,
        x: 120,
        y: 120,
        width: 292,
        height: 112,
        shape: 'rounded-rectangle',
        cornerRadius: 14,
        shadow: 'soft',
        icon: 'sparkles',
        iconPlacement: 'top',
      },
    ],
    edges: [],
  };
}

export function parseCanvas(source: string): CanvasFile {
  if (!source.trim()) {
    return createEmptyCanvas();
  }

  const parsed = JSON.parse(source) as Partial<CanvasFile>;
  return {
    ...parsed,
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes.map(normalizeNode) : [],
    edges: Array.isArray(parsed.edges) ? parsed.edges.map(normalizeEdge) : [],
  };
}

export function serializeCanvas(canvas: CanvasFile): string {
  return `${JSON.stringify(canvas, null, 2)}\n`;
}

function normalizeNode(node: Partial<CanvasNode>): CanvasNode {
  return {
    ...node,
    id: String(node.id ?? createId('node')),
    type: node.type ?? 'text',
    text: String(node.text ?? ''),
    x: numberOr(node.x, 0),
    y: numberOr(node.y, 0),
    width: numberOr(node.width, 292),
    height: numberOr(node.height, 112),
    shape: normalizeShape(node.shape),
    cornerRadius: numberOr(node.cornerRadius, 14),
    borderWidth: numberOr(node.borderWidth, 1),
    shadow: normalizeShadow(node.shadow),
    iconPlacement: normalizeIconPlacement(node.iconPlacement),
  };
}

function normalizeEdge(edge: Partial<CanvasEdge>): CanvasEdge {
  return {
    ...edge,
    id: String(edge.id ?? createId('edge')),
    fromNode: String(edge.fromNode ?? ''),
    toNode: String(edge.toNode ?? ''),
  };
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeShape(value: unknown): CanvasNodeShape {
  const shapes: CanvasNodeShape[] = [
    'rounded-rectangle',
    'rectangle',
    'square',
    'pill',
    'ellipse',
    'circle',
    'triangle',
    'right-triangle',
    'diamond',
    'pentagon',
    'hexagon',
    'octagon',
    'parallelogram',
    'trapezoid',
    'document',
    'folder',
    'cylinder',
    'cube',
    'speech-bubble',
    'callout',
    'cloud',
    'line',
    'elbow-connector',
    'curved-connector',
    'arrow-right',
    'arrow-left',
    'arrow-up',
    'arrow-down',
    'arrow-both',
    'plus',
    'minus',
    'equals',
    'multiply',
    'bracket',
    'brace',
    'flow-process',
    'flow-decision',
    'flow-data',
    'flow-document',
    'flow-terminator',
    'flow-delay',
    'flow-preparation',
    'flow-database',
    'star',
    'burst',
    'ribbon',
    'star-banner',
  ];

  return shapes.includes(value as CanvasNodeShape) ? value as CanvasNodeShape : 'rounded-rectangle';
}

function normalizeShadow(value: unknown): CanvasNodeShadow {
  return value === 'none' || value === 'raised' || value === 'soft' ? value : 'soft';
}

function normalizeIconPlacement(value: unknown): CanvasNodeIconPlacement {
  return value === 'left' || value === 'right' || value === 'background' || value === 'top' ? value : 'top';
}

export function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
