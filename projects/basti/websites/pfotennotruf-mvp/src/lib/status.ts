import type { AvailabilityStatus, VetPractice } from "@/types/practice";

export const STATUS_CONFIRMATION_HOURS = 24;
export const STATUS_CONFIRMATION_MS = STATUS_CONFIRMATION_HOURS * 60 * 60 * 1000;

export function getConfirmationExpiry(lastConfirmedAt: string | null): Date | null {
  if (!lastConfirmedAt) {
    return null;
  }

  return new Date(new Date(lastConfirmedAt).getTime() + STATUS_CONFIRMATION_MS);
}

export function isConfirmationFresh(lastConfirmedAt: string | null, now = new Date()): boolean {
  const expiry = getConfirmationExpiry(lastConfirmedAt);

  if (!expiry) {
    return false;
  }

  return expiry.getTime() > now.getTime();
}

export function getEffectiveStatus(practice: VetPractice, now = new Date()): AvailabilityStatus {
  if (practice.status === "green" && !isConfirmationFresh(practice.lastConfirmedAt, now)) {
    return "gray";
  }

  return practice.status;
}

export function getStatusText(status: AvailabilityStatus): string {
  const labels: Record<AvailabilityStatus, string> = {
    green: "Erreichbarkeit heute bestätigt",
    yellow: "Nur nach telefonischer Rücksprache",
    red: "Heute nicht verfügbar",
    gray: "Status nicht aktuell bestätigt",
  };

  return labels[status];
}

export function getStatusHint(status: AvailabilityStatus): string {
  const hints: Record<AvailabilityStatus, string> = {
    green: "Diese Praxis hat ihre heutige Erreichbarkeit aktiv bestätigt.",
    yellow: "Bitte unbedingt vorher anrufen. Die Annahme kann eingeschränkt sein.",
    red: "Diese Praxis hat gemeldet, dass sie heute nicht verfügbar ist.",
    gray: "Status nicht aktuell bestätigt – bitte unbedingt telefonisch prüfen.",
  };

  return hints[status];
}
