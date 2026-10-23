import { nairobiYmd } from "@/lib/nairobi-date";
import type { SeriesWindow } from "@/lib/chart-period";

/**
 * Shared overview range. Calendar days use Africa/Nairobi, the company timezone
 * for AHA, EWC, and BTH (EAT, no daylight saving).
 */
export type OverviewPeriod = "today" | "week" | "month" | "year" | "all";

export const DEFAULT_OVERVIEW_PERIOD: OverviewPeriod = "month";

export const OVERVIEW_PERIODS: { id: OverviewPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
  { id: "all", label: "All years" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STORAGE_PREFIX = "aha:overview-period";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseYmd(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addDays(value: string, days: number): string {
  const t = Date.parse(`${value}T12:00:00+03:00`);
  if (!Number.isFinite(t)) return value;
  return nairobiYmd(new Date(t + days * 86_400_000));
}

function mondayOf(today: string): string {
  const dow = new Date(`${today}T12:00:00+03:00`).getUTCDay();
  const mondayOffset = dow === 0 ? 6 : dow - 1;
  return addDays(today, -mondayOffset);
}

export function isOverviewPeriod(value: unknown): value is OverviewPeriod {
  return value === "today" || value === "week" || value === "month" || value === "year" || value === "all";
}

/** One saved preset per signed-in user, on this browser. */
export function overviewPeriodStorageKey(userId: string | null | undefined): string {
  const id = String(userId ?? "").trim();
  return id ? `${STORAGE_PREFIX}:${id}` : STORAGE_PREFIX;
}

/**
 * Recorded activity window.
 * Today is that calendar day. This week is Monday–Sunday.
 * This month is the 1st through today. This year is 1 January through today
 * (January through the current month). All years has no bound.
 */
export function overviewPeriodBounds(
  period: OverviewPeriod,
  today = nairobiYmd()
): { start: string; end: string } | null {
  if (period === "all") return null;
  const parts = parseYmd(today);
  if (!parts || period === "today") return { start: today, end: today };
  if (period === "week") {
    const start = mondayOf(today);
    return { start, end: addDays(start, 6) };
  }
  if (period === "month") return { start: `${parts.y}-${pad2(parts.m)}-01`, end: today };
  return { start: `${parts.y}-01-01`, end: today };
}

/** Forward window for arrivals. Starts today and runs to the end of the preset. */
export function upcomingArrivalBounds(
  period: OverviewPeriod,
  today = nairobiYmd()
): { start: string; end: string } {
  const parts = parseYmd(today);
  if (!parts || period === "today") return { start: today, end: today };
  if (period === "week") {
    const start = mondayOf(today);
    return { start: today, end: addDays(start, 6) };
  }
  if (period === "month") {
    return { start: today, end: `${parts.y}-${pad2(parts.m)}-${pad2(daysInMonth(parts.y, parts.m))}` };
  }
  if (period === "year") return { start: today, end: `${parts.y}-12-31` };
  return { start: today, end: "9999-12-31" };
}

/** Card scope. Partial presets say "to date" so a mid-period total is not read as complete. */
export function overviewScopeLabel(period: OverviewPeriod): string {
  switch (period) {
    case "today":
      return "Today";
    case "week":
      return "Week to date";
    case "month":
      return "Month to date";
    case "year":
      return "Year to date";
    case "all":
      return "All years";
  }
}

export function upcomingScopeLabel(period: OverviewPeriod): string {
  switch (period) {
    case "today":
      return "Checking in today";
    case "week":
      return "Rest of this week";
    case "month":
      return "Rest of this month";
    case "year":
      return "Rest of this year";
    case "all":
      return "Check-in on or after today";
  }
}

function formatDay(ymd: string): string {
  const parts = parseYmd(ymd);
  if (!parts) return ymd;
  return `${parts.d} ${MONTHS[parts.m - 1]} ${parts.y}`;
}

/** Visible range next to the preset chip, including the partial-period wording. */
export function overviewRangeCaption(period: OverviewPeriod, today = nairobiYmd()): string {
  const scope = overviewScopeLabel(period);
  const bounds = overviewPeriodBounds(period, today);
  if (!bounds) return scope;
  if (bounds.start === bounds.end) return `${scope} · ${formatDay(bounds.start)}`;
  return `${scope} · ${formatDay(bounds.start)} – ${formatDay(bounds.end)}`;
}

export function inOverviewPeriod(
  value: string | null | undefined,
  period: OverviewPeriod,
  today = nairobiYmd()
): boolean {
  const bounds = overviewPeriodBounds(period, today);
  if (!bounds) return true;
  const day = String(value ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= bounds.start && day <= bounds.end;
}

export function overviewWindow(period: OverviewPeriod, today = nairobiYmd()): SeriesWindow {
  const grain = period === "all" ? "year" : period === "year" ? "month" : "day";
  return { bounds: overviewPeriodBounds(period, today), grain };
}

export function rangesOverlap(
  start: string,
  end: string,
  bounds: { start: string; end: string } | null
): boolean {
  if (!bounds) return true;
  const a = String(start ?? "").slice(0, 10);
  const b = String(end || start || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return false;
  return a <= bounds.end && b >= bounds.start;
}
