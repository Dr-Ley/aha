import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  hotelBookings,
  hotelBookingGuests,
  hotelBookingPayments,
  roomTypes,
  rooms,
} from "@/lib/schema";
import { auth } from "@/lib/auth";
import { checkApiPermission, canAccessDashboardFromSession } from "@/lib/permissions-server";
import { createNotification } from "@/lib/notify";
import { isValidCompanyId, resolveCompanyId } from "@/lib/tenant";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod } from "@/lib/schemas/company-id";

function getUserId(session: { user?: { id?: string | null } } | null): number | null {
  if (!session?.user?.id) return null;
  return typeof session.user.id === "string" ? parseInt(session.user.id, 10) : session.user.id;
}

function calcNights(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn}T12:00:00.000Z`);
  const b = new Date(`${checkOut}T12:00:00.000Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

let hotelGuestCountryColumnEnsured = false;

async function ensureHotelGuestCountryColumn(): Promise<void> {
  if (hotelGuestCountryColumnEnsured) return;
  await db.execute(sql`
    ALTER TABLE "hotel_booking_guests"
    ADD COLUMN IF NOT EXISTS "country" varchar(100)
  `);
  hotelGuestCountryColumnEnsured = true;
}

const guestSchema = z.object({
  fullName: z.string().min(1).max(255),
  email: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

function hotelUpdateTitle(
  id: number,
  before: typeof hotelBookings.$inferSelect,
  after: typeof hotelBookings.$inferSelect,
  guestChanged: boolean
): string {
  if (before.status !== after.status) return `Hotel stay #${id} reservation ${after.status}`;
  if (before.paymentStatus !== after.paymentStatus) return `Hotel stay #${id} pay status changed to ${after.paymentStatus}`;
  if (before.roomId !== after.roomId) return `Hotel stay #${id} room changed`;
  if (before.checkInDate !== after.checkInDate) return `Hotel stay #${id} check-in changed to ${after.checkInDate}`;
  if (before.checkOutDate !== after.checkOutDate) return `Hotel stay #${id} check-out changed to ${after.checkOutDate}`;
  if (before.totalAmount !== after.totalAmount) return `Hotel stay #${id} total changed`;
  if (before.amountPaid !== after.amountPaid) return `Hotel stay #${id} amount paid changed`;
  if (before.mealType !== after.mealType) return `Hotel stay #${id} meal type changed to ${after.mealType ?? "none"}`;
  if (before.externalCompany !== after.externalCompany) return `Hotel stay #${id} external company changed`;
  if (guestChanged) return `Hotel stay #${id} guest details changed`;
  return `Hotel stay #${id} details changed`;
}

const createSchema = z.object({
  companyId: companyIdZod,
  roomId: z.coerce.number().int().positive(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nights: z.coerce.number().int().min(1).optional(),
  totalAmount: z.coerce.number().int().min(0),
  amountPaid: z.coerce.number().int().min(0).optional(),
  paymentMethod: z.string().max(64).optional().nullable(),
  paymentStatus: z.enum(["paid", "partial", "unpaid"]).optional(),
  externalCompany: z.string().max(255).optional().nullable(),
  mealType: z.enum(["full_board", "half_board", "bed_only"]).optional().nullable(),
  status: z
    .enum(["pending", "confirmed", "cancelled", "checked_out"])
    .optional(),
  notes: z.string().optional().nullable(),
  guests: z.array(guestSchema).default([]),
});

const patchSchema = z.object({
  id: z.coerce.number().int().positive(),
  companyId: companyIdZod,
  roomId: z.coerce.number().int().positive().optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nights: z.coerce.number().int().min(1).optional(),
  totalAmount: z.coerce.number().int().min(0).optional(),
  amountPaid: z.coerce.number().int().min(0).optional(),
  paymentMethod: z.string().max(64).optional().nullable(),
  paymentStatus: z.enum(["paid", "partial", "unpaid"]).optional(),
  externalCompany: z.string().max(255).optional().nullable(),
  mealType: z.enum(["full_board", "half_board", "bed_only"]).optional().nullable(),
  status: z.enum(["pending", "confirmed", "cancelled", "checked_out"]).optional(),
  notes: z.string().optional().nullable(),
  guests: z.array(guestSchema).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!getUserId(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const companyId = resolveCompanyId(new URL(request.url).searchParams.get("companyId"));

    const viewDenied = await checkApiPermission(session, companyId, "accommodation", false);
    if (viewDenied) return viewDenied;

    const { ensureArrivalDayNotifications } = await import("@/lib/arrival-day-notifications");
    await ensureArrivalDayNotifications(companyId);

    const list = await db
      .select({
        booking: hotelBookings,
        room: {
          id: rooms.id,
          code: rooms.code,
          name: rooms.name,
          roomTypeName: roomTypes.name,
        },
      })
      .from(hotelBookings)
      .leftJoin(rooms, eq(hotelBookings.roomId, rooms.id))
      .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .where(eq(hotelBookings.companyId, companyId))
      .orderBy(desc(hotelBookings.checkInDate));

    const ids = list.map((l) => l.booking.id);
    let guestMap: Record<number, (typeof hotelBookingGuests.$inferSelect)[]> = {};
    if (ids.length > 0) {
      await ensureHotelGuestCountryColumn();
      const gRows = await db
        .select()
        .from(hotelBookingGuests)
        .where(inArray(hotelBookingGuests.hotelBookingId, ids));
      guestMap = gRows.reduce<Record<number, (typeof gRows)[number][]>>((acc, g) => {
        (acc[g.hotelBookingId] = acc[g.hotelBookingId] || []).push(g);
        return acc;
      }, {});
    }

    return NextResponse.json({
      success: true,
      hotelBookings: list.map((row) => ({
        ...row.booking,
        room: row.room,
        guests: guestMap[row.booking.id] ?? [],
      })),
    });
  } catch (e) {
    console.error("hotel-bookings GET", e);
    return NextResponse.json({ error: "Failed to list hotel bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!getUserId(session) || !await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = parsed.data;
    if (!isValidCompanyId(d.companyId)) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 });
    }

    const postDenied = await checkApiPermission(session, d.companyId, "accommodation", true);
    if (postDenied) return postDenied;

    const [roomRow] = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, d.roomId), eq(rooms.companyId, d.companyId)))
      .limit(1);
    if (!roomRow) {
      return NextResponse.json({ error: "Room not found for this company" }, { status: 400 });
    }

    const nights = d.nights ?? calcNights(d.checkInDate, d.checkOutDate);
    if (nights < 1) {
      return NextResponse.json(
        { error: "Check-out must be after check-in (at least one night)" },
        { status: 400 }
      );
    }

    const [booking] = await db
      .insert(hotelBookings)
      .values({
        companyId: d.companyId,
        roomId: d.roomId,
        checkInDate: d.checkInDate,
        checkOutDate: d.checkOutDate,
        nights,
        totalAmount: d.totalAmount,
        amountPaid: d.amountPaid ?? 0,
        paymentMethod: d.paymentMethod ?? null,
        paymentStatus: d.paymentStatus ?? "unpaid",
        externalCompany: d.externalCompany ?? null,
        mealType: d.mealType ?? null,
        status: d.status ?? "pending",
        notes: d.notes ?? null,
      })
      .returning();

    if (d.guests.length > 0) {
      await ensureHotelGuestCountryColumn();
      await db.insert(hotelBookingGuests).values(
        d.guests.map((g, i) => ({
          hotelBookingId: booking.id,
          fullName: g.fullName,
          email: g.email?.trim() || null,
          phone: g.phone?.trim() || null,
          country: g.country?.trim() || null,
          isPrimary: g.isPrimary ?? (i === 0),
        }))
      );
    }

    await createNotification({
      companyId: d.companyId,
      type: "hotel",
      action: "created",
      referenceId: booking.id,
      title: `Hotel stay #${booking.id} — ${d.checkInDate} (${booking.nights} nights)`,
      metadata: {
        roomId: booking.roomId,
        totalAmount: booking.totalAmount,
        guest: d.guests[0]?.fullName,
      },
    });

    try {
      const { ensureDashboardPaymentForPaidHotelStay } = await import("@/lib/sync-paid-source-payments");
      await ensureDashboardPaymentForPaidHotelStay(booking);
    } catch (e) {
      console.error("ensureDashboardPaymentForPaidHotelStay (POST):", e);
    }

    try {
      const { syncRevenueFromHotelStay } = await import("@/lib/sync-source-revenue");
      await syncRevenueFromHotelStay(booking);
    } catch (e) {
      console.error("syncRevenueFromHotelStay (POST):", e);
    }

    return NextResponse.json({ success: true, hotelBooking: booking });
  } catch (e) {
    console.error("hotel-bookings POST", e);
    return NextResponse.json({ error: "Failed to create hotel booking" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!getUserId(session) || !await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = parsed.data;
    if (!isValidCompanyId(d.companyId)) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 });
    }

    const patchDenied = await checkApiPermission(session, d.companyId, "accommodation", true);
    if (patchDenied) return patchDenied;

    const { id, companyId, guests } = d;
    const [existing] = await db
      .select()
      .from(hotelBookings)
      .where(and(eq(hotelBookings.id, id), eq(hotelBookings.companyId, companyId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (d.roomId !== undefined) {
      const [rr] = await db
        .select()
        .from(rooms)
        .where(and(eq(rooms.id, d.roomId), eq(rooms.companyId, companyId)))
        .limit(1);
      if (!rr) {
        return NextResponse.json({ error: "Room not found for this company" }, { status: 400 });
      }
    }

    const nextIn = d.checkInDate ?? String(existing.checkInDate);
    const nextOut = d.checkOutDate ?? String(existing.checkOutDate);

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (d.roomId !== undefined) updates.roomId = d.roomId;
    if (d.checkInDate !== undefined) updates.checkInDate = d.checkInDate;
    if (d.checkOutDate !== undefined) updates.checkOutDate = d.checkOutDate;
    if (d.totalAmount !== undefined) updates.totalAmount = d.totalAmount;
    if (d.amountPaid !== undefined) updates.amountPaid = d.amountPaid;
    if (d.paymentMethod !== undefined) updates.paymentMethod = d.paymentMethod;
    if (d.paymentStatus !== undefined) updates.paymentStatus = d.paymentStatus;
    if (d.externalCompany !== undefined) updates.externalCompany = d.externalCompany;
    if (d.mealType !== undefined) updates.mealType = d.mealType;
    if (d.status !== undefined) updates.status = d.status;
    if (d.notes !== undefined) updates.notes = d.notes;
    if (d.nights !== undefined) {
      updates.nights = d.nights;
    } else if (d.checkInDate !== undefined || d.checkOutDate !== undefined) {
      const n = calcNights(nextIn, nextOut);
      if (n < 1) {
        return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
      }
      updates.nights = n;
    }

    const [row] = await db
      .update(hotelBookings)
      .set(updates)
      .where(and(eq(hotelBookings.id, id), eq(hotelBookings.companyId, companyId)))
      .returning();

    if (guests) {
      await ensureHotelGuestCountryColumn();
      await db.delete(hotelBookingGuests).where(eq(hotelBookingGuests.hotelBookingId, id));
      if (guests.length > 0) {
        await db.insert(hotelBookingGuests).values(
          guests.map((g, i) => ({
            hotelBookingId: id,
            fullName: g.fullName,
            email: g.email?.trim() || null,
            phone: g.phone?.trim() || null,
            country: g.country?.trim() || null,
            isPrimary: g.isPrimary ?? (i === 0),
          }))
        );
      }
    }

    if (row) {
      await createNotification({
        companyId,
        type: "hotel",
        action: "updated",
        referenceId: row.id,
        title: hotelUpdateTitle(row.id, existing, row, guests !== undefined),
        metadata: { status: row.status, paymentStatus: row.paymentStatus },
      });

      try {
        const { ensureDashboardPaymentForPaidHotelStay } = await import("@/lib/sync-paid-source-payments");
        await ensureDashboardPaymentForPaidHotelStay(row);
      } catch (e) {
        console.error("ensureDashboardPaymentForPaidHotelStay (PATCH):", e);
      }

      try {
        const { syncRevenueFromHotelStay } = await import("@/lib/sync-source-revenue");
        await syncRevenueFromHotelStay(row);
      } catch (e) {
        console.error("syncRevenueFromHotelStay (PATCH):", e);
      }
    }

    return NextResponse.json({ success: true, hotelBooking: row });
  } catch (e) {
    console.error("hotel-bookings PATCH", e);
    return NextResponse.json({ error: "Failed to update hotel booking" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!getUserId(session) || !await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const sp = new URL(request.url).searchParams;
    const id = sp.get("id");
    const companyId = sp.get("companyId");
    if (!id || !companyId || !isValidCompanyId(companyId)) {
      return NextResponse.json({ error: "id and companyId required" }, { status: 400 });
    }
    const delDenied = await checkApiPermission(session, companyId, "accommodation", true);
    if (delDenied) return delDenied;
    const hid = parseInt(id, 10);
    await db
      .delete(hotelBookingPayments)
      .where(
        and(eq(hotelBookingPayments.hotelBookingId, hid), eq(hotelBookingPayments.companyId, companyId))
      );
    await db.delete(hotelBookingGuests).where(eq(hotelBookingGuests.hotelBookingId, hid));
    const del = await db
      .delete(hotelBookings)
      .where(and(eq(hotelBookings.id, hid), eq(hotelBookings.companyId, companyId)))
      .returning({ id: hotelBookings.id });
    if (del.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      const { deleteRevenueForEntity } = await import("@/lib/sync-source-revenue");
      await deleteRevenueForEntity(companyId, "hotel", hid);
    } catch (e) {
      console.error("deleteRevenueForEntity (hotel):", e);
    }

    await createNotification({
      companyId,
      type: "hotel",
      action: "deleted",
      referenceId: hid,
      title: `Hotel stay #${hid} deleted`,
      metadata: {},
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("hotel-bookings DELETE", e);
    return NextResponse.json({ error: "Failed to delete hotel booking" }, { status: 500 });
  }
}
