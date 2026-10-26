/** Calendar date YYYY-MM-DD in Africa/Nairobi (EAT, no DST). */
export function nairobiYmd(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}

/** Calendar month YYYY-MM for an instant in Africa/Nairobi. */
export function nairobiYearMonth(d: Date = new Date()): string {
  return nairobiYmd(d).slice(0, 7);
}

/**
 * Month of a stored YYYY-MM-DD value. The calendar day is not reinterpreted,
 * including when the string continues with a time.
 */
export function yearMonthPrefix(value: string): string | null {
  const ymd = value.slice(0, 10);
  return /^\d{4}-\d{2}/.test(ymd) ? ymd.slice(0, 7) : null;
}

/** Oldest first. `count` calendar months ending at `now` in Nairobi. */
export function lastNairobiMonthKeys(count = 6, now = new Date()): string[] {
  const [yearText, monthText] = nairobiYmd(now).split("-");
  let year = Number(yearText);
  let month = Number(monthText);
  const keys: string[] = [];
  for (let i = 0; i < count; i++) {
    keys.push(`${year}-${String(month).padStart(2, "0")}`);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return keys.reverse();
}

/** Inclusive Nairobi midnight of `ymd`, and exclusive midnight of the next calendar day after `end`. */
export function nairobiRange(start: string, end: string): { from: Date; to: Date } {
  const from = new Date(`${start}T00:00:00+03:00`);
  const to = new Date(new Date(`${end}T00:00:00+03:00`).getTime() + 86_400_000);
  return { from, to };
}

/** UTC day bounds matching `Date.prototype.toISOString().slice(0, 10)`. */
export function utcDayRange(start: string, end: string): { from: Date; to: Date } {
  const from = new Date(`${start}T00:00:00.000Z`);
  const to = new Date(new Date(`${end}T00:00:00.000Z`).getTime() + 86_400_000);
  return { from, to };
}

/** Instant of 00:01 on the given calendar day in Nairobi, as a JavaScript Date (UTC epoch). */
export function nairobiWallClock001(ymd: string): Date {
  return new Date(`${ymd}T00:01:00+03:00`);
}

/** True once local Nairobi time is on or after 00:01 on `ymd` (same calendar day). */
export function nairobi001HasPassedOnCalendarDate(ymd: string, now: Date = new Date()): boolean {
  return now.getTime() >= nairobiWallClock001(ymd).getTime();
}
