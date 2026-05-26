import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, hotelBookings, notifications } from "@/lib/schema";
import { nairobi001HasPassedOnCalendarDate, nairobiWallClock001, nairobiYmd } from "@/lib/nairobi-date";

function safariStartYmd(b: { startDate: string | null; travelDate: string }): string | null {
  const raw = (b.startDate || b.travelDate || "").trim();
  if (raw.length >= 10) return raw.slice(0, 10);
  return null;
}

function hotelCheckInYmd(h: { checkInDate: string }): string {
  return String(h.checkInDate).slice(0, 10);
}

async function reminderExists(companyId: string, reminderKey: string): Promise<boolean> {
  const [row] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.companyId, companyId),
        sql`(coalesce(${notifications.metadata}, '{}'::jsonb)->>'reminderKey') = ${reminderKey}`
      )
    )
    .limit(1);
  return row != null;
}

/**
 * Creates one unread notification per safari booking / hotel stay on the arrival calendar day,
 * after 00:01 Africa/Nairobi. `createdAt` is stamped at that 00:01 for consistent ordering.
 * Idempotent via `metadata.reminderKey`.
 */
export async function ensureArrivalDayNotifications(companyId: string): Promise<void> {
  const todayYmd = nairobiYmd();
  if (!nairobi001HasPassedOnCalendarDate(todayYmd)) return;

  const createdAt = nairobiWallClock001(todayYmd);

  const safariRows = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.companyId, companyId), notInArray(bookings.status, ["cancelled", "refunded"])));

  for (const b of safariRows) {
    const d = safariStartYmd(b);
    if (!d || d !== todayYmd) continue;
    const reminderKey = `safari-arrival:${b.id}:${todayYmd}`;
    if (await reminderExists(companyId, reminderKey)) continue;
    const guest = [b.firstName, b.lastName].filter(Boolean).join(" ").trim() || b.email;
    const title = `Safari arrival today: ${guest} (#${b.id})`;
    await db.insert(notifications).values({
      companyId,
      type: "booking",
      action: "created",
      referenceId: b.id,
      title: title.slice(0, 512),
      metadata: { reminderKey, kind: "arrival_day" },
      isRead: false,
      createdAt,
    });
  }

  const hotelRows = await db
    .select()
    .from(hotelBookings)
    .where(and(eq(hotelBookings.companyId, companyId), notInArray(hotelBookings.status, ["cancelled"])));

  for (const h of hotelRows) {
    const d = hotelCheckInYmd(h);
    if (d !== todayYmd) continue;
    const reminderKey = `hotel-arrival:${h.id}:${todayYmd}`;
    if (await reminderExists(companyId, reminderKey)) continue;
    const title = `Hotel check-in today: stay #${h.id} (room booking)`;
    await db.insert(notifications).values({
      companyId,
      type: "hotel",
      action: "created",
      referenceId: h.id,
      title: title.slice(0, 512),
      metadata: { reminderKey, kind: "arrival_day" },
      isRead: false,
      createdAt,
    });
  }
}
