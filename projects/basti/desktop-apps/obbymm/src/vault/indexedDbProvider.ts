const FALLBACK_KEY = 'obbymm-indexeddb-fallback-note';

export function getIndexedDbFallbackStatus(): string {
  return localStorage.getItem(FALLBACK_KEY) ?? 'localStorage fallback active for MVP';
}
