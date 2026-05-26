/** Calendar date YYYY-MM-DD in Africa/Nairobi (EAT, no DST). */
export function nairobiYmd(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}

/** Instant of 00:01 on the given calendar day in Nairobi, as a JavaScript Date (UTC epoch). */
export function nairobiWallClock001(ymd: string): Date {
  return new Date(`${ymd}T00:01:00+03:00`);
}

/** True once local Nairobi time is on or after 00:01 on `ymd` (same calendar day). */
export function nairobi001HasPassedOnCalendarDate(ymd: string, now: Date = new Date()): boolean {
  return now.getTime() >= nairobiWallClock001(ymd).getTime();
}
