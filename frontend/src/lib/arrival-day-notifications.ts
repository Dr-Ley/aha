import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, hotelBookings, notifications } from "@/lib/schema";
import { nairobi001HasPassedOnCalendarDate, nairobiWallClock001, nairobiYmd } from "@/lib/nairobi-date";
import { ensureBookingCustomerColumn, ensureBookingTravellerColumns, ensureHotelStayPartyColumns } from "@/lib/customers";

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

const recentArrivalScan = new Map<string, number>();
const ARRIVAL_SCAN_GAP_MS = 60_000;

/**
 * Creates one unread notification per safari booking / hotel stay on the arrival calendar day,
 * after 00:01 Africa/Nairobi. `createdAt` is stamped at that 00:01 for consistent ordering.
 * Idempotent via `metadata.reminderKey`.
 *
 * Only today's arrivals are read. A short gap collapses the duplicate polls from the bell
 * and the bookings/stays pages so the same company is not scanned twice in one minute.
 */
export async function ensureArrivalDayNotifications(companyId: string): Promise<void> {
  const now = Date.now();
  const last = recentArrivalScan.get(companyId) ?? 0;
  if (now - last < ARRIVAL_SCAN_GAP_MS) return;
  recentArrivalScan.set(companyId, now);

  try {
    await scanArrivalDayNotifications(companyId);
  } catch (error) {
    recentArrivalScan.delete(companyId);
    throw error;
  }
}

async function scanArrivalDayNotifications(companyId: string): Promise<void> {
  await ensureBookingCustomerColumn();
  await ensureBookingTravellerColumns();
  await ensureHotelStayPartyColumns();
  const todayYmd = nairobiYmd();
  if (!nairobi001HasPassedOnCalendarDate(todayYmd)) return;

  const createdAt = nairobiWallClock001(todayYmd);
  const arrivalDay = sql`(
    case
      when length(trim(coalesce(${bookings.startDate}, ''))) >= 10
      then left(trim(${bookings.startDate}), 10)
      else left(trim(${bookings.travelDate}), 10)
    end
  ) = ${todayYmd}`;

  const safariRows = await db
    .select({
      id: bookings.id,
      startDate: bookings.startDate,
      travelDate: bookings.travelDate,
      firstName: bookings.firstName,
      lastName: bookings.lastName,
      email: bookings.email,
    })
    .from(bookings)
    .where(
      and(eq(bookings.companyId, companyId), notInArray(bookings.status, ["cancelled", "refunded"]), arrivalDay)
    );

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
    .select({
      id: hotelBookings.id,
      checkInDate: hotelBookings.checkInDate,
    })
    .from(hotelBookings)
    .where(
      and(
        eq(hotelBookings.companyId, companyId),
        notInArray(hotelBookings.status, ["cancelled"]),
        eq(hotelBookings.checkInDate, todayYmd)
      )
    );

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
