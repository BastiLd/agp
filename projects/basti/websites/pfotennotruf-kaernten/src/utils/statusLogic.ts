import { Veterinarian, VetStatus } from '../data/mockVets';

const EXPIRATION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 Hours in milliseconds

/**
 * Checks whether a given ISO confirmation string is older than 24 hours.
 */
export function isStatusExpired(lastConfirmedISO: string): boolean {
  const lastConfirmed = new Date(lastConfirmedISO).getTime();
  const now = new Date().getTime();
  return now - lastConfirmed > EXPIRATION_WINDOW_MS;
}

/**
 * Returns the effective status of a veterinarian.
 * If the status is 'green' but has not been confirmed in the last 24 hours, it degrades to 'grey'.
 */
export function getEffectiveStatus(vet: Veterinarian): VetStatus {
  if (vet.status === 'green' && isStatusExpired(vet.lastConfirmed)) {
    return 'grey';
  }
  return vet.status;
}

/**
 * Returns the expiration date for a veterinarian's status.
 */
export function getExpirationDate(lastConfirmedISO: string): Date {
  const lastConfirmed = new Date(lastConfirmedISO).getTime();
  return new Date(lastConfirmed + EXPIRATION_WINDOW_MS);
}

/**
 * Returns a human-readable remaining time string (e.g. "14 Std. 30 Min.")
 * or "Abgelaufen" if the status has expired.
 */
export function getRemainingTimeString(lastConfirmedISO: string): string {
  const expirationTime = getExpirationDate(lastConfirmedISO).getTime();
  const now = new Date().getTime();
  const diff = expirationTime - now;

  if (diff <= 0) {
    return 'Abgelaufen';
  }

  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  return `${hours} Std. ${minutes} Min.`;
}

/**
 * Formats a date into a localized German date string with time (e.g., "20. Mai 2026, 16:30 Uhr")
 */
export function formatLocalDateTime(isoString: string): string {
  if (!isoString) return 'Nie';
  const date = new Date(isoString);
  return date.toLocaleString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' Uhr';
}
