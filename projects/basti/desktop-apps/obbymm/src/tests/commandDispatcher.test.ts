import { describe, it, expect, beforeEach } from 'vitest';
import { useEventStore } from '../commands/eventStore';
import { dispatchCommand } from '../commands/commandDispatcher';

describe('commandDispatcher and eventStore', () => {
  beforeEach(() => {
    // Reset store before each test
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

  it('creates a node and correctly logs the event', () => {
    dispatchCommand({
      type: 'node.create',
      mapId: 'test-map',
      node: { id: 'n1', type: 'text', text: 'Hello', x: 0, y: 0, width: 100, height: 50 }
    });

    const state = useEventStore.getState();
    expect(state.canvas.nodes.length).toBe(1);
    expect(state.canvas.nodes[0].text).toBe('Hello');
    expect(state.events.length).toBe(1);
    expect(state.events[0].type).toBe('node.create');
    expect(state.undoStack.length).toBe(1);
  });

  it('updates a node text', () => {
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

    const state = useEventStore.getState();
    expect(state.canvas.nodes[0].text).toBe('New');
    expect(state.events.length).toBe(2);
    expect(state.events[1].type).toBe('node.text.update');
  });

  it('updates a node note through an event', () => {
    dispatchCommand({
      type: 'node.create',
      mapId: 'test-map',
      node: { id: 'n1', type: 'text', text: 'Node', x: 0, y: 0, width: 100, height: 50 }
    });

    dispatchCommand({
      type: 'node.note.update',
      mapId: 'test-map',
      nodeId: 'n1',
      before: '',
      after: 'Remember [[Welcome]]'
    });

    const state = useEventStore.getState();
    expect(state.nodeNotes.n1).toBe('Remember [[Welcome]]');
    expect(state.events[1].type).toBe('node.note.update');
  });

  it('updates node shape, style, and icon through events', () => {
    dispatchCommand({
      type: 'node.create',
      mapId: 'test-map',
      node: { id: 'n1', type: 'text', text: 'Shape', x: 0, y: 0, width: 100, height: 50 }
    });

    dispatchCommand({
      type: 'node.shape.update',
      mapId: 'test-map',
      nodeId: 'n1',
      before: undefined,
      after: 'diamond'
    });

    dispatchCommand({
      type: 'node.style.update',
      mapId: 'test-map',
      nodeId: 'n1',
      before: { cornerRadius: undefined, fillColor: undefined, borderColor: undefined, borderWidth: undefined },
      after: { cornerRadius: 22, fillColor: '#f9f1d5', borderColor: '#b9a77a', borderWidth: 3 }
    });

    dispatchCommand({
      type: 'node.icon.update',
      mapId: 'test-map',
      nodeId: 'n1',
      before: { icon: undefined, iconPlacement: undefined },
      after: { icon: 'lightbulb', iconPlacement: 'left' }
    });

    const state = useEventStore.getState();
    expect(state.canvas.nodes[0].shape).toBe('diamond');
    expect(state.canvas.nodes[0].cornerRadius).toBe(22);
    expect(state.canvas.nodes[0].fillColor).toBe('#f9f1d5');
    expect(state.canvas.nodes[0].borderWidth).toBe(3);
    expect(state.canvas.nodes[0].icon).toBe('lightbulb');
    expect(state.canvas.nodes[0].iconPlacement).toBe('left');
    expect(state.events.map((event) => event.type)).toContain('node.style.update');
  });
});
