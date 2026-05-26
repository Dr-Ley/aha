/**
 * When safari bookings, hotel stays, bar, or restaurant orders are marked fully paid,
 * ensure a matching dashboard `payments` row exists (pending, method unset) for finance review.
 */
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { barOrderItems, bookings, hotelBookings, payments, restaurantOrderItems } from "@/lib/schema";

const AUTO_NOTE =
  "Auto-logged when marked paid — set payment method and move status to completed when confirmed.";

const DEFAULT_CURRENCY = "KES";

async function sumBarOrderTotal(orderId: number): Promise<number> {
  const lines = await db.select().from(barOrderItems).where(eq(barOrderItems.orderId, orderId));
  return lines.reduce((s, l) => s + l.lineTotal, 0);
}

async function sumRestaurantOrderTotal(orderId: number): Promise<number> {
  const lines = await db
    .select()
    .from(restaurantOrderItems)
    .where(eq(restaurantOrderItems.orderId, orderId));
  return lines.reduce((s, l) => s + l.lineTotal, 0);
}

export async function ensureDashboardPaymentForPaidSafariBooking(
  row: (typeof bookings)["$inferSelect"]
): Promise<void> {
  const ps = row.paymentStatus;
  if (ps !== "paid" && ps !== "partial") return;

  const dup = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.companyId, row.companyId),
        or(eq(payments.bookingId, row.id), and(eq(payments.referenceType, "tour"), eq(payments.referenceId, row.id)))
      )
    )
    .limit(1);
  if (dup.length > 0) return;

  const amount = Math.max(1, row.totalPrice ?? 0);

  await db.insert(payments).values({
    companyId: row.companyId,
    bookingId: row.id,
    referenceType: "tour",
    referenceId: row.id,
    amount,
    currency: DEFAULT_CURRENCY,
    status: "pending",
    method: null,
    notes: `${AUTO_NOTE} Safari booking #${row.id}.`,
  });
}

export async function ensureDashboardPaymentForPaidHotelStay(
  row: (typeof hotelBookings)["$inferSelect"]
): Promise<void> {
  const ps = row.paymentStatus;
  if (ps !== "paid" && ps !== "partial") return;

  const dup = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.companyId, row.companyId),
        eq(payments.referenceType, "hotel"),
        eq(payments.referenceId, row.id)
      )
    )
    .limit(1);
  if (dup.length > 0) return;

  const amount =
    row.paymentStatus === "paid"
      ? Math.max(1, row.totalAmount ?? 0)
      : Math.max(1, row.amountPaid ?? 0);

  await db.insert(payments).values({
    companyId: row.companyId,
    bookingId: null,
    referenceType: "hotel",
    referenceId: row.id,
    amount,
    currency: DEFAULT_CURRENCY,
    status: "pending",
    method: null,
    notes: `${AUTO_NOTE} Hotel stay #${row.id}.`,
  });
}

export async function ensureDashboardPaymentForPaidBarOrder(
  companyId: string,
  orderId: number,
  status: string
): Promise<void> {
  const s = String(status).toLowerCase();
  if (s !== "paid" && s !== "partially_paid") return;

  const dup = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(eq(payments.companyId, companyId), eq(payments.referenceType, "bar"), eq(payments.referenceId, orderId))
    )
    .limit(1);
  if (dup.length > 0) return;

  const total = await sumBarOrderTotal(orderId);
  const amount = Math.max(1, total);

  await db.insert(payments).values({
    companyId,
    bookingId: null,
    referenceType: "bar",
    referenceId: orderId,
    amount,
    currency: DEFAULT_CURRENCY,
    status: "pending",
    method: null,
    notes: `${AUTO_NOTE} Bar order #${orderId}.`,
  });
}

export async function ensureDashboardPaymentForPaidRestaurantOrder(
  companyId: string,
  orderId: number,
  status: string
): Promise<void> {
  const s = String(status).toLowerCase();
  if (s !== "paid" && s !== "partially_paid") return;

  const dup = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.companyId, companyId),
        eq(payments.referenceType, "restaurant"),
        eq(payments.referenceId, orderId)
      )
    )
    .limit(1);
  if (dup.length > 0) return;

  const total = await sumRestaurantOrderTotal(orderId);
  const amount = Math.max(1, total);

  await db.insert(payments).values({
    companyId,
    bookingId: null,
    referenceType: "restaurant",
    referenceId: orderId,
    amount,
    currency: DEFAULT_CURRENCY,
    status: "pending",
    method: null,
    notes: `${AUTO_NOTE} Restaurant order #${orderId}.`,
  });
}
