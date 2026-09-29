import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  customers,
  hotelBookings,
  hotelBookingGuests,
  hotelBookingPayments,
  hotelBookingRooms,
  roomTypes,
  rooms,
} from "@/lib/schema";
import { createNotification } from "@/lib/notify";
import { requireTenantContext } from "@/server/tenancy";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod } from "@/lib/schemas/company-id";
import type { CompanyId } from "@/types/company";
import {
  normalizeTravellerCounts,
  parseOccupantGuests,
  travellerHeadcount,
} from "@/lib/travellers";
import { calcStayNights, quoteAllocatedStay } from "@/lib/pricing";
import { maybeSendHotelStayConfirmation } from "@/lib/email/hotel-stay-confirmation";

function resolveStayCurrency(companyId: string, guestCategory?: string | null): "KES" | "USD" {
  if (companyId === "ewc" && guestCategory === "non_resident") return "USD";
  return "KES";
}

function quoteStaySellingPrice(input: {
  companyId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCategory?: string | null;
  adults: number;
  children: number;
  allocated: Array<{
    id: number;
    baseRate: number | null;
    roomTypeName: string | null;
    maxOccupancy: number | null;
  }>;
  allocations: Array<{ roomId: number; quantity: number }>;
}): number | null {
  const byId = new Map(input.allocated.map((room) => [room.id, room]));
  const quote = quoteAllocatedStay({
    companyId: input.companyId,
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    guestCategory: input.guestCategory,
    adults: input.adults,
    children: input.children,
    rooms: input.allocations.map((row) => {
      const room = byId.get(row.roomId);
      return {
        nightlyRate: room?.baseRate,
        roomTypeName: room?.roomTypeName,
        maxOccupancy: room?.maxOccupancy,
        quantity: row.quantity,
      };
    }),
  });
  return quote?.sellingPrice ?? null;
}

function calcNights(checkIn: string, checkOut: string): number {
  return calcStayNights(checkIn, checkOut);
}

async function resolveRoomNightlyRate(
  roomId: number,
  companyId: string
): Promise<number | null> {
  const [row] = await db
    .select({ baseRate: roomTypes.baseRate })
    .from(rooms)
    .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(and(eq(rooms.id, roomId), eq(rooms.companyId, companyId)))
    .limit(1);
  if (!row || row.baseRate == null) return null;
  const rate = Number(row.baseRate);
  return Number.isFinite(rate) && rate >= 0 ? Math.round(rate) : null;
}

const MAX_ROOM_QUANTITY = 20;

const roomAllocSchema = z.object({
  roomId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(MAX_ROOM_QUANTITY).default(1),
});

function uniqueRoomIds(ids: number[]): number[] {
  return [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];
}

/** Merge duplicate room rows so (stay, room_id) unique index is never violated. */
function mergeRoomAllocations(
  rows: Array<{ roomId: number; quantity?: number | null }>
): Array<{ roomId: number; quantity: number }> {
  const byRoom = new Map<number, number>();
  for (const row of rows) {
    if (!Number.isInteger(row.roomId) || row.roomId <= 0) continue;
    const qty = Math.min(
      MAX_ROOM_QUANTITY,
      Math.max(1, Math.round(Number(row.quantity) || 1))
    );
    byRoom.set(row.roomId, Math.min(MAX_ROOM_QUANTITY, (byRoom.get(row.roomId) ?? 0) + qty));
  }
  return [...byRoom.entries()].map(([roomId, quantity]) => ({ roomId, quantity }));
}

function allocationsFromInput(d: {
  roomId?: number;
  roomIds?: number[];
  rooms?: Array<{ roomId: number; quantity: number }>;
}): Array<{ roomId: number; quantity: number }> {
  if (d.rooms && d.rooms.length > 0) return mergeRoomAllocations(d.rooms);
  const ids = uniqueRoomIds(d.roomIds ?? (d.roomId ? [d.roomId] : []));
  return ids.map((roomId) => ({ roomId, quantity: 1 }));
}

async function loadCompanyRooms(companyId: string, roomIds: number[]) {
  if (roomIds.length === 0) return [];
  return db
    .select({
      id: rooms.id,
      code: rooms.code,
      name: rooms.name,
      isActive: rooms.isActive,
      baseRate: roomTypes.baseRate,
      roomTypeName: roomTypes.name,
      maxOccupancy: roomTypes.maxOccupancy,
    })
    .from(rooms)
    .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(and(eq(rooms.companyId, companyId), inArray(rooms.id, roomIds)));
}

async function replaceStayRooms(input: {
  stayId: number;
  allocations: Array<{ roomId: number; quantity: number }>;
  companyId: string;
}): Promise<void> {
  const { ensureHotelBookingRoomsTable } = await import("@/server/database/ensure-hotel-booking-rooms");
  await ensureHotelBookingRoomsTable();
  const allocations = mergeRoomAllocations(input.allocations);
  const roomIds = allocations.map((row) => row.roomId);
  const allocated = await loadCompanyRooms(input.companyId, roomIds);
  if (allocated.length !== roomIds.length) {
    const error = new Error("One or more rooms were not found for this company");
    (error as Error & { status: number }).status = 400;
    throw error;
  }
  await db.delete(hotelBookingRooms).where(eq(hotelBookingRooms.hotelBookingId, input.stayId));
  if (allocations.length === 0) return;
  const byId = new Map(allocated.map((room) => [room.id, room]));
  await db.insert(hotelBookingRooms).values(
    allocations.map((row) => ({
      hotelBookingId: input.stayId,
      roomId: row.roomId,
      quantity: row.quantity,
      nightlyRate: byId.get(row.roomId)?.baseRate ?? null,
    }))
  );
}

const guestSchema = z.object({
  fullName: z.string().min(1).max(255),
  email: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

function partyFromInput(d: {
  primaryGuestName?: string | null;
  primaryGuestPhone?: string | null;
  primaryGuestEmail?: string | null;
  additionalOccupants?: unknown;
  adults?: number;
  children?: number;
  infants?: number;
  guests?: z.infer<typeof guestSchema>[];
}) {
  let name = d.primaryGuestName?.trim() || null;
  let phone = d.primaryGuestPhone?.trim() || null;
  let email = d.primaryGuestEmail?.trim() || null;
  let occupants = parseOccupantGuests(d.additionalOccupants);
  if (d.guests && d.guests.length > 0) {
    const primary = d.guests.find((g) => g.isPrimary) ?? d.guests[0];
    name = name || primary.fullName.trim() || null;
    phone = phone || primary.phone?.trim() || null;
    email = email || primary.email?.trim() || null;
    if (occupants.length === 0) {
      occupants = d.guests
        .filter((g) => g !== primary)
        .map((g) => ({
          name: g.fullName.trim(),
          email: g.email?.trim() || "",
        }))
        .filter((g) => g.name);
    }
  }
  const counts = normalizeTravellerCounts({
    adults: d.adults,
    children: d.children,
    infants: d.infants,
  });
  if (travellerHeadcount(counts) === 0 && name) {
    counts.adults = 1;
  }
  return { name, phone, email, occupants, counts };
}

async function resolveStayCustomerId(
  companyId: CompanyId,
  existingCustomerId: number | null | undefined,
  party: { name: string | null; email: string | null; phone: string | null }
): Promise<number | null> {
  if (existingCustomerId != null) return existingCustomerId;
  if (!party.name) return null;
  const { findOrCreateCustomerFromHotelGuest } = await import("@/lib/customers");
  return findOrCreateCustomerFromHotelGuest(companyId, {
    fullName: party.name,
    email: party.email,
    phone: party.phone,
  });
}

function partyTouched(d: {
  primaryGuestName?: string | null;
  primaryGuestPhone?: string | null;
  primaryGuestEmail?: string | null;
  additionalOccupants?: unknown;
  adults?: number;
  children?: number;
  infants?: number;
  guests?: unknown;
}): boolean {
  return (
    d.primaryGuestName !== undefined ||
    d.primaryGuestPhone !== undefined ||
    d.primaryGuestEmail !== undefined ||
    d.additionalOccupants !== undefined ||
    d.adults !== undefined ||
    d.children !== undefined ||
    d.infants !== undefined ||
    d.guests !== undefined
  );
}

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

const createSchema = z
  .object({
    companyId: companyIdZod,
    roomId: z.coerce.number().int().positive().optional(),
    roomIds: z.array(z.coerce.number().int().positive()).min(1).max(20).optional(),
    rooms: z.array(roomAllocSchema).min(1).max(20).optional(),
    checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    nights: z.coerce.number().int().min(1).optional(),
    totalAmount: z.coerce.number().int().min(0).optional(),
    /** rate = occupancy STO card or nights × room type baseRate; manual = staff-entered total. */
    pricingSource: z.enum(["rate", "manual"]).optional(),
    guestCategory: z.enum(["resident", "non_resident"]).optional(),
    currency: z.enum(["KES", "USD"]).optional(),
    amountPaid: z.coerce.number().int().min(0).optional(),
    paymentMethod: z.string().max(64).optional().nullable(),
    paymentStatus: z.enum(["paid", "partial", "unpaid"]).optional(),
    externalCompany: z.string().max(255).optional().nullable(),
    mealType: z.enum(["full_board", "half_board", "bed_only"]).optional().nullable(),
    status: z
      .enum(["pending", "confirmed", "cancelled", "checked_out"])
      .optional(),
    notes: z.string().optional().nullable(),
    primaryGuestName: z.string().max(255).optional().nullable(),
    primaryGuestPhone: z.string().max(50).optional().nullable(),
    primaryGuestEmail: z.string().max(255).optional().nullable(),
    additionalOccupants: z
      .array(
        z.union([
          z.string().max(255),
          z.object({
            name: z.string().max(255),
            email: z.string().max(255).optional().nullable(),
          }),
        ])
      )
      .optional(),
    adults: z.coerce.number().int().min(0).max(99).optional(),
    children: z.coerce.number().int().min(0).max(99).optional(),
    infants: z.coerce.number().int().min(0).max(99).optional(),
    guests: z.array(guestSchema).default([]),
  })
  .refine((d) => Boolean(d.roomId || (d.roomIds && d.roomIds.length > 0) || (d.rooms && d.rooms.length > 0)), {
    message: "Select at least one room",
    path: ["rooms"],
  })
  .refine((d) => d.pricingSource === "rate" || d.totalAmount != null, {
    message: "totalAmount is required unless pricingSource is rate",
    path: ["totalAmount"],
  });

const patchSchema = z.object({
  id: z.coerce.number().int().positive(),
  companyId: companyIdZod,
  roomId: z.coerce.number().int().positive().optional(),
  roomIds: z.array(z.coerce.number().int().positive()).min(1).max(20).optional(),
  rooms: z.array(roomAllocSchema).min(1).max(20).optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nights: z.coerce.number().int().min(1).optional(),
  totalAmount: z.coerce.number().int().min(0).optional(),
  pricingSource: z.enum(["rate", "manual"]).optional(),
  guestCategory: z.enum(["resident", "non_resident"]).optional(),
  currency: z.enum(["KES", "USD"]).optional(),
  amountPaid: z.coerce.number().int().min(0).optional(),
  paymentMethod: z.string().max(64).optional().nullable(),
  paymentStatus: z.enum(["paid", "partial", "unpaid"]).optional(),
  externalCompany: z.string().max(255).optional().nullable(),
  mealType: z.enum(["full_board", "half_board", "bed_only"]).optional().nullable(),
  status: z.enum(["pending", "confirmed", "cancelled", "checked_out"]).optional(),
  notes: z.string().optional().nullable(),
  primaryGuestName: z.string().max(255).optional().nullable(),
  primaryGuestPhone: z.string().max(50).optional().nullable(),
  primaryGuestEmail: z.string().max(255).optional().nullable(),
  additionalOccupants: z
    .array(
      z.union([
        z.string().max(255),
        z.object({
          name: z.string().max(255),
          email: z.string().max(255).optional().nullable(),
        }),
      ])
    )
    .optional(),
  adults: z.coerce.number().int().min(0).max(99).optional(),
  children: z.coerce.number().int().min(0).max(99).optional(),
  infants: z.coerce.number().int().min(0).max(99).optional(),
  guests: z.array(guestSchema).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenant = await requireTenantContext(new URL(request.url).searchParams.get("companyId"), {
      module: "accommodation",
      requireEdit: false,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    const { ensureArrivalDayNotifications } = await import("@/lib/arrival-day-notifications");
    await ensureArrivalDayNotifications(companyId);
    const { ensureCustomersReady, ensureHotelStayPartyColumns } = await import("@/lib/customers");
    await ensureHotelStayPartyColumns();
    await ensureCustomersReady();
    const { ensureHotelBookingRoomsTable } = await import("@/server/database/ensure-hotel-booking-rooms");
    await ensureHotelBookingRoomsTable();
    const { ensureEnchoroRates2026 } = await import("@/server/database/ensure-enchoro-rates");
    await ensureEnchoroRates2026();

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

    const customerIds = [
      ...new Set(
        list
          .map((l) => l.booking.customerId)
          .filter((id): id is number => id != null)
      ),
    ];
    const customerNames: Record<number, string> = {};
    if (customerIds.length > 0) {
      const cRows = await db
        .select({
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
        })
        .from(customers)
        .where(inArray(customers.id, customerIds));
      for (const row of cRows) {
        customerNames[row.id] = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
      }
    }

    const stayIds = list.map((row) => row.booking.id);
    const allocatedRows =
      stayIds.length === 0
        ? []
        : await db
            .select({
              hotelBookingId: hotelBookingRooms.hotelBookingId,
              roomId: rooms.id,
              code: rooms.code,
              name: rooms.name,
              quantity: hotelBookingRooms.quantity,
              roomTypeName: roomTypes.name,
            })
            .from(hotelBookingRooms)
            .innerJoin(rooms, eq(hotelBookingRooms.roomId, rooms.id))
            .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
            .where(inArray(hotelBookingRooms.hotelBookingId, stayIds));
    const roomsByStay = new Map<number, typeof allocatedRows>();
    for (const row of allocatedRows) {
      const current = roomsByStay.get(row.hotelBookingId) ?? [];
      current.push(row);
      roomsByStay.set(row.hotelBookingId, current);
    }

    const hotelBookingPayload = list.map((row) => {
      const stay = row.booking;
      const customerName =
        stay.customerId != null ? customerNames[stay.customerId] ?? null : null;
      const occupants = parseOccupantGuests(stay.additionalOccupants);
      const guests = [
        ...(stay.primaryGuestName
          ? [
              {
                fullName: stay.primaryGuestName,
                email: stay.primaryGuestEmail,
                phone: stay.primaryGuestPhone,
                country: null as string | null,
                isPrimary: true,
                customerId: stay.customerId,
                customerName,
              },
            ]
          : []),
        ...occupants.map((guest) => ({
          fullName: guest.name,
          email: guest.email || null,
          phone: null as string | null,
          country: null as string | null,
          isPrimary: false,
          customerId: null as number | null,
          customerName: null as string | null,
        })),
      ];
      const allocated = roomsByStay.get(stay.id) ?? [];
      return {
        ...stay,
        additionalOccupants: occupants,
        customerName,
        room: row.room,
        rooms: allocated.map((item) => ({
          id: item.roomId,
          code: item.code,
          name: item.name,
          quantity: item.quantity,
          roomTypeName: item.roomTypeName,
        })),
        guests,
      };
    });
    const unlinkedPrimaryCount = hotelBookingPayload.filter(
      (stay) => Boolean(stay.primaryGuestName) && stay.customerId == null
    ).length;

    return NextResponse.json({
      success: true,
      unlinkedPrimaryCount,
      hotelBookings: hotelBookingPayload,
    });
  } catch (e) {
    console.error("hotel-bookings GET", e);
    return NextResponse.json({ error: "Failed to list hotel bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = parsed.data;
    const tenant = await requireTenantContext(d.companyId, {
      module: "accommodation",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    const { ensureHotelStayPartyColumns } = await import("@/lib/customers");
    await ensureHotelStayPartyColumns();
    const { ensureEnchoroRates2026 } = await import("@/server/database/ensure-enchoro-rates");
    await ensureEnchoroRates2026();

    const allocations = allocationsFromInput(d);
    const selectedRoomIds = allocations.map((row) => row.roomId);
    const allocated = await loadCompanyRooms(companyId, selectedRoomIds);
    if (allocated.length !== selectedRoomIds.length || allocated.length === 0) {
      return NextResponse.json({ error: "Select at least one valid room" }, { status: 400 });
    }
    const allocatedById = new Map(allocated.map((room) => [room.id, room]));
    const primaryRoom = allocatedById.get(allocations[0]!.roomId)!;

    const nights = d.nights ?? calcNights(d.checkInDate, d.checkOutDate);
    if (nights < 1) {
      return NextResponse.json(
        { error: "Check-out must be after check-in (at least one night)" },
        { status: 400 }
      );
    }

    const party = partyFromInput(d);
    const guestCategory = d.guestCategory ?? "resident";
    const currency = d.currency ?? resolveStayCurrency(companyId, guestCategory);
    const pricingSource: "rate" | "manual" =
      d.pricingSource ?? (d.totalAmount != null ? "manual" : "rate");
    let totalAmount = d.totalAmount;
    if (pricingSource === "rate") {
      const quoted = quoteStaySellingPrice({
        companyId,
        checkInDate: d.checkInDate,
        checkOutDate: d.checkOutDate,
        guestCategory,
        adults: party.counts.adults,
        children: party.counts.children,
        allocated,
        allocations,
      });
      if (quoted == null) {
        return NextResponse.json(
          { error: "A selected room type has no rate for these dates; enter total manually" },
          { status: 400 }
        );
      }
      totalAmount = quoted;
    } else if (totalAmount == null) {
      return NextResponse.json({ error: "totalAmount is required" }, { status: 400 });
    }

    const customerId = await resolveStayCustomerId(companyId, null, party);

    const [booking] = await db
      .insert(hotelBookings)
      .values({
        companyId,
        roomId: primaryRoom.id,
        checkInDate: d.checkInDate,
        checkOutDate: d.checkOutDate,
        nights,
        customerId,
        primaryGuestName: party.name,
        primaryGuestPhone: party.phone,
        primaryGuestEmail: party.email,
        additionalOccupants: party.occupants,
        adults: party.counts.adults,
        children: party.counts.children,
        infants: party.counts.infants,
        totalAmount,
        amountPaid: d.amountPaid ?? 0,
        paymentMethod: d.paymentMethod ?? null,
        paymentStatus: d.paymentStatus ?? "unpaid",
        pricingSource,
        guestCategory,
        currency,
        externalCompany: d.externalCompany ?? null,
        mealType: d.mealType ?? null,
        status: d.status ?? "pending",
        notes: d.notes ?? null,
      })
      .returning();

    await createNotification({
      companyId,
      type: "hotel",
      action: "created",
      referenceId: booking.id,
      title: `Hotel stay #${booking.id} — ${d.checkInDate} (${booking.nights} nights)`,
      metadata: {
        roomId: booking.roomId,
        roomIds: selectedRoomIds,
        rooms: allocations,
        totalAmount: booking.totalAmount,
        guest: party.name,
      },
    });

    try {
      await replaceStayRooms({ stayId: booking.id, allocations, companyId });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not save rooms";
      return NextResponse.json({ error: message }, { status: 400 });
    }

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

    void maybeSendHotelStayConfirmation({
      ...booking,
      roomLabel: allocated.map((room) => room.code).join(", "),
    });

    return NextResponse.json({ success: true, hotelBooking: booking });
  } catch (e) {
    console.error("hotel-bookings POST", e);
    return NextResponse.json({ error: "Failed to create hotel booking" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = parsed.data;
    const tenant = await requireTenantContext(d.companyId, {
      module: "accommodation",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    const { ensureHotelStayPartyColumns } = await import("@/lib/customers");
    await ensureHotelStayPartyColumns();
    const { ensureEnchoroRates2026 } = await import("@/server/database/ensure-enchoro-rates");
    await ensureEnchoroRates2026();

    const { id } = d;
    const [existing] = await db
      .select()
      .from(hotelBookings)
      .where(and(eq(hotelBookings.id, id), eq(hotelBookings.companyId, companyId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const nextAllocations =
      d.rooms !== undefined || d.roomIds !== undefined || d.roomId !== undefined
        ? allocationsFromInput(d)
        : null;
    if (nextAllocations) {
      const allocated = await loadCompanyRooms(
        companyId,
        nextAllocations.map((row) => row.roomId)
      );
      if (allocated.length !== nextAllocations.length || allocated.length === 0) {
        return NextResponse.json({ error: "Select at least one valid room" }, { status: 400 });
      }
    }

    const nextIn = d.checkInDate ?? String(existing.checkInDate);
    const nextOut = d.checkOutDate ?? String(existing.checkOutDate);

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (nextAllocations) updates.roomId = nextAllocations[0]!.roomId;
    if (d.checkInDate !== undefined) updates.checkInDate = d.checkInDate;
    if (d.checkOutDate !== undefined) updates.checkOutDate = d.checkOutDate;
    if (d.amountPaid !== undefined) updates.amountPaid = d.amountPaid;
    if (d.paymentMethod !== undefined) updates.paymentMethod = d.paymentMethod;
    if (d.paymentStatus !== undefined) updates.paymentStatus = d.paymentStatus;
    if (d.externalCompany !== undefined) updates.externalCompany = d.externalCompany;
    if (d.mealType !== undefined) updates.mealType = d.mealType;
    if (d.status !== undefined) updates.status = d.status;
    if (d.notes !== undefined) updates.notes = d.notes;
    const nextGuestCategory = d.guestCategory ?? existing.guestCategory ?? "resident";
    if (d.guestCategory !== undefined) updates.guestCategory = d.guestCategory;
    updates.currency = d.currency ?? resolveStayCurrency(companyId, nextGuestCategory);
    if (d.nights !== undefined) {
      updates.nights = d.nights;
    } else if (d.checkInDate !== undefined || d.checkOutDate !== undefined) {
      const n = calcNights(nextIn, nextOut);
      if (n < 1) {
        return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
      }
      updates.nights = n;
    }

    const nextAdults = d.adults ?? existing.adults ?? 1;
    const nextChildren = d.children ?? existing.children ?? 0;
    const datesOrRoomChanged =
      nextAllocations != null ||
      d.checkInDate !== undefined ||
      d.checkOutDate !== undefined ||
      d.nights !== undefined ||
      d.guestCategory !== undefined ||
      d.adults !== undefined ||
      d.children !== undefined;

    async function quoteSelectedRooms() {
      const allocations =
        nextAllocations ??
        (await db
          .select({ quantity: hotelBookingRooms.quantity, roomId: hotelBookingRooms.roomId })
          .from(hotelBookingRooms)
          .where(eq(hotelBookingRooms.hotelBookingId, id)));
      const roomIds =
        allocations.length > 0 ? allocations.map((row) => row.roomId) : [existing.roomId];
      const allocated = await loadCompanyRooms(companyId, roomIds);
      const quoteAllocations =
        allocations.length > 0
          ? allocations.map((row) => ({
              roomId: row.roomId,
              quantity: "quantity" in row ? Number(row.quantity) || 1 : 1,
            }))
          : [{ roomId: existing.roomId, quantity: 1 }];
      return quoteStaySellingPrice({
        companyId,
        checkInDate: nextIn,
        checkOutDate: nextOut,
        guestCategory: nextGuestCategory,
        adults: nextAdults,
        children: nextChildren,
        allocated,
        allocations: quoteAllocations,
      });
    }

    if (d.pricingSource === "rate") {
      const quoted = await quoteSelectedRooms();
      if (quoted == null) {
        return NextResponse.json(
          { error: "A selected room type has no rate for these dates; enter total manually" },
          { status: 400 }
        );
      }
      updates.totalAmount = quoted;
      updates.pricingSource = "rate";
    } else if (d.pricingSource === "manual") {
      if (d.totalAmount !== undefined) updates.totalAmount = d.totalAmount;
      updates.pricingSource = "manual";
    } else if (d.totalAmount !== undefined) {
      updates.totalAmount = d.totalAmount;
      updates.pricingSource = "manual";
    } else if (existing.pricingSource === "rate" && datesOrRoomChanged) {
      const quoted = await quoteSelectedRooms();
      if (quoted == null) {
        return NextResponse.json(
          { error: "A selected room type has no rate for these dates; enter total manually" },
          { status: 400 }
        );
      }
      updates.totalAmount = quoted;
      updates.pricingSource = "rate";
    }

    const guestsChanged = partyTouched(d);
    if (guestsChanged) {
      const party = partyFromInput({
        primaryGuestName: d.primaryGuestName ?? existing.primaryGuestName,
        primaryGuestPhone: d.primaryGuestPhone ?? existing.primaryGuestPhone,
        primaryGuestEmail: d.primaryGuestEmail ?? existing.primaryGuestEmail,
        additionalOccupants:
          d.additionalOccupants !== undefined
            ? d.additionalOccupants
            : d.guests
              ? undefined
              : existing.additionalOccupants,
        adults: d.adults ?? existing.adults,
        children: d.children ?? existing.children,
        infants: d.infants ?? existing.infants,
        guests: d.guests,
      });
      updates.primaryGuestName = party.name;
      updates.primaryGuestPhone = party.phone;
      updates.primaryGuestEmail = party.email;
      updates.additionalOccupants = party.occupants;
      updates.adults = party.counts.adults;
      updates.children = party.counts.children;
      updates.infants = party.counts.infants;
      updates.customerId = await resolveStayCustomerId(companyId, existing.customerId, party);
    }

    const [row] = await db
      .update(hotelBookings)
      .set(updates)
      .where(and(eq(hotelBookings.id, id), eq(hotelBookings.companyId, companyId)))
      .returning();

    if (nextAllocations) {
      try {
        await replaceStayRooms({ stayId: id, allocations: nextAllocations, companyId });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Could not save rooms";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    if (row) {
      await createNotification({
        companyId,
        type: "hotel",
        action: "updated",
        referenceId: row.id,
        title: hotelUpdateTitle(row.id, existing, row, guestsChanged),
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
    const sp = new URL(request.url).searchParams;
    const id = sp.get("id");
    if (!id) {
      return NextResponse.json({ error: "id and companyId required" }, { status: 400 });
    }
    const tenant = await requireTenantContext(sp.get("companyId"), {
      module: "accommodation",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
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
