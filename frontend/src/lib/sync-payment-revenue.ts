import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isPostgresDuplicateOrAlreadyExists } from "@/lib/pg-error";
import { revenueEntries } from "@/lib/schema";
import {
  buildRevenueFieldsFromPayment,
  paymentCountsAsRevenue,
} from "@/lib/payment-revenue-pure";

export {
  buildRevenueFieldsFromPayment,
  packageLabelForPayment,
  paymentCountsAsRevenue,
  periodMonthFromDate,
} from "@/lib/payment-revenue-pure";

let paymentEnumEnsured = false;

/** Adds `payment` to `financial_reference_type` if the DB predates that value. */
export async function ensurePaymentReferenceEnumValue(): Promise<void> {
  if (paymentEnumEnsured) return;
  const check = await db.execute(sql`
    SELECT 1 AS ok
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'financial_reference_type' AND e.enumlabel = 'payment'
    LIMIT 1
  `);
  if ((check.rows as { ok?: number }[]).length > 0) {
    paymentEnumEnsured = true;
    return;
  }
  try {
    await db.execute(sql.raw(`ALTER TYPE financial_reference_type ADD VALUE 'payment'`));
  } catch (e) {
    if (!isPostgresDuplicateOrAlreadyExists(e)) {
      throw e;
    }
  }
  paymentEnumEnsured = true;
}

export type PaymentLike = {
  id: number;
  companyId: string;
  amount: number;
  bookingId: number | null;
  referenceType: string | null;
  referenceId: number | null;
  status: string;
  currency: string;
  recordedAt: Date | null;
};

/** HTTP `db` or a finance transaction client. */
export type RevenueExecutor = {
  select: typeof db.select;
  insert: typeof db.insert;
  update: typeof db.update;
  delete: typeof db.delete;
};

async function deleteLegacySourceRevenueForPayment(
  payment: PaymentLike,
  executor: RevenueExecutor
): Promise<void> {
  const sourceType = String(payment.referenceType ?? "").toLowerCase();
  if (sourceType === "tour") {
    const sourceId = payment.referenceId ?? payment.bookingId;
    if (sourceId == null) return;
    await executor
      .delete(revenueEntries)
      .where(
        and(
          eq(revenueEntries.companyId, payment.companyId),
          eq(revenueEntries.referenceType, "tour"),
          eq(revenueEntries.referenceId, sourceId)
        )
      );
    return;
  }

  if (sourceType !== "hotel" && sourceType !== "bar" && sourceType !== "restaurant") {
    return;
  }
  if (payment.referenceId == null) return;
  await executor
    .delete(revenueEntries)
    .where(
      and(
        eq(revenueEntries.companyId, payment.companyId),
        eq(revenueEntries.referenceType, sourceType),
        eq(revenueEntries.referenceId, payment.referenceId)
      )
    );
}

/**
 * Keeps `revenue_entries` in sync with dashboard payments (dashboard base: KES integer amounts).
 * Throws on DB failure so callers can roll back a wrapping transaction.
 */
export async function syncRevenueFromPayment(
  payment: PaymentLike,
  executor: RevenueExecutor = db
): Promise<void> {
  await ensurePaymentReferenceEnumValue();
  await deleteLegacySourceRevenueForPayment(payment, executor);
  const eligible = paymentCountsAsRevenue(payment.status);

  const existing = await executor
    .select({ id: revenueEntries.id })
    .from(revenueEntries)
    .where(
      and(
        eq(revenueEntries.companyId, payment.companyId),
        eq(revenueEntries.referenceType, "payment"),
        eq(revenueEntries.referenceId, payment.id)
      )
    )
    .limit(1);

  if (!eligible) {
    if (existing.length > 0) {
      await executor.delete(revenueEntries).where(eq(revenueEntries.id, existing[0].id));
    }
    return;
  }

  const fields = buildRevenueFieldsFromPayment(payment);

  if (existing.length > 0) {
    await executor
      .update(revenueEntries)
      .set({
        amount: fields.amount,
        packageLabel: fields.packageLabel,
        periodMonth: fields.periodMonth,
        bookingId: fields.bookingId,
        recognizedAt: fields.recognizedAt,
      })
      .where(eq(revenueEntries.id, existing[0].id));
    return;
  }

  await executor.insert(revenueEntries).values({
    companyId: payment.companyId,
    amount: fields.amount,
    packageLabel: fields.packageLabel,
    periodMonth: fields.periodMonth,
    bookingId: fields.bookingId,
    referenceType: "payment",
    referenceId: payment.id,
    recognizedAt: fields.recognizedAt,
  });
}

export async function deleteRevenueForPayment(
  companyId: string,
  paymentId: number,
  executor: RevenueExecutor = db
): Promise<void> {
  await ensurePaymentReferenceEnumValue();
  await executor
    .delete(revenueEntries)
    .where(
      and(
        eq(revenueEntries.companyId, companyId),
        eq(revenueEntries.referenceType, "payment"),
        eq(revenueEntries.referenceId, paymentId)
      )
    );
}
