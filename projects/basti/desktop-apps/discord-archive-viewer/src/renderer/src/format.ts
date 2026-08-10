export function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Unbekannter Zeitpunkt';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function formatDayLabel(iso: string | null): string {
  if (!iso) return 'Unbekannt';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  const ymd = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  const target = ymd(d);
  const yToday = ymd(today);
  const yYesterday = ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
  if (target === yToday) return 'Heute';
  if (target === yYesterday) return 'Gestern';
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function dayKey(iso: string | null): string {
  if (!iso) return 'unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function humanFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function getInitials(name: string) {
  if (!name) return '?';
  return name.split(/\s+/).map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function classifyFileName(name: string): 'image' | 'gif' | 'video' | 'audio' | 'file' {
  const lower = name.toLowerCase();
  if (lower.endsWith('.gif')) return 'gif';
  if (/\.(png|jpe?g|webp|bmp)$/i.test(lower)) return 'image';
  if (/\.(mp4|webm|mov|m4v|mkv)$/i.test(lower)) return 'video';
  if (/\.(mp3|ogg|wav|m4a|flac|aac)$/i.test(lower)) return 'audio';
  return 'file';
}
