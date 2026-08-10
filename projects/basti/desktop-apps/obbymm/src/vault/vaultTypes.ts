import type { MindmapEvent } from '../commands/commandTypes';

export type VaultFileType = 'markdown' | 'canvas';

export interface VaultFile {
  id: string;
  name: string;
  path: string;
  type: VaultFileType;
  content: string;
  updatedAt: number;
  events?: MindmapEvent[];
  nodeNotes?: Record<string, string>;
}

export interface VaultStateSnapshot {
  files: VaultFile[];
  activeFileId: string | null;
}
