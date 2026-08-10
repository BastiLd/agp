import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../store';
import { CURSOR_ROLES } from '../cursorRoles';
import { PreviewResult } from '../types';

export const SUPPORTED_EXTENSIONS = ['cur', 'ani', 'png', 'jpg', 'jpeg', 'bmp', 'gif', 'ico', 'webp'];

export function fileName(path: string): string {
  return path.split(/[/\\]/).pop() ?? path;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AssignOptions {
  /** Gespeicherten Hotspot wiederherstellen (Session-Restore) */
  hotspot?: [number, number];
  /** Keine Erfolgs-/Fehlermeldungen zeigen (Session-Restore) */
  silent?: boolean;
}

/**
 * Weist eine Datei einem Cursor-Slot zu.
 * Fehler erscheinen als Toast statt still in der Konsole zu verschwinden.
 */
export async function assignFileToSlot(
  role: string,
  path: string,
  opts: AssignOptions = {}
): Promise<boolean> {
  const { setSlot, addToast } = useStore.getState();

  const roleDef = CURSOR_ROLES.find(r => r.key === role);
  if (!roleDef) return false;

  const name = fileName(path);
  const ext = name.includes('.') ? (name.split('.').pop()?.toLowerCase() ?? '') : '';

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    if (!opts.silent) {
      addToast('error', `"${name}" wird nicht unterstützt (erlaubt: ${SUPPORTED_EXTENSIONS.join(', ')})`);
    }
    return false;
  }

  const isAni = ext === 'ani';
  const isGif = ext === 'gif';
  const needsConversion = !['cur', 'ani'].includes(ext);

  try {
    const result = await invoke<PreviewResult>('read_cursor_preview', { path });

    // Hotspot-Priorität: gespeichert > aus Datei gelesen > Rollen-Standard
    let hx: number, hy: number;
    if (opts.hotspot) {
      [hx, hy] = opts.hotspot;
    } else if (result.hotspot_x !== null && result.hotspot_y !== null) {
      hx = result.hotspot_x;
      hy = result.hotspot_y;
    } else {
      [hx, hy] = roleDef.defaultHotspot;
    }

    setSlot(role, {
      sourcePath: path,
      previewData: result.base64_png,
      frames: result.frames ?? [],
      width: result.width,
      height: result.height,
      hotspotX: Math.min(Math.max(0, hx), Math.max(0, result.width - 1)),
      hotspotY: Math.min(Math.max(0, hy), Math.max(0, result.height - 1)),
      needsConversion,
      isAnimation: isAni,
      makeAni: isGif && (result.frames?.length ?? 0) > 1,
      fileSize: result.file_size,
    });
    return true;
  } catch (e) {
    if (!opts.silent) {
      addToast('error', `"${name}" konnte nicht gelesen werden: ${String(e)}`);
    }
    return false;
  }
}
