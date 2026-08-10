export interface SearchResult {
  id: string;
  fileId: string;
  fileName: string;
  kind: 'file' | 'markdown' | 'node' | 'node-note';
  label: string;
  preview: string;
}
