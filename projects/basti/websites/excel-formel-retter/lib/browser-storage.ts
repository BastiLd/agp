/**
 * Client-seitiges Browser-Storage für Rate Limiting Fallback
 */

const STORAGE_KEY = "excel_formel_retter_requests";
const STORAGE_EXPIRY = 24 * 60 * 60 * 1000; // 24 Stunden

interface RequestRecord {
  timestamp: number;
  count: number;
}

export function getStoredRequestCount(): number {
  if (typeof window === "undefined") return 0;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return 0;

    const record: RequestRecord = JSON.parse(stored);
    const now = Date.now();

    // Wenn älter als 24 Stunden, zurücksetzen
    if (now - record.timestamp > STORAGE_EXPIRY) {
      localStorage.removeItem(STORAGE_KEY);
      return 0;
    }

    return record.count;
  } catch {
    return 0;
  }
}

export function incrementStoredRequestCount(): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    let record: RequestRecord;
    if (stored) {
      record = JSON.parse(stored);
      // Wenn älter als 24 Stunden, zurücksetzen
      if (now - record.timestamp > STORAGE_EXPIRY) {
        record = { timestamp: now, count: 1 };
      } else {
        record.count += 1;
        record.timestamp = now;
      }
    } else {
      record = { timestamp: now, count: 1 };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage errors
  }
}

export function checkClientSideLimit(limit: number = 5): boolean {
  return getStoredRequestCount() < limit;
}

