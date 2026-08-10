export interface FrameData {
  base64_png: string;
  delay_ms: number;
}

export interface SlotState {
  role: string;
  sourcePath: string | null;
  previewData: string | null; // base64 PNG (erster Frame)
  frames: FrameData[]; // alle Frames bei ANI/GIF
  width: number;
  height: number;
  hotspotX: number;
  hotspotY: number;
  needsConversion: boolean;
  isAnimation: boolean; // Quelle ist .ani (wird kopiert)
  makeAni: boolean; // Quelle ist GIF -> animierte .ani erzeugen
  fileSize: number; // Bytes der Quelldatei
}

export type ExportFormat = 'inf' | 'zip';

export interface PreviewResult {
  base64_png: string | null;
  width: number;
  height: number;
  frames: FrameData[];
  hotspot_x: number | null;
  hotspot_y: number | null;
  file_size: number;
}

export interface FolderFile {
  path: string;
  filename: string;
  ext: string;
}

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const AVAILABLE_SIZES = [24, 32, 48, 64, 96, 128] as const;
