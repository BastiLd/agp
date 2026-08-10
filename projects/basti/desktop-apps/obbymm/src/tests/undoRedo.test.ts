import { describe, it, expect, beforeEach } from 'vitest';
import { useEventStore } from '../commands/eventStore';
import { dispatchCommand } from '../commands/commandDispatcher';

describe('undo and redo', () => {
  beforeEach(() => {
    useEventStore.setState({
      currentMapId: 'test-map',
      canvas: { nodes: [], edges: [] },
      events: [],
      undoStack: [],
      redoStack: [],
      nodeNotes: {},
      selectedNodeId: null,
    });
  });

  it('can undo and redo a node creation', () => {
    dispatchCommand({
      type: 'node.create',
      mapId: 'test-map',
      node: { id: 'n1', type: 'text', text: 'Test', x: 0, y: 0, width: 100, height: 50 }
    });

    let state = useEventStore.getState();
    expect(state.canvas.nodes.length).toBe(1);

    state.undo();
    state = useEventStore.getState();
    expect(state.canvas.nodes.length).toBe(0);
    expect(state.events[1].type).toBe('node.delete'); // The inverse event was logged

    state.redo();
    state = useEventStore.getState();
    expect(state.canvas.nodes.length).toBe(1);
    expect(state.canvas.nodes[0].text).toBe('Test');
    expect(state.events[2].type).toBe('node.create'); // Redo event logged
  });

  it('new command clears the redo stack', () => {
    dispatchCommand({
      type: 'node.create',
      mapId: 'test-map',
      node: { id: 'n1', type: 'text', text: '1', x: 0, y: 0, width: 100, height: 50 }
    });

    useEventStore.getState().undo();
    expect(useEventStore.getState().redoStack.length).toBe(1);

    dispatchCommand({
      type: 'node.create',
      mapId: 'test-map',
      node: { id: 'n2', type: 'text', text: '2', x: 0, y: 0, width: 100, height: 50 }
    });

    expect(useEventStore.getState().redoStack.length).toBe(0);
  });

  it('can undo and redo a text update', () => {
    dispatchCommand({
      type: 'node.create',
      mapId: 'test-map',
      node: { id: 'n1', type: 'text', text: 'Old', x: 0, y: 0, width: 100, height: 50 }
    });

    dispatchCommand({
      type: 'node.text.update',
      mapId: 'test-map',
      nodeId: 'n1',
      before: 'Old',
      after: 'New'
    });

    useEventStore.getState().undo();
    expect(useEventStore.getState().canvas.nodes[0].text).toBe('Old');

    useEventStore.getState().redo();
    expect(useEventStore.getState().canvas.nodes[0].text).toBe('New');
  });

  it('can undo and redo node visual styling', () => {
    dispatchCommand({
      type: 'node.create',
      mapId: 'test-map',
      node: { id: 'n1', type: 'text', text: 'Visual', x: 0, y: 0, width: 100, height: 50 }
    });

    dispatchCommand({
      type: 'node.shape.update',
      mapId: 'test-map',
      nodeId: 'n1',
      before: undefined,
      after: 'hexagon'
    });

    dispatchCommand({
      type: 'node.icon.update',
      mapId: 'test-map',
      nodeId: 'n1',
      before: { icon: undefined },
      after: { icon: 'sparkles' }
    });

    useEventStore.getState().undo();
    expect(useEventStore.getState().canvas.nodes[0].icon).toBeUndefined();

    useEventStore.getState().undo();
    expect(useEventStore.getState().canvas.nodes[0].shape).toBeUndefined();

    useEventStore.getState().redo();
    expect(useEventStore.getState().canvas.nodes[0].shape).toBe('hexagon');

    useEventStore.getState().redo();
    expect(useEventStore.getState().canvas.nodes[0].icon).toBe('sparkles');
  });
});
