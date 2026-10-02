import { nairobiYmd } from "@/lib/nairobi-date";

export type WeekPeriod = {
  start: string;
  end: string;
};

export type WeeklyDatePreset =
  | "this_week"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "this_year"
  | "custom";

export type WeeklyLine = {
  name: string;
  quantity: number;
  sales: number;
};

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function ymd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseYmd(value: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addDaysYmd(value: string, days: number): string {
  const t = Date.parse(`${value}T12:00:00+03:00`);
  if (!Number.isFinite(t)) return value;
  return nairobiYmd(new Date(t + days * 86_400_000));
}

function weekdayMon0(value: string): number {
  const dow = new Date(`${value}T12:00:00+03:00`).getUTCDay();
  return dow === 0 ? 6 : dow - 1;
}

export function parseDmyPart(part: string): string | null {
  const m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(part.trim());
  if (!m) return null;
  const d = Number(m[1]);
  const month = Number(m[2]);
  const y = Number(m[3]);
  if (month < 1 || month > 12 || d < 1 || d > 31) return null;
  return ymd(y, month, d);
}

export function formatDmy(value: string): string {
  const p = parseYmd(value);
  if (!p) return value;
  return `${pad2(p.d)}/${pad2(p.m)}/${p.y}`;
}

/** Parse `27/06/2026 - 03/07/2026` (or en-dash) as the business week. */
export function parseWeekPeriod(label: string | null | undefined): WeekPeriod | null {
  if (!label) return null;
  const text = String(label).replace(/[–—]/g, "-").trim();
  const m = text.match(
    /(\d{1,2}[/-]\d{1,2}[/-]\d{4})\s*-\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})/
  );
  if (!m) return null;
  const start = parseDmyPart(m[1]);
  const end = parseDmyPart(m[2]);
  if (!start || !end) return null;
  return { start, end };
}

export function weekPeriodLabel(start: string, end: string): string {
  return `${formatDmy(start)} - ${formatDmy(end)}`;
}

export function formatWeekPeriod(period: WeekPeriod, style: "short" | "long" = "short"): string {
  const start = parseYmd(period.start);
  const end = parseYmd(period.end);
  if (!start || !end) return `${period.start} – ${period.end}`;
  const startMonth = (style === "long" ? MONTHS_LONG : MONTHS_SHORT)[start.m - 1];
  const endMonth = (style === "long" ? MONTHS_LONG : MONTHS_SHORT)[end.m - 1];
  const startDay = style === "long" ? String(start.d) : pad2(start.d);
  const endDay = style === "long" ? String(end.d) : pad2(end.d);
  if (start.y === end.y && start.m === end.m) {
    return `${startDay} – ${endDay} ${endMonth} ${end.y}`;
  }
  if (start.y === end.y) {
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${end.y}`;
  }
  return `${startDay} ${startMonth} ${start.y} – ${endDay} ${endMonth} ${end.y}`;
}

export function formatWeekFromLabel(
  label: string | null | undefined,
  style: "short" | "long" = "short"
): string {
  const period = parseWeekPeriod(label);
  if (!period) return label?.trim() || "Week not specified";
  return formatWeekPeriod(period, style);
}

/** A single calendar day stored as `01/10/2026` or `2026-10-01`. Week ranges are not days. */
export function parseDayLabel(label: string | null | undefined): string | null {
  if (!label) return null;
  const text = String(label).trim();
  if (!text || parseWeekPeriod(text)) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return parseDmyPart(text);
}

export function dayPeriodLabel(day: string): string {
  return formatDmy(day);
}

export function formatDayFromLabel(
  label: string | null | undefined,
  style: "short" | "long" = "short"
): string {
  const day = parseDayLabel(label);
  const parts = day ? parseYmd(day) : null;
  if (!parts) return label?.trim() || "Day not specified";
  const month = (style === "long" ? MONTHS_LONG : MONTHS_SHORT)[parts.m - 1];
  const d = style === "long" ? String(parts.d) : pad2(parts.d);
  return `${d} ${month} ${parts.y}`;
}

export function dayInRange(day: string | null, from: string, to: string): boolean {
  if (!day) return false;
  return day >= from && day <= to;
}

export function weekOverlapsRange(
  period: WeekPeriod | null,
  from: string,
  to: string
): boolean {
  if (!period) return true;
  return period.start <= to && period.end >= from;
}

/** EWC weekly records run Saturday–Friday. */
export function defaultSaturdayFridayWeek(now: Date = new Date()): WeekPeriod {
  const today = nairobiYmd(now);
  const dow = new Date(`${today}T12:00:00+03:00`).getUTCDay();
  const daysSinceSaturday = (dow + 1) % 7;
  const start = addDaysYmd(today, -daysSinceSaturday);
  return { start, end: addDaysYmd(start, 6) };
}

export function dateRangeForPreset(
  preset: WeeklyDatePreset,
  now: Date = new Date(),
  custom?: { from: string; to: string }
): { from: string; to: string } | null {
  if (preset === "custom") {
    if (!custom?.from || !custom?.to) return null;
    return custom.from <= custom.to
      ? { from: custom.from, to: custom.to }
      : { from: custom.to, to: custom.from };
  }
  const today = nairobiYmd(now);
  const parts = parseYmd(today);
  if (!parts) return null;
  if (preset === "this_week") {
    const start = addDaysYmd(today, -weekdayMon0(today));
    return { from: start, to: addDaysYmd(start, 6) };
  }
  if (preset === "this_month") {
    return { from: ymd(parts.y, parts.m, 1), to: ymd(parts.y, parts.m, daysInMonth(parts.y, parts.m)) };
  }
  if (preset === "last_month") {
    const m = parts.m === 1 ? 12 : parts.m - 1;
    const y = parts.m === 1 ? parts.y - 1 : parts.y;
    return { from: ymd(y, m, 1), to: ymd(y, m, daysInMonth(y, m)) };
  }
  if (preset === "last_3_months") {
    const startMonthIndex = parts.y * 12 + (parts.m - 1) - 2;
    const y = Math.floor(startMonthIndex / 12);
    const m = (startMonthIndex % 12) + 1;
    return { from: ymd(y, m, 1), to: today };
  }
  return { from: ymd(parts.y, 1, 1), to: ymd(parts.y, 12, 31) };
}

export function soldLines(
  items: Array<{
    name?: string | null;
    itemName?: string | null;
    quantity?: number | null;
    sales?: number | null;
    lineTotal?: number | null;
  }>
): WeeklyLine[] {
  const byName = new Map<string, WeeklyLine>();
  for (const item of items) {
    const quantity = Math.max(0, Number(item.quantity) || 0);
    const sales = Math.max(0, Number(item.sales ?? item.lineTotal) || 0);
    if (quantity <= 0 && sales <= 0) continue;
    const name = String(item.name ?? item.itemName ?? "").trim() || "Product";
    const current = byName.get(name) ?? { name, quantity: 0, sales: 0 };
    current.quantity += quantity;
    current.sales += sales;
    byName.set(name, current);
  }
  return [...byName.values()].filter((line) => line.quantity > 0 || line.sales > 0);
}

export function breakdownSummary(
  items: Array<{ name?: string | null; itemName?: string | null; quantity?: number | null }>
): string {
  return soldLines(items)
    .map((line) => `${line.name} ${line.quantity}`)
    .join(" · ");
}

export function itemsSoldTotal(items: Array<{ quantity?: number | null }>): number {
  return items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
}

export function salesTotal(items: Array<{ sales?: number | null; lineTotal?: number | null }>): number {
  return items.reduce((sum, item) => sum + Math.max(0, Number(item.sales ?? item.lineTotal) || 0), 0);
}
