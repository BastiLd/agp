import { useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import type {
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { dispatchCommand } from '../commands/commandDispatcher';
import { useEventStore } from '../commands/eventStore';
import { createId } from '../formats/canvasFormat';
import type { CanvasEdge } from '../formats/canvasFormat';
import { CanvasViewport } from './CanvasViewport';
import { EditorToolbar } from './EditorToolbar';
import { NodeCard } from './NodeCard';

const nodeTypes = {
  obbyNode: NodeCard,
};

type CanvasSide = NonNullable<CanvasEdge['fromSide']>;

type FlowNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  selected: boolean;
  draggable: boolean;
    data: {
      text: string;
      color?: string;
      shape?: string;
      cornerRadius?: number;
      fillColor?: string;
      borderColor?: string;
      borderWidth?: number;
      shadow?: string;
      icon?: string;
      iconPlacement?: string;
      locked?: boolean;
      nodeType?: string;
    };
  style: {
    width: number;
    minHeight: number;
  };
};

type FlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: CanvasSide;
  targetHandle?: CanvasSide;
  type: string;
  label?: string;
  animated: boolean;
};

interface MindmapEditorProps {
  mapId: string;
}

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { strokeWidth: 1.35 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 14,
    height: 14,
  },
};

function readHandleSide(handleId: string | null | undefined): CanvasSide | undefined {
  if (handleId === 'top' || handleId === 'right' || handleId === 'bottom' || handleId === 'left') {
    return handleId;
  }

  return undefined;
}

export default function MindmapEditor({ mapId }: MindmapEditorProps) {
  const canvas = useEventStore((state) => state.canvas);
  const selectedNodeId = useEventStore((state) => state.selectedNodeId);
  const selectNode = useEventStore((state) => state.selectNode);
  const isReplaying = useEventStore((state) => state.isReplaying);

  const domainNodes = useMemo<FlowNode[]>(() => canvas.nodes.map((node) => ({
    id: node.id,
    type: 'obbyNode',
    position: { x: node.x, y: node.y },
    selected: node.id === selectedNodeId,
    draggable: !(node.locked ?? false),
    data: {
      text: node.text,
      color: node.color,
      shape: node.shape,
      cornerRadius: node.cornerRadius,
      fillColor: node.fillColor,
      borderColor: node.borderColor,
      borderWidth: node.borderWidth,
      shadow: node.shadow,
      icon: node.icon,
      iconPlacement: node.iconPlacement,
      locked: node.locked,
      nodeType: node.type,
    },
    style: {
      width: Math.max(node.width, 48),
      minHeight: Math.max(node.height, 48),
    },
  })), [canvas.nodes, selectedNodeId]);

  const domainEdges = useMemo<FlowEdge[]>(() => canvas.edges.map((edge) => ({
    id: edge.id,
    source: edge.fromNode,
    target: edge.toNode,
    sourceHandle: edge.fromSide,
    targetHandle: edge.toSide,
    type: 'smoothstep',
    label: edge.label,
    animated: false,
  })), [canvas.edges]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(domainNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(domainEdges);

  useEffect(() => {
    setFlowNodes(domainNodes);
  }, [domainNodes, setFlowNodes]);

  useEffect(() => {
    setFlowEdges(domainEdges);
  }, [domainEdges, setFlowEdges]);

  const onNodeClick = useCallback((_: unknown, node: FlowNode) => {
    selectNode(node.id);
  }, [selectNode]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onNodeDragStop = useCallback((_: unknown, node: FlowNode) => {
    const originalNode = canvas.nodes.find((candidate) => candidate.id === node.id);
    if (!originalNode) return;
    if (originalNode.locked) return; // Don't dispatch move for locked nodes

    dispatchCommand({
      type: 'node.position.update',
      mapId,
      nodeId: node.id,
      before: { x: originalNode.x, y: originalNode.y },
      after: { x: node.position.x, y: node.position.y },
    });
  }, [canvas.nodes, mapId]);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    dispatchCommand({
      type: 'edge.create',
      mapId,
      edge: {
        id: createId('edge'),
        fromNode: connection.source,
        fromSide: readHandleSide(connection.sourceHandle) ?? 'right',
        toNode: connection.target,
        toSide: readHandleSide(connection.targetHandle) ?? 'left',
      },
    });
  }, [mapId]);

  return (
    <CanvasViewport>
      <EditorToolbar mapId={mapId} nodeCount={canvas.nodes.length} />
      {isReplaying && (
        <div className="replay-overlay">
          <span className="replay-overlay-badge">▶ Replay</span>
        </div>
      )}
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={defaultEdgeOptions}
        deleteKeyCode={null}
        fitView
        nodesDraggable={!isReplaying}
        nodesConnectable={!isReplaying}
      >
        <Background gap={28} size={1} />
      </ReactFlow>
    </CanvasViewport>
  );
}
