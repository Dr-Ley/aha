import type { CurrencyCode } from "@/lib/data";
import { quoteItineraryPlan } from "@/server/services/itinerary/pricing";
import type {
  ItineraryPlan,
  ItineraryQuoteSnapshot,
  ItineraryRequirements,
  TourismCatalog,
} from "@/server/services/itinerary/types";

export type PriceConfirmation = "confirmed" | "quote_required";

export type AssessedItineraryQuote = ItineraryQuoteSnapshot & {
  pricingStatus: PriceConfirmation;
  confirmationReasons: string[];
};

/**
 * Wraps the existing Enzi quote. The LLM never supplies amounts.
 * Catalog rows have no validity dates and no confirmed selling flag,
 * so the default status is quote_required even when a number can be calculated.
 */
export function assessItineraryQuote(input: {
  plan: ItineraryPlan;
  catalog: TourismCatalog;
  requirements: ItineraryRequirements;
  markupPercent: number;
  currency: CurrencyCode;
}): AssessedItineraryQuote {
  const quote = quoteItineraryPlan(input);
  const reasons: string[] = [];

  if (!input.requirements.startDate) {
    reasons.push("No travel date, so no rate window can be checked.");
  }
  reasons.push("Accommodation, park fee, activity, transfer, and vehicle rows have no valid_from, valid_to, or confirmed selling flag.");
  reasons.push("Child accommodation uses a fixed 75% of the adult catalog figure. That rule is not a stored child rate.");
  if (input.requirements.children > 0 && input.requirements.childAges.length === 0) {
    reasons.push("Child ages are missing, so the child band cannot be checked against a property policy.");
  }
  const missingLodge = input.plan.days.some((day, index) => index < input.plan.days.length - 1 && day.accommodationId == null);
  if (missingLodge) {
    reasons.push("At least one overnight has no accommodation record.");
  }
  const pricedTransferDays = input.plan.days.filter((day) => day.transferId == null).length;
  if (pricedTransferDays > 0 && input.plan.destinationIds.length > 1) {
    reasons.push("One or more route changes have no transfer price.");
  }

  return {
    ...quote,
    pricingStatus: "quote_required",
    confirmationReasons: reasons,
  };
}
