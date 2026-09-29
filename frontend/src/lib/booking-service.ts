import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookingVersions, bookings } from "@/lib/schema";
import {
  ensureBookingComponentTables,
  listComponentsForBooking,
  type BookingComponentRow,
} from "@/lib/booking-components";

export type BookingVersionRow = typeof bookingVersions.$inferSelect;

export type BookingSnapshot = {
  booking: Record<string, unknown>;
  components: Array<{
    type: string;
    cost: number;
    sequence: number;
    config: Record<string, unknown>;
  }>;
};

function toSnapshot(
  booking: typeof bookings.$inferSelect,
  components: BookingComponentRow[]
): BookingSnapshot {
  return {
    booking: {
      pricingSource: booking.pricingSource,
      bookingKind: booking.bookingKind,
      safariPackage: booking.safariPackage,
      tourId: booking.tourId,
      adults: booking.adults,
      children: booking.children,
      infants: booking.infants,
      guests: booking.guests,
      originalAmount: booking.originalAmount,
      originalCurrency: booking.originalCurrency,
      totalPrice: booking.totalPrice,
      pricePerPerson: booking.pricePerPerson,
      costStack: booking.costStack,
      accommodation: booking.accommodation,
      transport: booking.transport,
    },
    components: components.map((row) => ({
      type: row.type,
      cost: row.cost,
      sequence: row.sequence,
      config: row.config ?? {},
    })),
  };
}

export async function listBookingVersions(bookingId: number): Promise<BookingVersionRow[]> {
  await ensureBookingComponentTables();
  return db
    .select()
    .from(bookingVersions)
    .where(eq(bookingVersions.bookingId, bookingId))
    .orderBy(desc(bookingVersions.version));
}

export async function commitBookingVersion(input: {
  booking: typeof bookings.$inferSelect;
  previousSellingPrice?: number | null;
  changedByUserId?: number | null;
  changeSummary: string;
}): Promise<BookingVersionRow> {
  await ensureBookingComponentTables();
  const components = await listComponentsForBooking(input.booking.id);
  const [latest] = await db
    .select({ version: bookingVersions.version })
    .from(bookingVersions)
    .where(eq(bookingVersions.bookingId, input.booking.id))
    .orderBy(desc(bookingVersions.version))
    .limit(1);
  const nextVersion = (latest?.version ?? 0) + 1;

  await db
    .update(bookingVersions)
    .set({ isCurrent: false })
    .where(
      and(eq(bookingVersions.bookingId, input.booking.id), eq(bookingVersions.isCurrent, true))
    );

  const [row] = await db
    .insert(bookingVersions)
    .values({
      bookingId: input.booking.id,
      version: nextVersion,
      isCurrent: true,
      snapshot: toSnapshot(input.booking, components),
      sellingPrice: input.booking.originalAmount ?? input.booking.totalPrice ?? null,
      previousSellingPrice: input.previousSellingPrice ?? null,
      currency: input.booking.originalCurrency ?? "KES",
      changedByUserId: input.changedByUserId ?? null,
      changeSummary: input.changeSummary,
    })
    .returning();

  await db
    .update(bookings)
    .set({ currentVersion: nextVersion, updatedAt: new Date() })
    .where(eq(bookings.id, input.booking.id));

  return row;
}

export async function ensureInitialBookingVersion(
  booking: typeof bookings.$inferSelect,
  changedByUserId?: number | null
): Promise<void> {
  await ensureBookingComponentTables();
  const [existing] = await db
    .select({ id: bookingVersions.id })
    .from(bookingVersions)
    .where(eq(bookingVersions.bookingId, booking.id))
    .limit(1);
  if (existing) return;
  await commitBookingVersion({
    booking,
    changedByUserId,
    changeSummary: "Initial version",
  });
}

export async function deleteVersionsForBooking(bookingId: number): Promise<void> {
  await ensureBookingComponentTables();
  await db.delete(bookingVersions).where(eq(bookingVersions.bookingId, bookingId));
}

/** Used by tests — builds the audit sentence without writing. */
export function bookingPriceChangeSummary(oldPrice: number | null | undefined, newPrice: number | null | undefined) {
  const from = oldPrice == null ? "—" : String(oldPrice);
  const to = newPrice == null ? "—" : String(newPrice);
  if (from === to) return `Components updated (price ${to})`;
  return `Price ${from} → ${to}`;
}
