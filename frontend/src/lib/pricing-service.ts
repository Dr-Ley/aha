/**
 * PricingService (S4.T2). Core calculation is pure — no DB.
 * Company markup is resolved by the caller and passed in.
 */
import type { CurrencyCode } from "@/lib/data";
import type { TravellerCounts } from "@/lib/travellers";
import {
  DEFAULT_COMPANY_MARKUP_PERCENT,
  quoteBookingComponents,
  quoteHotelStay,
  quoteTourSafariPackage,
  type PricingComponentInput,
} from "@/lib/pricing";

export const PricingService = {
  defaultMarkupPercent: DEFAULT_COMPANY_MARKUP_PERCENT,

  quoteComponents(input: {
    components: PricingComponentInput[];
    currency: CurrencyCode;
    travellerCounts?: Partial<TravellerCounts> | null;
    markupPercent?: number | null;
  }) {
    return quoteBookingComponents(input);
  },

  quotePackage: quoteTourSafariPackage,
  quoteHotelStay,
};

export { DEFAULT_COMPANY_MARKUP_PERCENT };
