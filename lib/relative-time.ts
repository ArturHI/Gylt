const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** Midnight at the start of the given date, in the local time zone. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * "today", "tomorrow", "in 3 days", "in 2 weeks".
 *
 * Counts calendar days rather than 24-hour blocks, so something due at
 * 9am tomorrow reads "tomorrow" even when that is only 10 hours away.
 */
export function formatRelativeDay(due: Date, now: Date = new Date()): string {
  // Math.round absorbs the 23- and 25-hour days around daylight saving changes.
  const days = Math.round((startOfDay(due) - startOfDay(now)) / DAY_MS);

  if (Math.abs(days) >= 14) {
    return relative.format(Math.round(days / 7), "week");
  }
  return relative.format(days, "day");
}

/** "today", "tomorrow", then "Mon, Oct 12" for anything further out. */
export function formatDayHeading(date: Date, now: Date = new Date()): string {
  const days = Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS);

  if (days === 0 || days === 1) return relative.format(days, "day");
  return date.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Reads a plain date like "2026-10-12" as midnight in the local time zone.
 *
 * `new Date("2026-10-12")` would mean midnight UTC instead, which is still
 * the evening of the 11th in Oklahoma.
 */
export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** True when the due date is still ahead of us and less than `hours` away. */
export function isDueWithin(due: Date, hours: number, now: Date = new Date()): boolean {
  const msLeft = due.getTime() - now.getTime();
  return msLeft >= 0 && msLeft <= hours * HOUR_MS;
}
