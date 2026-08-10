export interface SidecarMeta {
  app: 'ObbyMM';
  schemaVersion: number;
  canvasFile: string;
  title: string;
  layoutMode: 'free' | 'auto' | 'hybrid';
  theme: 'system' | 'light' | 'dark';
  replay: {
    enabled: boolean;
    retention: 'forever' | 'last_1000_events' | 'last_30_days';
    defaultMode: 'real' | 'clean';
    privateNodesExcluded: boolean;
  };
  nodeSettings?: Record<string, { private?: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export interface SidecarPayload {
  meta: SidecarMeta;
  replayJsonl: string;
  nodeNotes: Record<string, string>;
}

export function createDefaultMeta(canvasFileName: string, title: string): SidecarMeta {
  return {
    app: 'ObbyMM',
    schemaVersion: 1,
    canvasFile: canvasFileName,
    title: title,
    layoutMode: 'free',
    theme: 'system',
    replay: {
      enabled: true,
      retention: 'forever',
      defaultMode: 'real',
      privateNodesExcluded: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function serializeReplayJsonl(events: unknown[]): string {
  return events.map((event) => JSON.stringify(event)).join('\n');
}

export function parseReplayJsonl(source: string): unknown[] {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
