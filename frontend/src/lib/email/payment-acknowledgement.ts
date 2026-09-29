import { db } from "@/lib/db";
import { bookings, customers, hotelBookings } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { emitDomainEvent } from "@/server/services/notifications";

export type PaymentAckLike = {
  id: number;
  companyId: string;
  amount: number;
  currency: string;
  method: string | null;
  status: string;
  bookingId: number | null;
  referenceType: string | null;
  referenceId: number | null;
};

export type PaymentAckRecipient = {
  email: string;
  guestName: string | null;
};

export async function resolvePaymentAckRecipient(
  payment: PaymentAckLike
): Promise<PaymentAckRecipient | null> {
  const companyId = payment.companyId;
  const refType = String(payment.referenceType ?? "").toLowerCase();
  const refId = payment.referenceId;

  if ((refType === "tour" || refType === "") && (refId != null || payment.bookingId != null)) {
    const bookingId = payment.bookingId ?? refId;
    if (bookingId == null) return null;
    const [row] = await db
      .select({
        email: bookings.email,
        firstName: bookings.firstName,
        lastName: bookings.lastName,
      })
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.companyId, companyId)))
      .limit(1);
    if (!row?.email?.trim()) return null;
    const guestName = [row.firstName, row.lastName].filter(Boolean).join(" ").trim() || null;
    return { email: row.email.trim(), guestName };
  }

  if (refType === "hotel" && refId != null) {
    const [row] = await db
      .select({
        primaryGuestEmail: hotelBookings.primaryGuestEmail,
        primaryGuestName: hotelBookings.primaryGuestName,
        customerId: hotelBookings.customerId,
      })
      .from(hotelBookings)
      .where(and(eq(hotelBookings.id, refId), eq(hotelBookings.companyId, companyId)))
      .limit(1);
    if (!row) return null;
    let email = row.primaryGuestEmail?.trim() || null;
    let guestName = row.primaryGuestName?.trim() || null;
    if (!email && row.customerId != null) {
      const [cust] = await db
        .select({
          email: customers.email,
          firstName: customers.firstName,
          lastName: customers.lastName,
        })
        .from(customers)
        .where(and(eq(customers.id, row.customerId), eq(customers.companyId, companyId)))
        .limit(1);
      if (cust?.email?.trim()) {
        email = cust.email.trim();
        if (!guestName) {
          guestName = [cust.firstName, cust.lastName].filter(Boolean).join(" ").trim() || null;
        }
      }
    }
    if (!email) return null;
    return { email, guestName };
  }

  return null;
}

/**
 * Fires PaymentReceived when a payment becomes completed.
 * Email send is async and is not awaited.
 */
export async function maybeSendPaymentAcknowledgement(
  payment: PaymentAckLike,
  options?: { previousStatus?: string | null }
): Promise<void> {
  if (String(payment.status).toLowerCase() !== "completed") return;
  const prev = options?.previousStatus != null ? String(options.previousStatus).toLowerCase() : null;
  if (prev === "completed") return;
  emitDomainEvent({
    name: "PaymentReceived",
    companyId: payment.companyId,
    payload: payment,
  });
}
