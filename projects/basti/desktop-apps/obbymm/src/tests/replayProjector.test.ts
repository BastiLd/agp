import { describe, expect, it } from 'vitest';
import type { MindmapEvent } from '../commands/commandTypes';
import { projectReplay } from '../commands/replayProjector';

describe('projectReplay', () => {
  it('reconstructs canvas state at an event index', () => {
    const events: MindmapEvent[] = [
      {
        eventId: 'e1',
        mapId: 'map',
        type: 'node.create',
        timestamp: 1,
        actor: 'user',
        payload: {
          node: { id: 'n1', type: 'text', text: 'One', x: 0, y: 0, width: 100, height: 50 },
        },
      },
      {
        eventId: 'e2',
        mapId: 'map',
        type: 'node.text.update',
        timestamp: 2,
        actor: 'user',
        payload: { nodeId: 'n1', before: 'One', after: 'Two' },
      },
    ];

    expect(projectReplay(events, 1).canvas.nodes[0].text).toBe('One');
    expect(projectReplay(events).canvas.nodes[0].text).toBe('Two');
  });
});
