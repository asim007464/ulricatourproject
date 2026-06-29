/** Normalize DD-MM-YYYY or YYYY-MM-DD to YYYY-MM-DD. */
export function normalizeToIsoDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const dmY = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmY) {
    return `${dmY[3]}-${dmY[2]}-${dmY[1]}`;
  }

  return null;
}

export function parseBlockedDates(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const unique = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const iso = normalizeToIsoDate(entry);
    if (iso) unique.add(iso);
  }

  return [...unique].sort();
}

export function parseBlockedDatesInput(raw: string): string[] {
  if (!raw.trim()) return [];

  try {
    return parseBlockedDates(JSON.parse(raw));
  } catch {
    return [];
  }
}

function isoToUtcDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function eachIsoDateInRange(startIso: string, endIso: string): string[] {
  const start = isoToUtcDate(startIso);
  const end = isoToUtcDate(endIso);
  if (end.getTime() < start.getTime()) {
    return eachIsoDateInRange(endIso, startIso);
  }

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor.getTime() <= end.getTime()) {
    const year = cursor.getUTCFullYear();
    const month = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const day = String(cursor.getUTCDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function isDateBlocked(blockedDates: string[], isoDate: string) {
  return blockedDates.includes(isoDate);
}

export function isBookingRangeBlocked(
  blockedDates: string[],
  pickupDate: string,
  dropoffDate: string
) {
  const pickupIso = normalizeToIsoDate(pickupDate);
  const dropoffIso = normalizeToIsoDate(dropoffDate || pickupDate);

  if (!pickupIso || !dropoffIso) {
    return false;
  }

  return eachIsoDateInRange(pickupIso, dropoffIso).some((date) =>
    isDateBlocked(blockedDates, date)
  );
}

export function formatIsoDateForDisplay(iso: string) {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}
