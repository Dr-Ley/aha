import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isPostgresDuplicateOrAlreadyExists } from "@/lib/pg-error";
import { revenueEntries } from "@/lib/schema";

/** Payment rows that count toward recognized revenue (finance-confirmed receipts only). */
const REVENUE_STATUSES = new Set(["completed"]);

let paymentEnumEnsured = false;

/** Adds `payment` to `financial_reference_type` if the DB predates that value. */
async function ensurePaymentReferenceEnumValue(): Promise<void> {
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

function periodMonthFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type PaymentLike = {
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

async function deleteLegacySourceRevenueForPayment(payment: PaymentLike): Promise<void> {
  const sourceType = String(payment.referenceType ?? "").toLowerCase();
  if (sourceType === "tour") {
    const sourceId = payment.referenceId ?? payment.bookingId;
    if (sourceId == null) return;
    await db
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

  if (
    sourceType !== "hotel" &&
    sourceType !== "bar" &&
    sourceType !== "restaurant"
  ) {
    return;
  }
  if (payment.referenceId == null) return;
  await db
    .delete(revenueEntries)
    .where(
      and(
        eq(revenueEntries.companyId, payment.companyId),
        eq(revenueEntries.referenceType, sourceType),
        eq(revenueEntries.referenceId, payment.referenceId)
      )
    );
}

function packageLabelForPayment(p: PaymentLike): string {
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

/**
 * Keeps `revenue_entries` in sync with dashboard payments (dashboard base: KES integer amounts).
 */
export async function syncRevenueFromPayment(payment: PaymentLike): Promise<void> {
  await ensurePaymentReferenceEnumValue();
  await deleteLegacySourceRevenueForPayment(payment);
  const status = String(payment.status).toLowerCase();
  const eligible = REVENUE_STATUSES.has(status);

  const existing = await db
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
      await db.delete(revenueEntries).where(eq(revenueEntries.id, existing[0].id));
    }
    return;
  }

  const recAt = payment.recordedAt ?? new Date();
  const periodMonth = periodMonthFromDate(recAt);
  const packageLabel = packageLabelForPayment(payment);
  const amount = Math.max(1, Math.round(payment.amount));

  if (existing.length > 0) {
    await db
      .update(revenueEntries)
      .set({
        amount,
        packageLabel,
        periodMonth,
        bookingId: payment.bookingId ?? null,
        recognizedAt: recAt,
      })
      .where(eq(revenueEntries.id, existing[0].id));
    return;
  }

  await db.insert(revenueEntries).values({
    companyId: payment.companyId,
    amount,
    packageLabel,
    periodMonth,
    bookingId: payment.bookingId ?? null,
    referenceType: "payment",
    referenceId: payment.id,
    recognizedAt: recAt,
  });
}

export async function deleteRevenueForPayment(companyId: string, paymentId: number): Promise<void> {
  await ensurePaymentReferenceEnumValue();
  await db
    .delete(revenueEntries)
    .where(
      and(
        eq(revenueEntries.companyId, companyId),
        eq(revenueEntries.referenceType, "payment"),
        eq(revenueEntries.referenceId, paymentId)
      )
    );
}
