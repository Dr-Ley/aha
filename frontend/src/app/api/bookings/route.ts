import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, tours } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { canAccessDashboardFromSession } from "@/lib/permissions-server";
import { createNotification } from "@/lib/notify";
import { isValidCompanyId } from "@/lib/tenant";
import { requireAuthenticatedUser, requireTenantContext } from "@/server/tenancy";
import { pickBookingPatch } from "@/lib/dashboard-mutations";
import { companyIdZod } from "@/lib/schemas/company-id";
import {
  CURRENCIES,
  exchangeRateToKes,
  type CurrencyCode,
  usdToWholeInCurrency,
  wholeInCurrencyToKes,
} from "@/lib/data";
import { mapDbBookingWithTour } from "@/lib/bookings-db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { publicBookingBodySchema } from "@/lib/schemas/public";
import { normalizeTravellerCounts, travellerHeadcount } from "@/lib/travellers";
import {
  BOOKING_COMPONENT_TYPES,
  BOOKING_KINDS,
  DEFAULT_COMPANY_MARKUP_PERCENT,
  quoteTourSafariPackage,
  resolveBookingKind,
} from "@/lib/pricing";
import { PricingService } from "@/lib/pricing-service";
import {
  draftsFromCostStack,
  draftsFromInputs,
  ensureBookingComponentTables,
  getCompanyMarkupPercent,
  listComponentsForBooking,
  listComponentsForBookings,
  quoteDrafts,
  replaceBookingComponents,
  storedCostStackFromComponents,
  type BookingComponentDraft,
} from "@/lib/booking-components";
import {
  bookingPriceChangeSummary,
  commitBookingVersion,
  ensureInitialBookingVersion,
} from "@/lib/booking-service";
import { maybeSendBookingConfirmation } from "@/lib/email/booking-confirmation";
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
let bookingPricingColumnsEnsured = false;

async function ensureBookingPricingColumns(): Promise<void> {
  if (bookingPricingColumnsEnsured) return;
  await db.execute(sql`
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "pricing_source" varchar(32) DEFAULT 'manual'
  `);
  await db.execute(sql`
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cost_stack" jsonb
  `);
  await db.execute(sql`
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "booking_kind" varchar(32) DEFAULT 'customized_safari'
  `);
  bookingPricingColumnsEnsured = true;
}

async function ensureBookingCurrencyColumns(): Promise<void> {
  if (bookingCurrencyColumnsEnsured) return;
  await db.execute(sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "original_amount" integer`);
  await db.execute(sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "original_currency" varchar(10) DEFAULT 'KES' NOT NULL`);
  await db.execute(sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "exchange_rate_to_kes" real DEFAULT 1 NOT NULL`);
  await db.execute(sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "exchange_rate_date" date`);
  const { ensureBookingCustomerColumn, ensureBookingTravellerColumns } = await import("@/lib/customers");
  await ensureBookingCustomerColumn();
  await ensureBookingTravellerColumns();
  const { ensureCatalogCompanyColumns } = await import("@/lib/catalog-company");
  await ensureCatalogCompanyColumns();
  await ensureBookingPricingColumns();
  const { ensureVoucherToCompanyColumn } = await import("@/lib/ensure-finance-documents");
  await ensureVoucherToCompanyColumn();
  await ensureBookingComponentTables();
  bookingCurrencyColumnsEnsured = true;
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/bookings - Staff: all bookings for ?companyId=  Customer: own bookings (optional company filter)
export async function GET(request: NextRequest) {
  try {
    await ensureBookingCurrencyColumns();
    const authResult = await requireAuthenticatedUser();
    if (!authResult.ok) return authResult.response;
    const { session, userId } = authResult;

    const { searchParams } = new URL(request.url);
    const staffCheck = await canAccessDashboardFromSession(session);

    let allBookings;

    if (staffCheck) {
      const tenant = await requireTenantContext(searchParams.get("companyId"), {
        module: ["bookings", "tours"],
      });
      if (!tenant.ok) return tenant.response;
      const companyId = tenant.ctx.companyId;
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

    const componentsByBooking = await listComponentsForBookings(
      allBookings.map((item) => item.booking.id)
    );
    return NextResponse.json({
      success: true,
      bookings: allBookings.map((item) =>
        mapDbBookingWithTour(
          item.booking,
          item.tour,
          componentsByBooking.get(item.booking.id) ?? []
        )
      ),
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

const costStackBodySchema = z.object({
  markupPercent: z.coerce.number().int().min(0).max(500).default(DEFAULT_COMPANY_MARKUP_PERCENT),
  accommodation: z.coerce.number().int().min(0).optional().nullable(),
  transport: z.coerce.number().int().min(0).optional().nullable(),
  parkFees: z.coerce.number().int().min(0).optional().nullable(),
  transfers: z.coerce.number().int().min(0).optional().nullable(),
  activities: z.coerce.number().int().min(0).optional().nullable(),
  other: z.coerce.number().int().min(0).optional().nullable(),
});

const componentBodySchema = z.object({
  type: z.enum(BOOKING_COMPONENT_TYPES),
  cost: z.coerce.number().int().min(0),
  config: z.record(z.unknown()).optional().nullable(),
  sequence: z.coerce.number().int().min(0).optional(),
  label: z.string().max(255).optional().nullable(),
});

function draftsFromRequest(input: {
  components?: z.infer<typeof componentBodySchema>[] | null;
  costStack?: z.infer<typeof costStackBodySchema> | null;
}): BookingComponentDraft[] {
  if (input.components && input.components.length > 0) {
    return draftsFromInputs(input.components);
  }
  if (input.costStack) return draftsFromCostStack(input.costStack);
  return [];
}

function quoteFromCostStackBody(
  stack: z.infer<typeof costStackBodySchema>,
  currency: CurrencyCode
) {
  return quoteDrafts(draftsFromCostStack(stack), currency, stack.markupPercent);
}

function sellingComponentDraft(input: {
  cost: number;
  source: string;
  label?: string | null;
  tourId?: number | null;
}): BookingComponentDraft[] {
  const cost = Math.round(Number(input.cost) || 0);
  if (cost <= 0) return [];
  return [
    {
      type: "other",
      cost,
      sequence: 0,
      label: input.label ?? "Safari booking",
      config: {
        source: input.source,
        ...(input.tourId != null ? { tourId: input.tourId } : {}),
        ...(input.label ? { label: input.label } : {}),
      },
    },
  ];
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
  guests: z.coerce.number().int().min(1).max(99).optional(),
  adults: z.coerce.number().int().min(0).max(99).optional(),
  children: z.coerce.number().int().min(0).max(99).optional(),
  infants: z.coerce.number().int().min(0).max(99).optional(),
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
  voucherToCompany: z.string().max(255).optional().nullable(),
  pricePerPerson: z.coerce.number().int().min(0).optional().nullable(),
  /** package = catalog tour rates; cost_stack = component costs + markup; manual = staff totals. */
  pricingSource: z.enum(["package", "manual", "cost_stack"]).default("manual"),
  costStack: costStackBodySchema.optional().nullable(),
  components: z.array(componentBodySchema).optional(),
  markupPercent: z.coerce.number().int().min(0).max(500).optional().nullable(),
  bookingKind: z.enum(BOOKING_KINDS).optional().nullable(),
}).refine((d) => travellerHeadcount(normalizeTravellerCounts(d)) >= 1, {
  message: "At least one traveller is required",
  path: ["adults"],
}).refine((d) => d.pricingSource !== "package" || d.tourId != null, {
  message: "A linked tour is required for package pricing",
  path: ["tourId"],
}).refine((d) => {
  if (d.pricingSource !== "cost_stack") return true;
  const drafts = draftsFromRequest(d);
  if (drafts.length === 0) return false;
  const markup = d.markupPercent ?? d.costStack?.markupPercent ?? DEFAULT_COMPANY_MARKUP_PERCENT;
  return quoteDrafts(drafts, d.originalCurrency, markup).costTotal > 0;
}, {
  message: "Cost stack requires at least one positive cost line",
  path: ["costStack"],
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
      const tenant = await requireTenantContext(d.companyId, {
        module: "bookings",
        requireEdit: true,
      });
      if (!tenant.ok) return tenant.response;
      const companyId = tenant.ctx.companyId;
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
      let tourId: number | null = d.tourId ?? null;
      let safariPackage = d.safariPackage;
      let tripCountry = d.tripCountry;
      let endDate = d.endDate ?? d.startDate ?? d.travelDate;

      let tourRow: typeof tours.$inferSelect | null = null;
      if (tourId != null) {
        const [found] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
        if (!found || found.companyId !== companyId) {
          tourId = null;
        } else {
          tourRow = found;
          safariPackage = safariPackage || found.title;
          tripCountry = tripCountry ?? inferTripCountry(found.countries as string[]);
          endDate =
            d.endDate ??
            addDaysIso(d.startDate ?? d.travelDate, Math.max(0, found.days - 1)) ??
            d.travelDate;
        }
      }

      const travellerCounts = normalizeTravellerCounts({
        adults: d.adults,
        children: d.children,
        infants: d.infants,
        guests: d.guests,
      });
      const guestHeadcount = Math.max(1, travellerHeadcount(travellerCounts));

      const originalCurrency = d.originalCurrency;
      let originalAmount = d.originalAmount ?? d.totalPrice ?? null;
      let accountingPerPersonKes: number | null =
        d.pricePerPerson != null
          ? wholeInCurrencyToKes(d.pricePerPerson, originalCurrency)
          : null;
      let storedCostStack: ReturnType<typeof storedCostStackFromComponents> | null = null;
      const pricingSource = d.pricingSource;
      let componentDrafts: BookingComponentDraft[] = [];

      if (pricingSource === "package") {
        if (!tourRow) {
          return NextResponse.json(
            { success: false, error: "Linked tour not found for package pricing" },
            { status: 400 }
          );
        }
        const quote = PricingService.quotePackage(
          {
            price: tourRow.price,
            childPrice: tourRow.childPrice,
            infantPrice: tourRow.infantPrice,
          },
          travellerCounts,
          originalCurrency
        );
        originalAmount = quote.sellingPrice;
        const originalPricePerPerson =
          quote.lines.find((line) => line.kind === "adult")?.unitAmount ??
          usdToWholeInCurrency(tourRow.price, originalCurrency);
        accountingPerPersonKes = wholeInCurrencyToKes(originalPricePerPerson, originalCurrency);
        componentDrafts = sellingComponentDraft({
          cost: quote.sellingPrice,
          source: "package",
          label: safariPackage,
          tourId,
        });
      } else if (pricingSource === "cost_stack") {
        componentDrafts = draftsFromRequest(d);
        const markup =
          d.markupPercent ??
          d.costStack?.markupPercent ??
          (await getCompanyMarkupPercent(companyId));
        const quote = quoteDrafts(componentDrafts, originalCurrency, markup, travellerCounts);
        originalAmount = quote.sellingPrice;
        accountingPerPersonKes = null;
        storedCostStack = storedCostStackFromComponents(componentDrafts, quote);
      } else if (originalAmount != null) {
        componentDrafts = sellingComponentDraft({
          cost: originalAmount,
          source: "manual",
          label: safariPackage,
        });
      }

      const rateToKes = d.exchangeRateToKes ?? exchangeRateToKes(originalCurrency);
      const accountingTotalKes =
        originalAmount != null
          ? wholeInCurrencyToKes(originalAmount, originalCurrency)
          : d.totalPrice ?? null;

      const { findOrCreateCustomerFromGuest } = await import("@/lib/customers");
      const customerId = await findOrCreateCustomerFromGuest(companyId, {
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phone: d.phone,
        country: d.country,
      });

      const [booking] = await db
        .insert(bookings)
        .values({
          companyId,
          userId: getUserId(session),
          customerId,
          tourId,
          status: d.status,
          travelDate: d.travelDate,
          guests: guestHeadcount,
          adults: travellerCounts.adults,
          children: travellerCounts.children,
          infants: travellerCounts.infants,
          accommodation: d.accommodation ?? "mid-range",
          transport: d.transport ?? "4x4-landcruiser",
          specialRequests: d.specialRequests ?? null,
          voucherToCompany: d.voucherToCompany?.trim() || null,
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
          pricingSource,
          costStack: storedCostStack,
          bookingKind: resolveBookingKind({
            bookingKind: d.bookingKind,
            pricingSource,
            tourId,
          }),
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

      void maybeSendBookingConfirmation(booking);

      const staffComponents = await replaceBookingComponents(booking.id, componentDrafts);
      const [staffVersioned] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, booking.id))
        .limit(1);
      await ensureInitialBookingVersion(staffVersioned ?? booking, getUserId(session));

      return NextResponse.json({
        success: true,
        booking: { ...(staffVersioned ?? booking), components: staffComponents },
      });
    }

    const limited = enforceRateLimit(request, "public-booking", 10);
    if (limited) return limited;

    const publicParsed = publicBookingBodySchema.safeParse(body);
    if (!publicParsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid booking details" },
        { status: 400 }
      );
    }
    const pub = publicParsed.data;

    let tourId: number | undefined = pub.tourId;
    if (tourId == null && pub.tourSlug) {
      const [tour] = await db
        .select({ id: tours.id })
        .from(tours)
        .where(eq(tours.slug, pub.tourSlug))
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
    const companyId = pub.companyId;
    if (tourRow.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: "Tour does not belong to this company" },
        { status: 400 }
      );
    }
    if (companyId === "bth") {
      return NextResponse.json(
        { success: false, error: "Tour bookings are not available for this tenant." },
        { status: 400 }
      );
    }
    const tripCountry = inferTripCountry(tourRow.countries);
    const safariPackage = tourRow.title;
    const startDate = pub.travelDate;
    const endDate = addDaysIso(startDate, Math.max(0, tourRow.days - 1)) ?? startDate;
    const originalCurrencyParsed = currencyCodeSchema.safeParse(pub.originalCurrency);
    const originalCurrency = originalCurrencyParsed.success ? originalCurrencyParsed.data : "USD";
    const travellerCounts = normalizeTravellerCounts({
      adults: pub.adults,
      children: pub.children,
      infants: pub.infants,
      guests: pub.guests,
    });
    const guestHeadcount = Math.max(1, travellerHeadcount(travellerCounts));
    const quote = quoteTourSafariPackage(
      {
        price: tourRow.price,
        childPrice: tourRow.childPrice,
        infantPrice: tourRow.infantPrice,
      },
      travellerCounts,
      originalCurrency
    );
    const originalAmount = quote.sellingPrice;
    const originalPricePerPerson =
      quote.lines.find((line) => line.kind === "adult")?.unitAmount ??
      usdToWholeInCurrency(tourRow.price, originalCurrency);
    const rateToKes = exchangeRateToKes(originalCurrency);
    const accountingTotalKes = wholeInCurrencyToKes(originalAmount, originalCurrency);
    const accountingPerPersonKes = wholeInCurrencyToKes(originalPricePerPerson, originalCurrency);

    const { findOrCreateCustomerFromGuest } = await import("@/lib/customers");
    const customerId = await findOrCreateCustomerFromGuest(
      companyId,
      {
        firstName: pub.firstName,
        lastName: pub.lastName,
        email: pub.email,
        phone: pub.phone,
        country: pub.country,
      },
      userId
    );

    const [booking] = await db
      .insert(bookings)
      .values({
        companyId,
        userId: userId,
        customerId,
        tourId: tourId,
        status: "pending",
        travelDate: pub.travelDate,
        guests: guestHeadcount,
        adults: travellerCounts.adults,
        children: travellerCounts.children,
        infants: travellerCounts.infants,
        accommodation: pub.accommodation ?? "mid-range",
        transport: pub.transport ?? "4x4-landcruiser",
        specialRequests: pub.specialRequests ?? null,
        safariPackage,
        tripCountry,
        startDate,
        endDate,
        paymentStatus: "unpaid",
        firstName: pub.firstName,
        lastName: pub.lastName ?? null,
        email: pub.email,
        phone: pub.phone ?? null,
        country: pub.country ?? null,
        pricePerPerson: accountingPerPersonKes,
        totalPrice: accountingTotalKes,
        originalAmount,
        originalCurrency,
        exchangeRateToKes: rateToKes,
        exchangeRateDate: todayYmd(),
        pricingSource: "package",
        costStack: null,
        bookingKind: "predefined_safari",
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

    void maybeSendBookingConfirmation(booking);

    const publicComponents = await replaceBookingComponents(
      booking.id,
      sellingComponentDraft({
        cost: originalAmount,
        source: "package",
        label: safariPackage,
        tourId,
      })
    );
    await ensureInitialBookingVersion(booking, userId);

    return NextResponse.json({
      success: true,
      booking: { ...booking, components: publicComponents },
    });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ success: false, error: "Failed to create booking" }, { status: 500 });
  }
}

// PATCH /api/bookings - Update booking (staff only); requires companyId to scope tenant
export async function PATCH(request: NextRequest) {
  try {
    await ensureBookingCurrencyColumns();
    const body = await request.json();
    const bookingId = body.bookingId as number | undefined;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const tenant = await requireTenantContext(body.companyId, {
      module: "bookings",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const tenantId = tenant.ctx.companyId;
    const userId = tenant.ctx.userId;

    const rawPatch = pickBookingPatch(body as Record<string, unknown>);
    const parsedComponents = z.array(componentBodySchema).safeParse(body.components);
    const incomingComponents = parsedComponents.success ? parsedComponents.data : null;
    const pricingSource =
      body.pricingSource === "package" || body.pricingSource === "cost_stack"
        ? (body.pricingSource as "package" | "cost_stack")
        : null;
    if (
      Object.keys(rawPatch).length === 0 &&
      !pricingSource &&
      incomingComponents == null
    ) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.companyId, tenantId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    await ensureInitialBookingVersion(existing, userId);
    const previousSellingPrice = existing.originalAmount ?? existing.totalPrice ?? null;
    let nextComponentDrafts: BookingComponentDraft[] | null = incomingComponents
      ? draftsFromInputs(incomingComponents)
      : null;

    const patch: Record<string, unknown> = { ...rawPatch };
    if (patch.adults !== undefined) patch.adults = parseInt(String(patch.adults), 10);
    if (patch.children !== undefined) patch.children = parseInt(String(patch.children), 10);
    if (patch.infants !== undefined) patch.infants = parseInt(String(patch.infants), 10);
    if (patch.guests !== undefined) patch.guests = parseInt(String(patch.guests), 10);
    if (
      patch.adults !== undefined ||
      patch.children !== undefined ||
      patch.infants !== undefined
    ) {
      const counts = normalizeTravellerCounts({
        adults: patch.adults as number | undefined,
        children: patch.children as number | undefined,
        infants: patch.infants as number | undefined,
      });
      patch.adults = counts.adults;
      patch.children = counts.children;
      patch.infants = counts.infants;
      patch.guests = Math.max(1, travellerHeadcount(counts));
    } else if (patch.guests !== undefined) {
      const guests = Math.max(1, Number(patch.guests) || 1);
      patch.guests = guests;
      patch.adults = guests;
      patch.children = 0;
      patch.infants = 0;
    }
    if (patch.totalPrice !== undefined) patch.totalPrice = parseInt(String(patch.totalPrice), 10);
    if (patch.pricePerPerson !== undefined) patch.pricePerPerson = parseInt(String(patch.pricePerPerson), 10);
    if (patch.originalAmount !== undefined) {
      patch.originalAmount =
        patch.originalAmount == null || patch.originalAmount === ""
          ? null
          : parseInt(String(patch.originalAmount), 10);
    }
    if (patch.originalCurrency !== undefined) {
      const parsedCurrency = currencyCodeSchema.safeParse(patch.originalCurrency);
      if (parsedCurrency.success) patch.originalCurrency = parsedCurrency.data;
      else delete patch.originalCurrency;
    }
    if (patch.exchangeRateToKes !== undefined) {
      patch.exchangeRateToKes = Number(patch.exchangeRateToKes);
    }
    if (patch.tourId !== undefined) {
      const v = patch.tourId;
      if (v === null || v === "") patch.tourId = null;
      else {
        const n = parseInt(String(v), 10);
        patch.tourId = Number.isNaN(n) ? null : n;
      }
    }
    if (patch.bookingKind !== undefined) {
      patch.bookingKind = resolveBookingKind({ bookingKind: String(patch.bookingKind) });
    }
    if (patch.voucherToCompany !== undefined) {
      const raw = patch.voucherToCompany;
      patch.voucherToCompany =
        raw == null || String(raw).trim() === "" ? null : String(raw).trim().slice(0, 255);
    }

    if (pricingSource === "package") {
      const linkedTourId =
        patch.tourId !== undefined ? (patch.tourId as number | null) : existing.tourId;
      if (linkedTourId == null) {
        return NextResponse.json(
          { error: "A linked tour is required for package pricing" },
          { status: 400 }
        );
      }
      const [tourRow] = await db
        .select()
        .from(tours)
        .where(and(eq(tours.id, linkedTourId), eq(tours.companyId, tenantId)))
        .limit(1);
      if (!tourRow) {
        return NextResponse.json({ error: "Linked tour not found" }, { status: 400 });
      }
      const travellerCounts = normalizeTravellerCounts({
        adults: (patch.adults as number | undefined) ?? existing.adults,
        children: (patch.children as number | undefined) ?? existing.children,
        infants: (patch.infants as number | undefined) ?? existing.infants,
        guests: (patch.guests as number | undefined) ?? existing.guests,
      });
      const quoteCurrencyParsed = currencyCodeSchema.safeParse(
        patch.originalCurrency ?? existing.originalCurrency ?? "KES"
      );
      const quoteCurrency = quoteCurrencyParsed.success ? quoteCurrencyParsed.data : "KES";
      const quote = PricingService.quotePackage(
        {
          price: tourRow.price,
          childPrice: tourRow.childPrice,
          infantPrice: tourRow.infantPrice,
        },
        travellerCounts,
        quoteCurrency
      );
      const originalPricePerPerson =
        quote.lines.find((line) => line.kind === "adult")?.unitAmount ??
        usdToWholeInCurrency(tourRow.price, quoteCurrency);
      patch.tourId = linkedTourId;
      patch.adults = travellerCounts.adults;
      patch.children = travellerCounts.children;
      patch.infants = travellerCounts.infants;
      patch.guests = Math.max(1, travellerHeadcount(travellerCounts));
      patch.originalCurrency = quoteCurrency;
      patch.originalAmount = quote.sellingPrice;
      patch.exchangeRateToKes = exchangeRateToKes(quoteCurrency);
      patch.exchangeRateDate = todayYmd();
      patch.totalPrice = wholeInCurrencyToKes(quote.sellingPrice, quoteCurrency);
      patch.pricePerPerson = wholeInCurrencyToKes(originalPricePerPerson, quoteCurrency);
      if (!patch.safariPackage) patch.safariPackage = tourRow.title;
      patch.pricingSource = "package";
      patch.costStack = null;
      nextComponentDrafts = sellingComponentDraft({
        cost: quote.sellingPrice,
        source: "package",
        label: String(patch.safariPackage ?? tourRow.title),
        tourId: linkedTourId,
      });
      if (body.bookingKind == null) {
        patch.bookingKind = resolveBookingKind({
          pricingSource: "package",
          tourId: linkedTourId,
        });
      }
    } else if (pricingSource === "cost_stack") {
      const parsedStack = costStackBodySchema.safeParse(body.costStack);
      const drafts =
        nextComponentDrafts ??
        (parsedStack.success ? draftsFromCostStack(parsedStack.data) : []);
      if (drafts.length === 0) {
        return NextResponse.json(
          { error: "Valid costStack or components are required for cost-stack pricing" },
          { status: 400 }
        );
      }
      const quoteCurrencyParsed = currencyCodeSchema.safeParse(
        patch.originalCurrency ?? existing.originalCurrency ?? "KES"
      );
      const quoteCurrency = quoteCurrencyParsed.success ? quoteCurrencyParsed.data : "KES";
      const markup =
        typeof body.markupPercent === "number"
          ? body.markupPercent
          : parsedStack.success
            ? parsedStack.data.markupPercent
            : (existing.costStack?.markupPercent ?? (await getCompanyMarkupPercent(tenantId)));
      const quote = quoteDrafts(drafts, quoteCurrency, markup);
      if (quote.costTotal <= 0) {
        return NextResponse.json(
          { error: "Cost stack requires at least one positive cost line" },
          { status: 400 }
        );
      }
      nextComponentDrafts = drafts;
      patch.costStack = storedCostStackFromComponents(drafts, quote);
      patch.originalCurrency = quoteCurrency;
      patch.originalAmount = quote.sellingPrice;
      patch.exchangeRateToKes = exchangeRateToKes(quoteCurrency);
      patch.exchangeRateDate = todayYmd();
      patch.totalPrice = wholeInCurrencyToKes(quote.sellingPrice, quoteCurrency);
      patch.pricePerPerson = null;
      patch.pricingSource = "cost_stack";
      if (body.bookingKind == null) {
        patch.bookingKind = resolveBookingKind({ pricingSource: "cost_stack" });
      }
    } else if (
      nextComponentDrafts &&
      nextComponentDrafts.length > 0 &&
      body.pricingSource !== "manual"
    ) {
      const quoteCurrencyParsed = currencyCodeSchema.safeParse(
        patch.originalCurrency ?? existing.originalCurrency ?? "KES"
      );
      const quoteCurrency = quoteCurrencyParsed.success ? quoteCurrencyParsed.data : "KES";
      const markup =
        typeof body.markupPercent === "number"
          ? body.markupPercent
          : (existing.costStack?.markupPercent ?? (await getCompanyMarkupPercent(tenantId)));
      const quote = quoteDrafts(nextComponentDrafts, quoteCurrency, markup);
      patch.originalCurrency = quoteCurrency;
      patch.originalAmount = quote.sellingPrice;
      patch.exchangeRateToKes = exchangeRateToKes(quoteCurrency);
      patch.exchangeRateDate = todayYmd();
      patch.totalPrice = wholeInCurrencyToKes(quote.sellingPrice, quoteCurrency);
      patch.pricePerPerson = null;
      patch.pricingSource = "cost_stack";
      patch.costStack = storedCostStackFromComponents(nextComponentDrafts, quote);
    }

    // Manual edits of totals clear cost-stack unless package/cost_stack was requested above.
    if (body.pricingSource === "manual") {
      patch.pricingSource = "manual";
      patch.costStack = null;
      const manualTotal =
        (patch.originalAmount as number | null | undefined) ??
        (patch.totalPrice as number | null | undefined) ??
        existing.originalAmount ??
        existing.totalPrice ??
        0;
      nextComponentDrafts = sellingComponentDraft({
        cost: Number(manualTotal) || 0,
        source: "manual",
        label: String(patch.safariPackage ?? existing.safariPackage ?? "Safari booking"),
      });
    } else if (
      pricingSource == null &&
      incomingComponents == null &&
      (rawPatch.totalPrice !== undefined || rawPatch.pricePerPerson !== undefined)
    ) {
      patch.pricingSource = "manual";
      patch.costStack = null;
      const manualTotal =
        (patch.originalAmount as number | null | undefined) ??
        (patch.totalPrice as number | null | undefined) ??
        existing.originalAmount ??
        0;
      nextComponentDrafts = sellingComponentDraft({
        cost: Number(manualTotal) || 0,
        source: "manual",
        label: String(patch.safariPackage ?? existing.safariPackage ?? "Safari booking"),
      });
    }

    const [updatedBooking] = await db
      .update(bookings)
      .set({ ...patch, updatedAt: new Date() } as Record<string, unknown>)
      .where(and(eq(bookings.id, bookingId), eq(bookings.companyId, tenantId)))
      .returning();

    if (!updatedBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (nextComponentDrafts) {
      await replaceBookingComponents(updatedBooking.id, nextComponentDrafts);
    }
    const savedComponents = await listComponentsForBooking(updatedBooking.id);
    const newSelling = updatedBooking.originalAmount ?? updatedBooking.totalPrice ?? null;
    const version = await commitBookingVersion({
      booking: updatedBooking,
      previousSellingPrice,
      changedByUserId: userId,
      changeSummary: bookingPriceChangeSummary(previousSellingPrice, newSelling),
    });

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
      booking: { ...updatedBooking, components: savedComponents, currentVersion: version.version },
      version: {
        version: version.version,
        sellingPrice: version.sellingPrice,
        previousSellingPrice: version.previousSellingPrice,
        changeSummary: version.changeSummary,
      },
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

// DELETE /api/bookings - Delete booking (staff with bookings edit); requires companyId
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    const tenant = await requireTenantContext(searchParams.get("companyId"), {
      module: "bookings",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const tenantId = tenant.ctx.companyId;

    const bid = parseInt(bookingId, 10);
    const { deleteComponentsForBooking } = await import("@/lib/booking-components");
    const { deleteVersionsForBooking } = await import("@/lib/booking-service");
    await deleteComponentsForBooking(bid, tenantId);
    await deleteVersionsForBooking(bid);

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
