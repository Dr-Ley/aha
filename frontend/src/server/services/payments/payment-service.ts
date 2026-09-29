/**
 * PaymentService (S5.T1): provider adapters + atomic Payment + Invoice + Booking writes.
 */
import { and, eq, or } from "drizzle-orm";
import {
  type FinanceTx,
  withFinanceTransaction,
} from "@/server/database/finance-db";
import { ensureSprint5Schema } from "@/server/database/ensure-sprint5";
import { emitDomainEvent } from "@/server/services/notifications";
import {
  getPaymentProvider,
  providerFromMethod,
  type PaymentProvider,
  type PaymentStatus,
  type RecordPaymentInput,
} from "@/server/services/payments/providers";
import {
  DuplicateIdempotencyError,
  financialEffectAfterPayment,
  normalizeIdempotencyKey,
  rejectDuplicateIdempotency,
} from "@/server/services/payments/record-payment-pure";
import { normalizePaymentLink } from "@/lib/payment-link";
import { isPostgresUniqueViolation } from "@/lib/pg-error";
import { bookings, hotelBookings, invoices, payments } from "@/lib/schema";
import {
  deleteRevenueForPayment,
  ensurePaymentReferenceEnumValue,
  syncRevenueFromPayment,
  type PaymentLike,
  type RevenueExecutor,
} from "@/lib/sync-payment-revenue";

export type { RecordPaymentInput } from "@/server/services/payments/providers";
export {
  PAYMENT_METHODS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  getPaymentProvider,
  providerFromMethod,
  type PaymentMethod,
  type PaymentProvider,
  type PaymentStatus,
} from "@/server/services/payments/providers";
export { DuplicateIdempotencyError } from "@/server/services/payments/record-payment-pure";

export type PaymentRow = typeof payments.$inferSelect;

export type CreatePaymentInput = RecordPaymentInput;
export type UpdatePaymentInput = {
  id: number;
  companyId: string;
  amount?: number;
  currency?: string;
  provider?: PaymentProvider | null;
  method?: string | null;
  status?: PaymentStatus;
  notes?: string | null;
  bookingId?: number | null;
  referenceType?: string | null;
  referenceId?: number | null;
  recordedAt?: Date | null;
};

type InvoiceSourceType = "tour" | "hotel";

function isInvoiceSource(value: string | null | undefined): value is InvoiceSourceType {
  return value === "tour" || value === "hotel";
}

function asRevenueExecutor(tx: FinanceTx): RevenueExecutor {
  return tx as unknown as RevenueExecutor;
}

function toPaymentLike(row: PaymentRow): PaymentLike {
  return {
    id: row.id,
    companyId: row.companyId,
    amount: row.amount,
    bookingId: row.bookingId,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    status: row.status,
    currency: row.currency,
    recordedAt: row.recordedAt,
  };
}

function emitPaymentReceivedIfCompleted(row: PaymentRow, previousStatus?: string | null): void {
  if (String(row.status).toLowerCase() !== "completed") return;
  if (previousStatus != null && String(previousStatus).toLowerCase() === "completed") return;
  emitDomainEvent({
    name: "PaymentReceived",
    companyId: row.companyId,
    payload: {
      id: row.id,
      companyId: row.companyId,
      amount: row.amount,
      currency: row.currency,
      method: row.method,
      status: row.status,
      bookingId: row.bookingId,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
    },
  });
}

/** Creates a missing invoice after the atomic write; existing invoices were already balanced in-tx. */
async function syncInvoiceAfterCommit(row: PaymentRow): Promise<void> {
  try {
    const { syncInvoiceForPaymentLink } = await import("@/lib/invoice-service");
    await syncInvoiceForPaymentLink({
      companyId: row.companyId,
      bookingId: row.bookingId,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
    });
  } catch (e) {
    console.error("syncInvoiceForPaymentLink failed:", e);
  }
}

async function sumCompletedPayments(
  tx: FinanceTx,
  companyId: string,
  referenceType: string | null,
  referenceId: number | null,
  bookingId: number | null
): Promise<number> {
  if (!referenceType && bookingId == null) return 0;

  const matchLink =
    referenceType && referenceId != null && bookingId != null && referenceType === "tour"
      ? or(
          and(eq(payments.referenceType, "tour"), eq(payments.referenceId, referenceId)),
          eq(payments.bookingId, bookingId)
        )
      : referenceType && referenceId != null
        ? and(
            eq(payments.referenceType, referenceType as NonNullable<PaymentRow["referenceType"]>),
            eq(payments.referenceId, referenceId)
          )
        : eq(payments.bookingId, bookingId!);

  const rows = await tx
    .select({ amount: payments.amount, status: payments.status })
    .from(payments)
    .where(and(eq(payments.companyId, companyId), matchLink));
  return rows
    .filter((row) => String(row.status).toLowerCase() === "completed")
    .reduce((sum, row) => sum + Math.round(Number(row.amount) || 0), 0);
}

async function applyInvoiceAndBookingBalances(tx: FinanceTx, payment: PaymentRow): Promise<void> {
  const link = normalizePaymentLink({
    bookingId: payment.bookingId,
    referenceType: payment.referenceType,
    referenceId: payment.referenceId,
  });
  if (!link.referenceType && link.bookingId == null) return;

  const paid = await sumCompletedPayments(
    tx,
    payment.companyId,
    link.referenceType,
    link.referenceId,
    link.bookingId
  );

  if (isInvoiceSource(link.referenceType) && link.referenceId != null) {
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, payment.companyId),
          eq(invoices.referenceType, link.referenceType),
          eq(invoices.referenceId, link.referenceId)
        )
      )
      .limit(1);
    if (invoice && invoice.status !== "void") {
      const effect = financialEffectAfterPayment({ total: invoice.total, completedPaid: paid });
      await tx
        .update(invoices)
        .set({
          amountPaid: effect.amountPaid,
          balance: effect.balance,
          status: effect.invoiceStatus,
          updatedAt: new Date(),
        })
        .where(and(eq(invoices.id, invoice.id), eq(invoices.companyId, payment.companyId)));
    }
  }

  if (link.referenceType === "tour" || link.bookingId != null) {
    const bookingId = link.bookingId ?? link.referenceId;
    if (bookingId != null) {
      const [booking] = await tx
        .select({
          id: bookings.id,
          totalPrice: bookings.totalPrice,
          originalAmount: bookings.originalAmount,
        })
        .from(bookings)
        .where(and(eq(bookings.id, bookingId), eq(bookings.companyId, payment.companyId)))
        .limit(1);
      if (booking) {
        const total = booking.originalAmount ?? booking.totalPrice ?? 0;
        const effect = financialEffectAfterPayment({ total, completedPaid: paid });
        await tx
          .update(bookings)
          .set({ paymentStatus: effect.bookingPaymentStatus, updatedAt: new Date() })
          .where(and(eq(bookings.id, booking.id), eq(bookings.companyId, payment.companyId)));
      }
    }
  }

  if (link.referenceType === "hotel" && link.referenceId != null) {
    const [stay] = await tx
      .select({ id: hotelBookings.id, totalAmount: hotelBookings.totalAmount })
      .from(hotelBookings)
      .where(and(eq(hotelBookings.id, link.referenceId), eq(hotelBookings.companyId, payment.companyId)))
      .limit(1);
    if (stay) {
      const effect = financialEffectAfterPayment({ total: stay.totalAmount, completedPaid: paid });
      await tx
        .update(hotelBookings)
        .set({
          paymentStatus: effect.bookingPaymentStatus,
          amountPaid: effect.amountPaid,
          updatedAt: new Date(),
        })
        .where(and(eq(hotelBookings.id, stay.id), eq(hotelBookings.companyId, payment.companyId)));
    }
  }
}

async function prepareWrite(): Promise<void> {
  await ensureSprint5Schema();
  await ensurePaymentReferenceEnumValue();
}

export async function recordPayment(input: RecordPaymentInput): Promise<PaymentRow> {
  await prepareWrite();
  const adapter = getPaymentProvider(input.provider, input.method);
  const prepared = adapter.prepare(input);
  const link = normalizePaymentLink(prepared);
  const idempotencyKey = normalizeIdempotencyKey(prepared.idempotencyKey);

  try {
    const row = await withFinanceTransaction(async (tx) => {
      if (idempotencyKey) {
        const [existing] = await tx
          .select({ id: payments.id })
          .from(payments)
          .where(and(eq(payments.companyId, prepared.companyId), eq(payments.idempotencyKey, idempotencyKey)))
          .limit(1);
        rejectDuplicateIdempotency(existing?.id ?? null);
      }

      const [inserted] = await tx
        .insert(payments)
        .values({
          companyId: prepared.companyId,
          amount: prepared.amount,
          bookingId: link.bookingId,
          referenceType: link.referenceType as PaymentRow["referenceType"],
          referenceId: link.referenceId,
          currency: prepared.currency ?? "KES",
          method: prepared.method ?? adapter.displayMethod,
          status: prepared.status ?? "pending",
          notes: prepared.notes ?? null,
          provider: adapter.id,
          idempotencyKey,
          ...(prepared.recordedAt ? { recordedAt: prepared.recordedAt } : {}),
        })
        .returning();

      await syncRevenueFromPayment(toPaymentLike(inserted), asRevenueExecutor(tx));
      await applyInvoiceAndBookingBalances(tx, inserted);
      return inserted;
    });

    emitPaymentReceivedIfCompleted(row);
    void syncInvoiceAfterCommit(row);
    return row;
  } catch (e) {
    if (e instanceof DuplicateIdempotencyError) throw e;
    if (idempotencyKey && isPostgresUniqueViolation(e)) {
      throw new DuplicateIdempotencyError();
    }
    throw e;
  }
}

export async function updatePayment(input: UpdatePaymentInput): Promise<PaymentRow | null> {
  await prepareWrite();

  const updated = await withFinanceTransaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(payments)
      .where(and(eq(payments.id, input.id), eq(payments.companyId, input.companyId)))
      .limit(1);
    if (!before) return null;

    const link = normalizePaymentLink({
      bookingId: input.bookingId !== undefined ? input.bookingId : before.bookingId,
      referenceType: input.referenceType !== undefined ? input.referenceType : before.referenceType,
      referenceId: input.referenceId !== undefined ? input.referenceId : before.referenceId,
    });

    const adapter =
      input.provider != null || input.method !== undefined
        ? getPaymentProvider(input.provider, input.method ?? before.method)
        : null;

    const updates: Partial<typeof payments.$inferInsert> = {};
    if (input.amount !== undefined) updates.amount = input.amount;
    if (input.currency !== undefined) updates.currency = input.currency;
    if (input.method !== undefined) updates.method = input.method;
    if (input.status !== undefined) updates.status = input.status;
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.recordedAt !== undefined) updates.recordedAt = input.recordedAt;
    if (adapter) {
      updates.provider = adapter.id;
      if (input.method === undefined && input.provider != null) {
        updates.method = adapter.displayMethod;
      }
    }
    if (
      input.bookingId !== undefined ||
      input.referenceType !== undefined ||
      input.referenceId !== undefined
    ) {
      updates.bookingId = link.bookingId;
      updates.referenceType = link.referenceType as PaymentRow["referenceType"];
      updates.referenceId = link.referenceId;
    }

    const row =
      Object.keys(updates).length === 0
        ? before
        : (
            await tx
              .update(payments)
              .set(updates)
              .where(and(eq(payments.id, input.id), eq(payments.companyId, input.companyId)))
              .returning()
          )[0];
    if (!row) return null;

    await syncRevenueFromPayment(toPaymentLike(row), asRevenueExecutor(tx));
    await applyInvoiceAndBookingBalances(tx, row);
    return { row, previousStatus: before.status };
  });

  if (!updated) return null;
  emitPaymentReceivedIfCompleted(updated.row, updated.previousStatus);
  void syncInvoiceAfterCommit(updated.row);
  return updated.row;
}

export async function deletePayment(
  companyId: string,
  paymentId: number
): Promise<{ id: number } | null> {
  await prepareWrite();

  const result = await withFinanceTransaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.companyId, companyId)))
      .limit(1);
    if (!before) return null;

    await deleteRevenueForPayment(companyId, paymentId, asRevenueExecutor(tx));
    const deleted = await tx
      .delete(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.companyId, companyId)))
      .returning({ id: payments.id });
    if (deleted.length === 0) return null;

    await applyInvoiceAndBookingBalances(tx, before);
    return { id: deleted[0].id, snapshot: before };
  });

  if (!result) return null;
  void syncInvoiceAfterCommit(result.snapshot);
  return { id: result.id };
}

/** @deprecated Prefer PaymentService.recordPayment */
export async function createPaymentWithRevenue(input: CreatePaymentInput): Promise<PaymentRow> {
  return recordPayment(input);
}

/** @deprecated Prefer PaymentService.updatePayment */
export async function updatePaymentWithRevenue(input: UpdatePaymentInput): Promise<PaymentRow | null> {
  return updatePayment(input);
}

/** @deprecated Prefer PaymentService.deletePayment */
export async function deletePaymentWithRevenue(
  companyId: string,
  paymentId: number
): Promise<{ id: number } | null> {
  return deletePayment(companyId, paymentId);
}

export const PaymentService = {
  recordPayment,
  updatePayment,
  deletePayment,
  providerFromMethod,
};
