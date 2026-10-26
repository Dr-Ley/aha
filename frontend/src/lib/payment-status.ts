/** Canonical payment statuses shown in the dashboard filter. */
export const PAYMENT_RECORD_STATUSES = ["pending", "completed", "cancelled"] as const;
export type PaymentRecordStatus = (typeof PAYMENT_RECORD_STATUSES)[number];

/**
 * Stored values that the payments panel treats as completed.
 * Matching is case-sensitive in the database; local aha_dev stores these lowercase.
 */
export const COMPLETED_PAYMENT_STATUSES = ["completed", "confirmed", "paid", "success", "succeeded"] as const;

/** Stored values that the payments panel treats as cancelled. */
export const CANCELLED_PAYMENT_STATUSES = ["cancelled", "refunded"] as const;

const COMPLETED = new Set<string>(COMPLETED_PAYMENT_STATUSES);
const CANCELLED = new Set<string>(CANCELLED_PAYMENT_STATUSES);

export function isPaymentRecordStatus(value: string | null | undefined): value is PaymentRecordStatus {
  return value === "pending" || value === "completed" || value === "cancelled";
}

/** Map legacy payment row statuses into the canonical dashboard set. Unknown values stay pending. */
export function normalizePaymentRecordStatus(raw: string | null | undefined): PaymentRecordStatus {
  const status = String(raw ?? "").toLowerCase();
  if (CANCELLED.has(status)) return "cancelled";
  if (COMPLETED.has(status)) return "completed";
  return "pending";
}
