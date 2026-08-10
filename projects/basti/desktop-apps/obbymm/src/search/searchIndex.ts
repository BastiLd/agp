import type { CanvasFile } from '../formats/canvasFormat';
import { parseCanvas } from '../formats/canvasFormat';
import type { VaultFile } from '../vault/vaultTypes';
import type { SearchResult } from './searchTypes';

export function buildSearchResults(files: VaultFile[], query: string): SearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return files.flatMap((file) => {
    const results: SearchResult[] = [];
    if (file.name.toLowerCase().includes(normalizedQuery)) {
      results.push({
        id: `${file.id}:file`,
        fileId: file.id,
        fileName: file.name,
        kind: 'file',
        label: file.name,
        preview: file.path,
      });
    }

    if (file.type === 'markdown' && file.content.toLowerCase().includes(normalizedQuery)) {
      results.push({
        id: `${file.id}:markdown`,
        fileId: file.id,
        fileName: file.name,
        kind: 'markdown',
        label: file.name,
        preview: previewAround(file.content, normalizedQuery),
      });
    }

    if (file.type === 'canvas') {
      results.push(...searchCanvas(file, normalizedQuery));
    }

    return results;
  });
}

function searchCanvas(file: VaultFile, query: string): SearchResult[] {
  let canvas: CanvasFile;
  try {
    canvas = parseCanvas(file.content);
  } catch {
    return [];
  }

  const nodeTextResults = canvas.nodes
    .filter((node) => node.text.toLowerCase().includes(query))
    .map<SearchResult>((node) => ({
      id: `${file.id}:node:${node.id}`,
      fileId: file.id,
      fileName: file.name,
      kind: 'node',
      label: node.text,
      preview: `Node in ${file.name}`,
    }));

  const nodeNoteResults = Object.entries(file.nodeNotes ?? {})
    .filter(([, note]) => note.toLowerCase().includes(query))
    .map<SearchResult>(([nodeId, note]) => ({
      id: `${file.id}:node-note:${nodeId}`,
      fileId: file.id,
      fileName: file.name,
      kind: 'node-note',
      label: `Note on ${nodeId}`,
      preview: previewAround(note, query),
    }));

  return [...nodeTextResults, ...nodeNoteResults];
}

function previewAround(content: string, query: string): string {
  const lower = content.toLowerCase();
  const index = lower.indexOf(query);
  const start = Math.max(0, index - 32);
  const end = Math.min(content.length, index + query.length + 48);
  return content.slice(start, end).replace(/\s+/g, ' ').trim();
}
