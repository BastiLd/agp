import { parseCanvas } from '../formats/canvasFormat';
import { parseWikilinks } from '../formats/wikilinks';
import type { VaultFile } from '../vault/vaultTypes';

export interface Backlink {
  sourceFileId: string;
  sourceFileName: string;
  target: string;
}

export function buildBacklinkIndex(files: VaultFile[]): Backlink[] {
  return files.flatMap((file) => {
    const text = file.type === 'markdown' ? file.content : getCanvasText(file.content);
    return parseWikilinks(text).map((link) => ({
      sourceFileId: file.id,
      sourceFileName: file.name,
      target: link.target,
    }));
  });
}

export function getBacklinksForFile(files: VaultFile[], fileName: string): Backlink[] {
  const baseName = fileName.replace(/\.(md|canvas)$/i, '').toLowerCase();
  return buildBacklinkIndex(files).filter((link) => {
    const target = link.target.replace(/\.(md|canvas)$/i, '').toLowerCase();
    return target === baseName || target === fileName.toLowerCase();
  });
}

function getCanvasText(source: string): string {
  try {
    return parseCanvas(source).nodes.map((node) => node.text).join('\n');
  } catch {
    return '';
  }
}
