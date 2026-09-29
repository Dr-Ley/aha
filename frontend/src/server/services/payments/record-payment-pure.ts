import {
  invoiceBalance,
  invoicePaymentStatus,
  invoiceRecordStatus,
  type InvoicePayStatus,
  type InvoiceRecordStatus,
} from "@/lib/invoice-balance";
import { paymentCountsAsRevenue } from "@/lib/payment-revenue-pure";

export class DuplicateIdempotencyError extends Error {
  readonly existingPaymentId: number | null;

  constructor(existingPaymentId?: number | null) {
    super("Duplicate payment idempotency key");
    this.name = "DuplicateIdempotencyError";
    this.existingPaymentId = existingPaymentId ?? null;
  }
}

export function normalizeIdempotencyKey(key?: string | null): string | null {
  const trimmed = key?.trim() ?? "";
  return trimmed.length > 0 ? trimmed.slice(0, 128) : null;
}

export function rejectDuplicateIdempotency(existingId: number | null | undefined): void {
  if (existingId != null) {
    throw new DuplicateIdempotencyError(existingId);
  }
}

export function financialEffectAfterPayment(input: {
  total: number;
  completedPaid: number;
}): {
  amountPaid: number;
  balance: number;
  invoiceStatus: InvoiceRecordStatus;
  bookingPaymentStatus: InvoicePayStatus;
} {
  const amountPaid = Math.max(0, Math.round(Number(input.completedPaid) || 0));
  return {
    amountPaid,
    balance: invoiceBalance(input.total, amountPaid),
    invoiceStatus: invoiceRecordStatus(input.total, amountPaid),
    bookingPaymentStatus: invoicePaymentStatus(input.total, amountPaid),
  };
}

export function completedSumAfterStatusChange(input: {
  previousStatus: string;
  nextStatus: string;
  previousCompletedSum: number;
  previousAmount: number;
  nextAmount: number;
}): number {
  let sum = Math.max(0, Math.round(Number(input.previousCompletedSum) || 0));
  if (paymentCountsAsRevenue(input.previousStatus)) {
    sum -= Math.round(Number(input.previousAmount) || 0);
  }
  if (paymentCountsAsRevenue(input.nextStatus)) {
    sum += Math.round(Number(input.nextAmount) || 0);
  }
  return Math.max(0, sum);
}
