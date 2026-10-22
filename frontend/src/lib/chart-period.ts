import { nairobiYmd } from "@/lib/nairobi-date";

/** Time window for dashboard charts. "month" is the default. */
export type ChartPeriod = "month" | "week" | "day" | "last3" | "year" | "all";

export const CHART_PERIOD_OPTIONS: { id: ChartPeriod; label: string }[] = [
  { id: "month", label: "This month" },
  { id: "week", label: "Weekly" },
  { id: "day", label: "Daily" },
  { id: "last3", label: "Last 3 months" },
  { id: "year", label: "Yearly" },
  { id: "all", label: "All years" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

/** Move weekly charts by whole weeks and daily charts by days. 0 is the current week or day. */
function focusDay(period: ChartPeriod, today: string, shift: number): string {
  if (shift === 0) return today;
  if (period === "week") return addDays(today, shift * 7);
  if (period === "day") return addDays(today, shift);
  return today;
}

export function chartPeriodBounds(
  period: ChartPeriod,
  today = nairobiYmd(),
  shift = 0
): { start: string; end: string } | null {
  const anchor = focusDay(period, today, shift);
  const parts = parseYmd(period === "week" || period === "day" ? anchor : today);
  if (!parts || period === "all") return null;
  if (period === "day") return { start: anchor, end: anchor };
  if (period === "week") {
    const dow = new Date(`${anchor}T12:00:00+03:00`).getUTCDay();
    const mondayOffset = dow === 0 ? 6 : dow - 1;
    const start = addDays(anchor, -mondayOffset);
    return { start, end: addDays(start, 6) };
  }
  if (period === "month") {
    return {
      start: `${parts.y}-${pad2(parts.m)}-01`,
      end: `${parts.y}-${pad2(parts.m)}-${pad2(daysInMonth(parts.y, parts.m))}`,
    };
  }
  if (period === "last3") {
    const startIndex = parts.y * 12 + (parts.m - 1) - 2;
    const startYear = Math.floor(startIndex / 12);
    const startMonth = (startIndex % 12) + 1;
    return {
      start: `${startYear}-${pad2(startMonth)}-01`,
      end: `${parts.y}-${pad2(parts.m)}-${pad2(daysInMonth(parts.y, parts.m))}`,
    };
  }
  return { start: `${parts.y}-01-01`, end: `${parts.y}-12-31` };
}

export function inChartPeriod(
  date: string | null | undefined,
  period: ChartPeriod,
  today = nairobiYmd(),
  shift = 0
): boolean {
  const ymd = String(date ?? "").slice(0, 10);
  if (!parseYmd(ymd)) return false;
  const bounds = chartPeriodBounds(period, today, shift);
  if (!bounds) return true;
  return ymd >= bounds.start && ymd <= bounds.end;
}

function bucketKey(date: string, period: ChartPeriod): string | null {
  if (!parseYmd(date)) return null;
  if (period === "all") return date.slice(0, 4);
  if (period === "last3" || period === "year") return date.slice(0, 7);
  return date;
}

function dayLabel(ymd: string, withYear: boolean): string {
  const parts = parseYmd(ymd);
  if (!parts) return ymd;
  const text = `${parts.d} ${MONTHS[parts.m - 1]}`;
  return withYear ? `${text} ${parts.y}` : text;
}

export function chartBuckets(
  period: ChartPeriod,
  today = nairobiYmd(),
  observedDates: string[] = [],
  shift = 0
): { key: string; label: string }[] {
  if (period === "all") {
    const years = observedDates
      .map((date) => Number(String(date).slice(0, 4)))
      .filter((year) => Number.isFinite(year) && year > 1900 && year < 3000);
    const current = Number(today.slice(0, 4));
    const min = years.length > 0 ? Math.min(current, ...years) : current;
    const max = years.length > 0 ? Math.max(current, ...years) : current;
    const buckets: { key: string; label: string }[] = [];
    for (let year = min; year <= max; year += 1) {
      buckets.push({ key: String(year), label: String(year) });
    }
    return buckets;
  }

  const bounds = chartPeriodBounds(period, today, shift);
  if (!bounds) return [];

  if (period === "last3" || period === "year") {
    const start = parseYmd(bounds.start);
    const end = parseYmd(bounds.end);
    if (!start || !end) return [];
    const showYear = start.y !== end.y;
    const buckets: { key: string; label: string }[] = [];
    let year = start.y;
    let month = start.m;
    while (year < end.y || (year === end.y && month <= end.m)) {
      const name = MONTHS[month - 1] ?? String(month);
      buckets.push({
        key: `${year}-${pad2(month)}`,
        label: showYear ? `${name} ${year}` : name,
      });
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return buckets;
  }

  const buckets: { key: string; label: string }[] = [];
  let cursor = bounds.start;
  let guard = 0;
  while (cursor <= bounds.end && guard < 40) {
    buckets.push({ key: cursor, label: dayLabel(cursor, period === "day") });
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return buckets;
}

export function amountSeries(
  rows: { date: string; amount: number }[],
  period: ChartPeriod,
  today = nairobiYmd(),
  shift = 0
): { label: string; amount: number }[] {
  const buckets = chartBuckets(
    period,
    today,
    rows.map((row) => row.date),
    shift
  );
  const totals = new Map(buckets.map((bucket) => [bucket.key, 0]));
  for (const row of rows) {
    if (!inChartPeriod(row.date, period, today, shift)) continue;
    const key = bucketKey(row.date, period);
    if (!key || !totals.has(key)) continue;
    totals.set(key, (totals.get(key) ?? 0) + (Number(row.amount) || 0));
  }
  return buckets.map((bucket) => ({ label: bucket.label, amount: totals.get(bucket.key) ?? 0 }));
}

export function stackedSeries<K extends string>(
  rows: Array<{ date: string } & Partial<Record<K, number>>>,
  keys: readonly K[],
  period: ChartPeriod,
  today = nairobiYmd(),
  shift = 0
): Array<{ label: string } & Record<K, number>> {
  const buckets = chartBuckets(
    period,
    today,
    rows.map((row) => row.date),
    shift
  );
  const totals = new Map(
    buckets.map((bucket) => [bucket.key, Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>])
  );
  for (const row of rows) {
    if (!inChartPeriod(row.date, period, today, shift)) continue;
    const key = bucketKey(row.date, period);
    const bucket = key ? totals.get(key) : undefined;
    if (!bucket) continue;
    for (const name of keys) bucket[name] += Number(row[name] ?? 0) || 0;
  }
  return buckets.map((bucket) => ({ label: bucket.label, ...totals.get(bucket.key)! }));
}

export function namedAmountSeries(
  rows: { date: string; name: string; amount: number }[],
  period: ChartPeriod,
  today = nairobiYmd(),
  shift = 0
): { name: string; amount: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (!inChartPeriod(row.date, period, today, shift)) continue;
    const name = row.name.trim() || "Unknown";
    totals.set(name, (totals.get(name) ?? 0) + (Number(row.amount) || 0));
  }
  return [...totals.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .filter((row) => row.amount !== 0)
    .sort((a, b) => b.amount - a.amount);
}

export function productSeries(
  rows: { date: string; name: string; quantity: number; amount: number }[],
  period: ChartPeriod,
  today = nairobiYmd(),
  shift = 0
): { name: string; quantity: number; amount: number }[] {
  const totals = new Map<string, { name: string; quantity: number; amount: number }>();
  for (const row of rows) {
    if (!inChartPeriod(row.date, period, today, shift)) continue;
    const name = row.name.trim() || "Product";
    const current = totals.get(name) ?? { name, quantity: 0, amount: 0 };
    current.quantity += Number(row.quantity) || 0;
    current.amount += Number(row.amount) || 0;
    totals.set(name, current);
  }
  return [...totals.values()]
    .filter((row) => row.quantity > 0 || row.amount > 0)
    .sort((a, b) => b.quantity - a.quantity || b.amount - a.amount);
}

export function countByName(
  rows: { date: string; name: string }[],
  period: ChartPeriod,
  today = nairobiYmd(),
  shift = 0
): { name: string; value: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (!inChartPeriod(row.date, period, today, shift)) continue;
    const name = row.name.trim() || "Unknown";
    totals.set(name, (totals.get(name) ?? 0) + 1);
  }
  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const aDays = Number.parseInt(a.name, 10);
      const bDays = Number.parseInt(b.name, 10);
      if (Number.isFinite(aDays) && Number.isFinite(bDays) && aDays !== bDays) return aDays - bDays;
      return a.name.localeCompare(b.name);
    });
}
