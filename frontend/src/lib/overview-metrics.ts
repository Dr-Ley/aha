import {
  inOverviewPeriod,
  overviewPeriodBounds,
  rangesOverlap,
  upcomingArrivalBounds,
  type OverviewPeriod,
} from "@/lib/overview-period";

export type RevenuePaymentFact = {
  id: number;
  date: string;
  amount: number;
  status: string;
  referenceType?: string | null;
  referenceId?: number | null;
};

export type RevenueEntryFact = {
  date: string;
  amount: number;
  paymentId: number | null;
  referenceType?: string | null;
  referenceId?: number | null;
};

export type HotelStayFact = {
  checkIn: string;
  checkOut: string;
  amount: number;
  guests: number;
  status: string;
  balance: number;
};

export type OrderFact = {
  date: string;
  amount: number;
  balance: number;
};

/** Cash already taken: paid, partial, or a completed dashboard payment. */
export function paymentCountsTowardRevenue(status: string | null | undefined): boolean {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return (
    normalized === "paid" ||
    normalized === "partial" ||
    normalized === "partially_paid" ||
    normalized === "completed"
  );
}

function sourceKey(type: string | null | undefined, id: number | null | undefined): string | null {
  if (!type || id == null) return null;
  return `${type}:${id}`;
}

/**
 * Money in the period. A payment and the revenue entry it created count once.
 * Recognized revenue with no matching in-period payment is still included.
 */
export function recognizedRevenue(
  payments: RevenuePaymentFact[],
  entries: RevenueEntryFact[],
  period: OverviewPeriod,
  today?: string
): number {
  const countedPaymentIds = new Set<number>();
  const countedSources = new Set<string>();
  let sum = 0;
  for (const payment of payments) {
    if (!paymentCountsTowardRevenue(payment.status)) continue;
    if (!inOverviewPeriod(payment.date, period, today)) continue;
    sum += Number(payment.amount) || 0;
    countedPaymentIds.add(payment.id);
    const source = sourceKey(payment.referenceType, payment.referenceId);
    if (source) countedSources.add(source);
  }
  for (const entry of entries) {
    if (entry.paymentId != null && countedPaymentIds.has(entry.paymentId)) continue;
    const source = sourceKey(entry.referenceType, entry.referenceId);
    if (source && countedSources.has(source)) continue;
    if (!inOverviewPeriod(entry.date, period, today)) continue;
    sum += Number(entry.amount) || 0;
  }
  return sum;
}

export function countConfirmedBookings(
  rows: { date: string; status: string }[],
  period: OverviewPeriod,
  today?: string
): number {
  return rows.filter((row) => row.status === "confirmed" && inOverviewPeriod(row.date, period, today)).length;
}

export function countInPeriod(rows: { date: string }[], period: OverviewPeriod, today?: string): number {
  return rows.filter((row) => inOverviewPeriod(row.date, period, today)).length;
}

export function sumAmountsInPeriod(
  rows: { date: string; amount: number }[],
  period: OverviewPeriod,
  today?: string
): number {
  return rows.reduce(
    (sum, row) => sum + (inOverviewPeriod(row.date, period, today) ? Number(row.amount) || 0 : 0),
    0
  );
}

/** Headcount on stays that overlap the recorded window. Cancelled stays are left out. */
export function guestCount(stays: HotelStayFact[], period: OverviewPeriod, today?: string): number {
  const bounds = overviewPeriodBounds(period, today);
  return stays.reduce((sum, stay) => {
    if (stay.status === "cancelled") return sum;
    if (!rangesOverlap(stay.checkIn, stay.checkOut, bounds)) return sum;
    return sum + Math.max(0, Number(stay.guests) || 0);
  }, 0);
}

/** Stays still due to arrive, from today through the end of the selected preset. */
export function upcomingArrivals(stays: HotelStayFact[], period: OverviewPeriod, today?: string): number {
  const window = upcomingArrivalBounds(period, today);
  return stays.filter((stay) => {
    if (stay.status !== "pending" && stay.status !== "confirmed") return false;
    const day = String(stay.checkIn ?? "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= window.start && day <= window.end;
  }).length;
}

export function openBalance(rows: { balance: number }[]): number {
  return rows.reduce((sum, row) => sum + Math.max(0, Number(row.balance) || 0), 0);
}
