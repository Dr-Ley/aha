import { db } from "@/lib/db";
import { bookings } from "@/lib/schema";
import {
  ensureBookingComponentTables,
  replaceBookingComponents,
  storedCostStackFromComponents,
  type BookingComponentDraft,
} from "@/lib/booking-components";
import { ensureInitialBookingVersion } from "@/lib/booking-service";
import { findOrCreateCustomerFromGuest } from "@/lib/customers";
import { maybeSendBookingConfirmation } from "@/lib/email/booking-confirmation";
import { createNotification } from "@/lib/notify";
import { quoteBookingComponents } from "@/lib/pricing";
import type { CompanyId } from "@/types/company";
import {
  accountingFromItinerary,
  asPlan,
  requirementsFromRow,
  setItineraryStatus,
  todayYmd,
  type ItineraryRow,
} from "@/server/services/itinerary/itinerary-service";
import { itineraries, itineraryComponents } from "@/lib/schema";
import { eq } from "drizzle-orm";

function splitGuestName(name: string | null): { firstName: string; lastName: string | null } {
  const trimmed = name?.trim() || "Guest";
  const parts = trimmed.split(/\s+/);
  return { firstName: parts[0] || "Guest", lastName: parts.slice(1).join(" ") || null };
}

/**
 * Convert an accepted/approved itinerary into a safari booking.
 * Reuses booking components, versioning, customer matching, and BookingCreated email.
 */
export async function convertItineraryToBooking(input: {
  row: ItineraryRow;
  staffUserId: number;
}): Promise<{ bookingId: number; itinerary: ItineraryRow }> {
  if (input.row.bookingId) {
    const error = new Error("Itinerary already converted to a booking");
    (error as Error & { status: number }).status = 409;
    throw error;
  }
  if (input.row.status !== "accepted" && input.row.status !== "approved") {
    const error = new Error("Staff can convert only accepted or approved itineraries");
    (error as Error & { status: number }).status = 409;
    throw error;
  }

  const email = input.row.guestEmail?.trim();
  if (!email) {
    const error = new Error("Guest email is required to convert this itinerary");
    (error as Error & { status: number }).status = 422;
    throw error;
  }

  await ensureBookingComponentTables();
  const requirements = requirementsFromRow(input.row);
  const plan = asPlan(input.row.plan);
  const { firstName, lastName } = splitGuestName(input.row.guestName);
  const customerId = await findOrCreateCustomerFromGuest(
    input.row.companyId as CompanyId,
    {
      firstName,
      lastName,
      email,
      phone: input.row.guestPhone,
      country: input.row.country,
    },
    input.row.userId
  );

  const accounting = accountingFromItinerary(input.row);
  const componentRows = await db
    .select()
    .from(itineraryComponents)
    .where(eq(itineraryComponents.itineraryId, input.row.id));
  const drafts: BookingComponentDraft[] = componentRows.map((row) => ({
    type: row.type,
    cost: row.cost,
    sequence: row.sequence,
    config: row.config ?? {},
    label: typeof row.config?.label === "string" ? row.config.label : row.type,
  }));
  const quote = quoteBookingComponents({
    components: drafts,
    currency: accounting.originalCurrency,
    markupPercent: 0,
  });
  const storedCostStack = storedCostStackFromComponents(drafts, {
    ...quote,
    markupPercent: input.row.markupPercent ?? quote.markupPercent,
    markupAmount: 0,
    baseSellingPrice: quote.costTotal,
    sellingPrice: accounting.originalAmount,
    roundedUpBy: 0,
  });

  const travelDate = input.row.startDate || todayYmd();
  const guests = input.row.adults + input.row.children + input.row.infants;
  const safariPackage = plan?.title || input.row.title || "Custom safari itinerary";
  const tripCountry =
    input.row.country === "Tanzania" || input.row.country === "Kenya" ? input.row.country : "Kenya";

  const [booking] = await db
    .insert(bookings)
    .values({
      companyId: input.row.companyId,
      userId: input.row.userId,
      customerId,
      tourId: null,
      status: "pending",
      travelDate,
      guests: Math.max(1, guests),
      adults: input.row.adults,
      children: input.row.children,
      infants: input.row.infants,
      accommodation: requirements.accommodationCategory ?? "mid-range",
      transport: requirements.preferredTransport ?? "4x4-landcruiser",
      specialRequests: requirements.notes,
      safariPackage,
      tripCountry,
      startDate: input.row.startDate,
      endDate: input.row.endDate,
      paymentStatus: "unpaid",
      firstName,
      lastName,
      email,
      phone: input.row.guestPhone,
      country: input.row.country,
      totalPrice: accounting.totalPriceKes,
      pricePerPerson: guests > 0 ? Math.round(accounting.totalPriceKes / guests) : accounting.totalPriceKes,
      originalAmount: accounting.originalAmount,
      originalCurrency: accounting.originalCurrency,
      exchangeRateToKes: accounting.rateToKes,
      exchangeRateDate: todayYmd(),
      pricingSource: "cost_stack",
      costStack: storedCostStack,
      bookingKind: "customized_safari",
    })
    .returning();

  await replaceBookingComponents(booking.id, drafts);
  await ensureInitialBookingVersion(booking, input.staffUserId);

  await db
    .update(itineraries)
    .set({ bookingId: booking.id, updatedAt: new Date() })
    .where(eq(itineraries.id, input.row.id));

  const itinerary = await setItineraryStatus({
    row: { ...input.row, bookingId: booking.id },
    status: "converted",
    changeSummary: `Converted to booking #${booking.id}`,
    changedByUserId: input.staffUserId,
  });

  await createNotification({
    companyId: input.row.companyId,
    type: "booking",
    action: "created",
    referenceId: booking.id,
    title: `Safari booking #${booking.id} created from itinerary #${input.row.id}`,
    metadata: { email, itineraryId: input.row.id, safariPackage },
  });

  void maybeSendBookingConfirmation(booking);

  return { bookingId: booking.id, itinerary };
}
