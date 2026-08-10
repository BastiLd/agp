import type { VaultFile, VaultFileType } from './vaultTypes';

export function getFileTypeFromName(name: string): VaultFileType {
  return name.toLowerCase().endsWith('.canvas') ? 'canvas' : 'markdown';
}

export function normalizeFileName(name: string, type: VaultFileType): string {
  const trimmed = name.trim() || (type === 'canvas' ? 'Untitled.canvas' : 'Untitled.md');
  const extension = type === 'canvas' ? '.canvas' : '.md';
  return trimmed.toLowerCase().endsWith(extension) ? trimmed : `${trimmed}${extension}`;
}

export function sortVaultFiles(files: VaultFile[]): VaultFile[] {
  return [...files].sort((a, b) => a.name.localeCompare(b.name));
}
