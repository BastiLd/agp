export function formatDateTime(value: string | Date | null): string {
  if (!value) {
    return "Noch nicht bestätigt";
  }

  return new Intl.DateTimeFormat("de-AT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatPhoneHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export function getRouteUrl(address: string, postalCode: string, city: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${address}, ${postalCode} ${city}`,
  )}`;
}
