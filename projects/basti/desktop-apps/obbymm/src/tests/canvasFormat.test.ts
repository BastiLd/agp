import { describe, expect, it } from 'vitest';
import { parseCanvas, serializeCanvas } from '../formats/canvasFormat';

describe('canvasFormat', () => {
  it('roundtrips canvas files and preserves unknown top-level fields', () => {
    const canvas = parseCanvas(JSON.stringify({
      nodes: [{
        id: 'n1',
        type: 'text',
        text: 'Hello',
        x: 1,
        y: 2,
        width: 200,
        height: 90,
        shape: 'speech-bubble',
        cornerRadius: 18,
        fillColor: '#f9f1d5',
        borderColor: '#b9a77a',
        borderWidth: 2,
        shadow: 'raised',
        icon: 'lightbulb',
        iconPlacement: 'left',
      }],
      edges: [],
      unknown: { kept: true },
    }));

    const roundtrip = parseCanvas(serializeCanvas(canvas));
    expect(roundtrip.nodes[0].text).toBe('Hello');
    expect(roundtrip.nodes[0].shape).toBe('speech-bubble');
    expect(roundtrip.nodes[0].cornerRadius).toBe(18);
    expect(roundtrip.nodes[0].fillColor).toBe('#f9f1d5');
    expect(roundtrip.nodes[0].borderColor).toBe('#b9a77a');
    expect(roundtrip.nodes[0].borderWidth).toBe(2);
    expect(roundtrip.nodes[0].shadow).toBe('raised');
    expect(roundtrip.nodes[0].icon).toBe('lightbulb');
    expect(roundtrip.nodes[0].iconPlacement).toBe('left');
    expect(roundtrip.unknown).toEqual({ kept: true });
  });

  it('opens empty files as empty canvases', () => {
    expect(parseCanvas('')).toEqual({ nodes: [], edges: [] });
  });
});
