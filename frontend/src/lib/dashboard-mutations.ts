/** Allowed booking fields for staff PATCH (avoid arbitrary column writes). */
export const BOOKING_PATCH_KEYS = [
  "status",
  "paymentStatus",
  "firstName",
  "lastName",
  "email",
  "phone",
  "country",
  "safariPackage",
  "tripCountry",
  "travelDate",
  "startDate",
  "endDate",
  "guests",
  "adults",
  "children",
  "infants",
  "totalPrice",
  "pricePerPerson",
  "originalAmount",
  "originalCurrency",
  "exchangeRateToKes",
  "exchangeRateDate",
  "pricingSource",
  "costStack",
  "bookingKind",
  "accommodation",
  "transport",
  "specialRequests",
  "voucherToCompany",
  "tourId",
] as const;

export type BookingPatchKey = (typeof BOOKING_PATCH_KEYS)[number];

export function pickBookingPatch(body: Record<string, unknown>): Partial<Record<BookingPatchKey, unknown>> {
  const out: Partial<Record<BookingPatchKey, unknown>> = {};
  for (const key of BOOKING_PATCH_KEYS) {
    if (key in body && body[key] !== undefined) {
      out[key] = body[key];
    }
  }
  return out;
}
