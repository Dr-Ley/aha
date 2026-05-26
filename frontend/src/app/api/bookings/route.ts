import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, tours } from "@/lib/schema";
import { auth } from "@/lib/auth";
import {
  checkAnyApiPermission,
  checkApiPermission,
  canAccessDashboardFromSession,
} from "@/lib/permissions-server";
import { createNotification } from "@/lib/notify";
import { isValidCompanyId, resolveCompanyId } from "@/lib/tenant";
import { pickBookingPatch } from "@/lib/dashboard-mutations";
import { companyIdZod } from "@/lib/schemas/company-id";
import type { CompanyId } from "@/types/company";
import {
  CURRENCIES,
  exchangeRateToKes,
  type CurrencyCode,
  wholeInCurrencyToKes,
} from "@/lib/data";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

function getUserId(session: { user?: { id?: string | null } } | null): number | null {
  if (!session?.user?.id) return null;
  return typeof session.user.id === "string" ? parseInt(session.user.id, 10) : session.user.id;
}

async function isStaff(session: { user?: { id?: string | null; role?: string | null } } | null) {
  return canAccessDashboardFromSession(session);
}

function inferTripCountry(countries: string[]): "Kenya" | "Tanzania" {
  for (let i = countries.length - 1; i >= 0; i--) {
    const n = countries[i].toLowerCase();
    if (n.includes("tanzania")) return "Tanzania";
    if (n.includes("kenya")) return "Kenya";
  }
  return "Kenya";
}

function addDaysIso(start: string, daysToAdd: number): string | null {
  const d = new Date(`${start}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

const currencyCodeSchema = z.enum(CURRENCIES.map((c) => c.code) as [CurrencyCode, ...CurrencyCode[]]);
let bookingCurrencyColumnsEnsured = false;

async function ensureBookingCurrencyColumns(): Promise<void> {
  if (bookingCurrencyColumnsEnsured) return;
  await db.execute(sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "original_amount" integer`);
  await db.execute(sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "original_currency" varchar(10) DEFAULT 'KES' NOT NULL`);
  await db.execute(sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "exchange_rate_to_kes" real DEFAULT 1 NOT NULL`);
  await db.execute(sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "exchange_rate_date" date`);
  bookingCurrencyColumnsEnsured = true;
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/bookings - Staff: all bookings for ?companyId=  Customer: own bookings (optional company filter)
export async function GET(request: NextRequest) {
  try {
    await ensureBookingCurrencyColumns();
    const session = await auth();
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const staffCheck = await isStaff(session);

    let allBookings;

    if (staffCheck) {
      const companyId = resolveCompanyId(searchParams.get("companyId"));
      const denied = await checkAnyApiPermission(session, companyId, ["bookings", "tours"], false);
      if (denied) return denied;
      const { ensureArrivalDayNotifications } = await import("@/lib/arrival-day-notifications");
      await ensureArrivalDayNotifications(companyId);
      allBookings = await db
        .select({
          booking: bookings,
          tour: tours,
        })
        .from(bookings)
        .leftJoin(tours, eq(bookings.tourId, tours.id))
        .where(eq(bookings.companyId, companyId))
        .orderBy(desc(bookings.createdAt));
    } else {
      const companyFilter = searchParams.get("companyId");
      const filters = [eq(bookings.userId, userId)];
      if (companyFilter && isValidCompanyId(companyFilter)) {
        filters.push(eq(bookings.companyId, companyFilter));
      }
      allBookings = await db
        .select({
          booking: bookings,
          tour: tours,
        })
        .from(bookings)
        .leftJoin(tours, eq(bookings.tourId, tours.id))
        .where(filters.length > 1 ? and(...filters) : filters[0])
        .orderBy(desc(bookings.createdAt));
    }

    return NextResponse.json({
      success: true,
      bookings: allBookings.map((item) => ({
        ...item.booking,
        tour: item.tour,
      })),
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

const staffManualBookingSchema = z.object({
  intent: z.literal("staff_manual"),
  companyId: companyIdZod,
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional().nullable(),
  email: z.string().email(),
  phone: z.string().max(50).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  travelDate: z.string().min(1).max(50),
  startDate: z.string().max(50).optional().nullable(),
  endDate: z.string().max(50).optional().nullable(),
  guests: z.coerce.number().int().min(1).max(99),
  safariPackage: z.string().min(1).max(512),
  tripCountry: z.enum(["Kenya", "Tanzania"]),
  totalPrice: z.coerce.number().int().min(0).optional().nullable(),
  originalAmount: z.coerce.number().int().min(0).optional().nullable(),
  originalCurrency: currencyCodeSchema.default("KES"),
  exchangeRateToKes: z.coerce.number().positive().optional().nullable(),
  exchangeRateDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  tourId: z.coerce.number().int().optional().nullable(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "refunded"]).default("pending"),
  paymentStatus: z.enum(["paid", "partial", "unpaid"]).default("unpaid"),
  accommodation: z.string().max(50).optional().nullable(),
  transport: z.string().max(50).optional().nullable(),
  specialRequests: z.string().optional().nullable(),
  pricePerPerson: z.coerce.number().int().min(0).optional().nullable(),
});

// POST /api/bookings - Create new booking (public + logged-in) or staff manual (intent)
export async function POST(request: NextRequest) {
  try {
    await ensureBookingCurrencyColumns();
    const session = await auth();
    const body = await request.json();

    if ((await isStaff(session)) && body?.intent === "staff_manual") {
      const parsed = staffManualBookingSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      const d = parsed.data;
      if (!isValidCompanyId(d.companyId)) {
        return NextResponse.json({ success: false, error: "Invalid company" }, { status: 400 });
      }
      const companyId = d.companyId as CompanyId;
      if (companyId === "bth") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Bondo Travellers Hotel does not use safari tour bookings. Use hotel bookings instead.",
          },
          { status: 400 }
        );
      }
      const permDenied = await checkApiPermission(session, companyId, "bookings", true);
      if (permDenied) return permDenied;
      let tourId: number | null = d.tourId ?? null;
      let safariPackage = d.safariPackage;
      let tripCountry = d.tripCountry;
      let endDate = d.endDate ?? d.startDate ?? d.travelDate;

      if (tourId != null) {
        const [tourRow] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
        if (!tourRow) {
          tourId = null;
        } else {
          safariPackage = safariPackage || tourRow.title;
          tripCountry = tripCountry ?? inferTripCountry(tourRow.countries);
          endDate =
            d.endDate ??
            addDaysIso(d.startDate ?? d.travelDate, Math.max(0, tourRow.days - 1)) ??
            d.travelDate;
        }
      }

      const originalCurrency = d.originalCurrency;
      const originalAmount = d.originalAmount ?? d.totalPrice ?? null;
      const rateToKes = d.exchangeRateToKes ?? exchangeRateToKes(originalCurrency);
      const accountingTotalKes =
        originalAmount != null
          ? wholeInCurrencyToKes(originalAmount, originalCurrency)
          : d.totalPrice ?? null;
      const accountingPerPersonKes =
        d.pricePerPerson != null
          ? wholeInCurrencyToKes(d.pricePerPerson, originalCurrency)
          : null;

      const [booking] = await db
        .insert(bookings)
        .values({
          companyId,
          userId: getUserId(session),
          tourId,
          status: d.status,
          travelDate: d.travelDate,
          guests: d.guests,
          accommodation: d.accommodation ?? "mid-range",
          transport: d.transport ?? "4x4-landcruiser",
          specialRequests: d.specialRequests ?? null,
          safariPackage,
          tripCountry,
          startDate: d.startDate ?? d.travelDate,
          endDate,
          paymentStatus: d.paymentStatus,
          firstName: d.firstName,
          lastName: d.lastName ?? null,
          email: d.email,
          phone: d.phone ?? null,
          country: d.country ?? null,
          totalPrice: accountingTotalKes,
          pricePerPerson: accountingPerPersonKes,
          originalAmount,
          originalCurrency,
          exchangeRateToKes: rateToKes,
          exchangeRateDate: d.exchangeRateDate ?? todayYmd(),
        })
        .returning();

      await createNotification({
        companyId,
        type: "booking",
        action: "created",
        referenceId: booking.id,
        title: `Safari booking #${booking.id} created — ${[booking.firstName, booking.lastName].filter(Boolean).join(" ") || booking.email}`,
        metadata: {
          email: booking.email,
          safariPackage,
          status: booking.status,
        },
      });

      try {
        const { ensureDashboardPaymentForPaidSafariBooking } = await import("@/lib/sync-paid-source-payments");
        await ensureDashboardPaymentForPaidSafariBooking(booking);
      } catch (e) {
        console.error("ensureDashboardPaymentForPaidSafariBooking (staff_manual):", e);
      }
      try {
        const { syncRevenueFromSafariBooking } = await import("@/lib/sync-source-revenue");
        await syncRevenueFromSafariBooking(booking);
      } catch (e) {
        console.error("syncRevenueFromSafariBooking (staff_manual):", e);
      }

      return NextResponse.json({ success: true, booking });
    }

    let tourId: number | undefined = body.tourId;
    if (tourId == null && body.tourSlug) {
      const [tour] = await db
        .select({ id: tours.id })
        .from(tours)
        .where(eq(tours.slug, body.tourSlug))
        .limit(1);
      tourId = tour?.id;
    }

    if (!tourId) {
      return NextResponse.json({ success: false, error: "Tour not found" }, { status: 404 });
    }

    const [tourRow] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
    if (!tourRow) {
      return NextResponse.json({ success: false, error: "Tour not found" }, { status: 404 });
    }

    const userId = getUserId(session);
    const companyId = resolveCompanyId(body.companyId);
    if (companyId === "bth") {
      return NextResponse.json(
        { success: false, error: "Tour bookings are not available for this tenant." },
        { status: 400 }
      );
    }
    const tripCountry = inferTripCountry(tourRow.countries);
    const safariPackage = tourRow.title;
    const startDate = body.travelDate as string;
    const endDate = addDaysIso(startDate, Math.max(0, tourRow.days - 1)) ?? startDate;
    const originalCurrencyParsed = currencyCodeSchema.safeParse(body.originalCurrency);
    const originalCurrency = originalCurrencyParsed.success ? originalCurrencyParsed.data : "USD";
    const originalAmount =
      Number.isFinite(Number(body.originalAmount))
        ? Math.max(0, Math.round(Number(body.originalAmount)))
        : Number.isFinite(Number(body.totalPrice))
          ? Math.max(0, Math.round(Number(body.totalPrice)))
          : Math.max(0, Math.round(tourRow.price * parseInt(body.guests, 10)));
    const originalPricePerPerson =
      Number.isFinite(Number(body.pricePerPerson))
        ? Math.max(0, Math.round(Number(body.pricePerPerson)))
        : Math.round(originalAmount / Math.max(1, parseInt(body.guests, 10)));
    const rateToKes = exchangeRateToKes(originalCurrency);
    const accountingTotalKes = wholeInCurrencyToKes(originalAmount, originalCurrency);
    const accountingPerPersonKes = wholeInCurrencyToKes(originalPricePerPerson, originalCurrency);

    const [booking] = await db
      .insert(bookings)
      .values({
        companyId,
        userId: userId,
        tourId: tourId,
        status: "pending",
        travelDate: body.travelDate,
        guests: parseInt(body.guests, 10),
        accommodation: body.accommodation ?? "mid-range",
        transport: body.transport ?? "4x4-landcruiser",
        specialRequests: body.specialRequests ?? null,
        safariPackage,
        tripCountry,
        startDate,
        endDate,
        paymentStatus: "unpaid",
        firstName: body.firstName,
        lastName: body.lastName ?? null,
        email: body.email,
        phone: body.phone ?? null,
        country: body.country ?? null,
        pricePerPerson: accountingPerPersonKes,
        totalPrice: accountingTotalKes,
        originalAmount,
        originalCurrency,
        exchangeRateToKes: rateToKes,
        exchangeRateDate: todayYmd(),
      })
      .returning();

    await createNotification({
      companyId,
      type: "booking",
      action: "created",
      referenceId: booking.id,
      title: `Safari booking #${booking.id} submitted — ${[booking.firstName, booking.lastName].filter(Boolean).join(" ") || booking.email}`,
      metadata: { email: booking.email, safariPackage },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ success: false, error: "Failed to create booking" }, { status: 500 });
  }
}

// PATCH /api/bookings - Update booking (staff only); requires companyId to scope tenant
export async function PATCH(request: NextRequest) {
  try {
    await ensureBookingCurrencyColumns();
    const session = await auth();
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isStaff(session))) {
      return NextResponse.json({ error: "Forbidden - Staff only" }, { status: 403 });
    }

    const body = await request.json();
    const bookingId = body.bookingId as number | undefined;
    const tenantId = body.companyId as string | undefined;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    if (!tenantId || !isValidCompanyId(tenantId)) {
      return NextResponse.json({ error: "Valid companyId is required" }, { status: 400 });
    }

    const patchDenied = await checkApiPermission(session, tenantId, "bookings", true);
    if (patchDenied) return patchDenied;

    const rawPatch = pickBookingPatch(body as Record<string, unknown>);
    if (Object.keys(rawPatch).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const patch: Record<string, unknown> = { ...rawPatch };
    if (patch.guests !== undefined) patch.guests = parseInt(String(patch.guests), 10);
    if (patch.totalPrice !== undefined) patch.totalPrice = parseInt(String(patch.totalPrice), 10);
    if (patch.pricePerPerson !== undefined) patch.pricePerPerson = parseInt(String(patch.pricePerPerson), 10);
    if (patch.tourId !== undefined) {
      const v = patch.tourId;
      if (v === null || v === "") patch.tourId = null;
      else {
        const n = parseInt(String(v), 10);
        patch.tourId = Number.isNaN(n) ? null : n;
      }
    }

    const [updatedBooking] = await db
      .update(bookings)
      .set({ ...patch, updatedAt: new Date() } as Record<string, unknown>)
      .where(and(eq(bookings.id, bookingId), eq(bookings.companyId, tenantId)))
      .returning();

    if (!updatedBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updateTitle =
      rawPatch.status !== undefined
        ? `Safari booking #${updatedBooking.id} reservation ${updatedBooking.status}`
        : rawPatch.paymentStatus !== undefined
          ? `Safari booking #${updatedBooking.id} pay status changed to ${updatedBooking.paymentStatus}`
          : rawPatch.totalPrice !== undefined
            ? `Safari booking #${updatedBooking.id} total changed`
            : rawPatch.travelDate !== undefined
              ? `Safari booking #${updatedBooking.id} travel date changed`
              : rawPatch.tourId !== undefined
                ? `Safari booking #${updatedBooking.id} package changed`
                : `Safari booking #${updatedBooking.id} details changed`;
    await createNotification({
      companyId: tenantId,
      type: "booking",
      action: "updated",
      referenceId: updatedBooking.id,
      title: updateTitle,
      metadata: {
        status: updatedBooking.status,
        paymentStatus: updatedBooking.paymentStatus,
      },
    });

    try {
      const { ensureDashboardPaymentForPaidSafariBooking } = await import("@/lib/sync-paid-source-payments");
      await ensureDashboardPaymentForPaidSafariBooking(updatedBooking);
    } catch (e) {
      console.error("ensureDashboardPaymentForPaidSafariBooking:", e);
    }

    try {
      const { syncRevenueFromSafariBooking } = await import("@/lib/sync-source-revenue");
      await syncRevenueFromSafariBooking(updatedBooking);
    } catch (e) {
      console.error("syncRevenueFromSafariBooking:", e);
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

// DELETE /api/bookings - Delete booking (staff with bookings edit); requires companyId
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("id");
    const tenantId = searchParams.get("companyId");

    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    if (!tenantId || !isValidCompanyId(tenantId)) {
      return NextResponse.json({ error: "Valid companyId is required" }, { status: 400 });
    }

    const delDenied = await checkApiPermission(session, tenantId, "bookings", true);
    if (delDenied) return delDenied;

    const bid = parseInt(bookingId, 10);

    const deleted = await db
      .delete(bookings)
      .where(and(eq(bookings.id, bid), eq(bookings.companyId, tenantId)))
      .returning({ id: bookings.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    try {
      const { deleteRevenueForEntity } = await import("@/lib/sync-source-revenue");
      await deleteRevenueForEntity(tenantId, "tour", bid);
    } catch (e) {
      console.error("deleteRevenueForEntity (booking):", e);
    }

    await createNotification({
      companyId: tenantId,
      type: "booking",
      action: "deleted",
      referenceId: bid,
      title: `Safari booking #${bid} deleted`,
      metadata: {},
    });

    return NextResponse.json({
      success: true,
      message: "Booking deleted",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}
