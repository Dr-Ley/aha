/** Pure payment → revenue projections (no DB). */

const REVENUE_STATUSES = new Set(["completed"]);

export function periodMonthFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function paymentCountsAsRevenue(status: string | null | undefined): boolean {
  return REVENUE_STATUSES.has(String(status ?? "").toLowerCase());
}

export type PaymentLabelInput = {
  id: number;
  currency: string;
  bookingId?: number | null;
  referenceType?: string | null;
  referenceId?: number | null;
};

export type PaymentRevenueInput = PaymentLabelInput & {
  amount: number;
  recordedAt?: Date | null;
};

export function packageLabelForPayment(p: PaymentLabelInput): string {
  if (p.referenceType === "hotel" && p.referenceId != null) {
    return `Hotel stay #${p.referenceId} — payment #${p.id}`;
  }
  if (p.referenceType === "bar" && p.referenceId != null) {
    return `Bar order #${p.referenceId} — payment #${p.id}`;
  }
  if (p.referenceType === "restaurant" && p.referenceId != null) {
    return `Restaurant order #${p.referenceId} — payment #${p.id}`;
  }
  if (p.referenceType === "tour" && p.referenceId != null) {
    return `Safari booking #${p.referenceId} — payment #${p.id}`;
  }
  if (p.bookingId != null) {
    return `Safari booking #${p.bookingId} — payment #${p.id}`;
  }
  return `Payment #${p.id} (${p.currency})`;
}

export function buildRevenueFieldsFromPayment(payment: PaymentRevenueInput): {
  amount: number;
  packageLabel: string;
  periodMonth: string;
  bookingId: number | null;
  recognizedAt: Date;
} {
  const recAt = payment.recordedAt ?? new Date();
  return {
    amount: Math.max(1, Math.round(payment.amount)),
    packageLabel: packageLabelForPayment(payment),
    periodMonth: periodMonthFromDate(recAt),
    bookingId: payment.bookingId ?? null,
    recognizedAt: recAt,
  };
}
