/**
 * Source records (safari bookings, hotel stays, F&B orders) should not create revenue directly.
 * They only create pending dashboard payments; a payment becomes revenue when finance marks it completed.
 *
 * These helpers intentionally purge legacy source-linked revenue rows so older direct-sync behavior
 * cannot duplicate the payment-based revenue flow.
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookings,
  hotelBookings,
  revenueEntries,
} from "@/lib/schema";

export async function deleteRevenueForEntity(
  companyId: string,
  referenceType: "tour" | "hotel" | "bar" | "restaurant",
  referenceId: number
): Promise<void> {
  await db
    .delete(revenueEntries)
    .where(
      and(
        eq(revenueEntries.companyId, companyId),
        eq(revenueEntries.referenceType, referenceType),
        eq(revenueEntries.referenceId, referenceId)
      )
    );
}

export async function syncRevenueFromSafariBooking(
  row: typeof bookings.$inferSelect
): Promise<void> {
  await deleteRevenueForEntity(row.companyId, "tour", row.id);
}

export async function syncRevenueFromHotelStay(
  row: typeof hotelBookings.$inferSelect
): Promise<void> {
  await deleteRevenueForEntity(row.companyId, "hotel", row.id);
}

export async function syncRevenueFromBarOrder(
  companyId: string,
  orderId: number,
  status: string
): Promise<void> {
  void status;
  await deleteRevenueForEntity(companyId, "bar", orderId);
}

export async function syncRevenueFromRestaurantOrder(
  companyId: string,
  orderId: number,
  status: string
): Promise<void> {
  void status;
  await deleteRevenueForEntity(companyId, "restaurant", orderId);
}
