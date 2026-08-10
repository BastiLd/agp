import type { Command, MindmapEvent } from './commandTypes';
import { useEventStore } from './eventStore';
import type { CanvasEdge, CanvasNode } from '../formats/canvasFormat';

export function dispatchCommand(command: Command): MindmapEvent | null {
  const state = useEventStore.getState();
  const event = createEventFromCommand(command, state.canvas.nodes, state.canvas.edges, state.nodeNotes);
  
  if (event) {
    state.applyEvent(event);
  }

  return event;
}

function createEventFromCommand(
  command: Command,
  currentNodes: CanvasNode[],
  currentEdges: CanvasEdge[],
  nodeNotes: Record<string, string>,
): MindmapEvent | null {
  const base = {
    eventId: createEventId(),
    mapId: command.mapId,
    timestamp: Date.now(),
    actor: 'user' as const,
    replay: {
      include: true,
      importance: 'normal' as const,
      cleanReplayEligible: true,
    },
  };

  switch (command.type) {
    case 'node.create':
      return {
        ...base,
        type: 'node.create',
        payload: { node: command.node, edges: command.edges, note: command.note },
        inverse: { type: 'node.delete', payload: { nodeId: command.node.id } }
      };

    case 'node.delete': {
      const nodeToDelete = currentNodes.find(n => n.id === command.nodeId);
      if (!nodeToDelete) return null;
      const connectedEdges = currentEdges.filter((edge) => edge.fromNode === command.nodeId || edge.toNode === command.nodeId);
      const note = nodeNotes[command.nodeId];
      return {
        ...base,
        type: 'node.delete',
        payload: { nodeId: command.nodeId },
        inverse: { type: 'node.create', payload: { node: nodeToDelete, edges: connectedEdges, note } }
      };
    }

    case 'node.text.update':
      if (command.before === command.after) return null;
      return {
        ...base,
        type: 'node.text.update',
        payload: { nodeId: command.nodeId, before: command.before, after: command.after },
        inverse: { type: 'node.text.update', payload: { nodeId: command.nodeId, before: command.after, after: command.before } }
      };

    case 'node.position.update':
      if (command.before.x === command.after.x && command.before.y === command.after.y) return null;
      return {
        ...base,
        type: 'node.position.update',
        payload: { nodeId: command.nodeId, before: command.before, after: command.after },
        inverse: { type: 'node.position.update', payload: { nodeId: command.nodeId, before: command.after, after: command.before } }
      };

    case 'node.note.update':
      if (command.before === command.after) return null;
      return {
        ...base,
        type: 'node.note.update',
        payload: { nodeId: command.nodeId, before: command.before, after: command.after },
        inverse: { type: 'node.note.update', payload: { nodeId: command.nodeId, before: command.after, after: command.before } }
      };

    case 'node.shape.update':
      if (command.before === command.after) return null;
      return {
        ...base,
        type: 'node.shape.update',
        payload: { nodeId: command.nodeId, before: command.before, after: command.after },
        inverse: { type: 'node.shape.update', payload: { nodeId: command.nodeId, before: command.after, after: command.before } }
      };

    case 'node.style.update':
      if (JSON.stringify(command.before) === JSON.stringify(command.after)) return null;
      return {
        ...base,
        type: 'node.style.update',
        payload: { nodeId: command.nodeId, before: command.before, after: command.after },
        inverse: { type: 'node.style.update', payload: { nodeId: command.nodeId, before: command.after, after: command.before } }
      };

    case 'node.icon.update':
      if (JSON.stringify(command.before) === JSON.stringify(command.after)) return null;
      return {
        ...base,
        type: 'node.icon.update',
        payload: { nodeId: command.nodeId, before: command.before, after: command.after },
        inverse: { type: 'node.icon.update', payload: { nodeId: command.nodeId, before: command.after, after: command.before } }
      };

    case 'node.size.update':
      if (command.before.width === command.after.width && command.before.height === command.after.height) return null;
      return {
        ...base,
        type: 'node.size.update',
        payload: { nodeId: command.nodeId, before: command.before, after: command.after },
        inverse: { type: 'node.size.update', payload: { nodeId: command.nodeId, before: command.after, after: command.before } }
      };

    case 'node.lock.update':
      if (command.before === command.after) return null;
      return {
        ...base,
        type: 'node.lock.update',
        payload: { nodeId: command.nodeId, before: command.before, after: command.after },
        inverse: { type: 'node.lock.update', payload: { nodeId: command.nodeId, before: command.after, after: command.before } }
      };

    case 'edge.create':
      if (command.edge.fromNode === command.edge.toNode) return null;
      return {
        ...base,
        type: 'edge.create',
        payload: { edge: command.edge },
        inverse: { type: 'edge.delete', payload: { edgeId: command.edge.id } }
      };

    case 'edge.delete': {
      const edgeToDelete = currentEdges.find((edge) => edge.id === command.edgeId);
      if (!edgeToDelete) return null;
      return {
        ...base,
        type: 'edge.delete',
        payload: { edgeId: command.edgeId },
        inverse: { type: 'edge.create', payload: { edge: edgeToDelete } }
      };
    }

    default:
      return null;
  }
}

function createEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `evt-${crypto.randomUUID()}`;
  }

  return `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
