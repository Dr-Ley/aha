import { usdToWholeInCurrency, type CurrencyCode } from "@/lib/data";
import { parkSeasonForDate } from "@/lib/enchoro-rates-2026";
import { quoteBookingComponents, type PricingComponentInput } from "@/lib/pricing";
import { PricingService } from "@/lib/pricing-service";
import type {
  CatalogParkFee,
  ItineraryComponentDraft,
  ItineraryPlan,
  ItineraryQuoteSnapshot,
  ItineraryRequirements,
  TourismCatalog,
} from "@/server/services/itinerary/types";
import { childBand } from "@/server/services/itinerary/validation";

function usd(amount: number, currency: CurrencyCode): number {
  return usdToWholeInCurrency(Math.max(0, Math.round(Number(amount) || 0)), currency);
}

function partyRates(requirements: ItineraryRequirements): { adults: number; children: number; infants: number } {
  const ages = requirements.childAges;
  let extraAdults = 0;
  let children = 0;
  let infantFromAges = 0;
  for (const age of ages) {
    const band = childBand(age);
    if (band === "adult") extraAdults += 1;
    else if (band === "child") children += 1;
    else infantFromAges += 1;
  }
  if (ages.length === 0) {
    return {
      adults: requirements.adults,
      children: requirements.children,
      infants: requirements.infants,
    };
  }
  return {
    adults: requirements.adults + extraAdults,
    children,
    infants: requirements.infants + infantFromAges,
  };
}

function nightsByAccommodation(plan: ItineraryPlan): Map<number, number> {
  const nights = new Map<number, number>();
  const lastDay = plan.days.length;
  for (const day of plan.days) {
    if (day.day >= lastDay) continue;
    if (day.accommodationId == null) continue;
    nights.set(day.accommodationId, (nights.get(day.accommodationId) ?? 0) + 1);
  }
  return nights;
}

function daysByDestination(plan: ItineraryPlan): Map<number, number> {
  const counts = new Map<number, number>();
  for (const day of plan.days) {
    counts.set(day.destinationId, (counts.get(day.destinationId) ?? 0) + 1);
  }
  return counts;
}

function ymdForPlanDay(startDate: string | null | undefined, day: number): string | null {
  if (!startDate) return null;
  const d = new Date(`${startDate}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + Math.max(0, day - 1));
  return d.toISOString().slice(0, 10);
}

function parkRateUsd(fee: CatalogParkFee, ymd: string | null): { adult: number; child: number; infant: number } {
  const season = ymd ? parkSeasonForDate(ymd) : "high";
  const low = season === "low";
  return {
    adult: low && fee.adultUsdLow != null ? fee.adultUsdLow : fee.adultUsd,
    child: low && fee.childUsdLow != null ? fee.childUsdLow : fee.childUsd,
    infant: fee.infantUsd,
  };
}

/**
 * Deterministic Enzi pricing: catalog USD rates → customer currency → component stack → markup → round up.
 * The AI never supplies amounts.
 */
export function quoteItineraryPlan(input: {
  plan: ItineraryPlan;
  catalog: TourismCatalog;
  requirements: ItineraryRequirements;
  markupPercent: number;
  currency: CurrencyCode;
}): ItineraryQuoteSnapshot {
  const { plan, catalog, requirements, markupPercent, currency } = input;
  const party = partyRates(requirements);
  const drafts: PricingComponentInput[] = [];
  let sequence = 0;

  const nights = nightsByAccommodation(plan);
  for (const [accommodationId, nightCount] of nights) {
    const acc = catalog.accommodations.find((row) => row.id === accommodationId);
    if (!acc || nightCount < 1) continue;
    const childUnit = Math.round(acc.priceFromUsd * 0.75);
    const amountUsd =
      nightCount * (party.adults * acc.priceFromUsd + party.children * childUnit);
    const cost = usd(amountUsd, currency);
    if (!cost) continue;
    drafts.push({
      type: "accommodation",
      cost,
      sequence: sequence++,
      label: `${acc.name} × ${nightCount} night${nightCount === 1 ? "" : "s"}`,
      config: {
        label: acc.name,
        accommodation_id: acc.id,
        nights: nightCount,
        source: "enzi_catalog",
      },
    });
  }

  const destDays = daysByDestination(plan);
  for (const [destinationId, dayCount] of destDays) {
    const fee = catalog.parkFees.find((row) => row.destinationId === destinationId);
    if (!fee || dayCount < 1) continue;
    const days = plan.days.filter((day) => day.destinationId === destinationId);
    let amountUsd = 0;
    for (const day of days) {
      const rates = parkRateUsd(fee, ymdForPlanDay(requirements.startDate, day.day));
      amountUsd += party.adults * rates.adult + party.children * rates.child + party.infants * rates.infant;
    }
    const cost = usd(amountUsd, currency);
    if (!cost) continue;
    drafts.push({
      type: "park_fee",
      cost,
      sequence: sequence++,
      label: `${fee.name} × ${dayCount} day${dayCount === 1 ? "" : "s"}`,
      config: {
        label: fee.name,
        park_fee_id: fee.id,
        destination_id: destinationId,
        days: dayCount,
        source: "enzi_catalog",
      },
    });
  }

  const transportIds = [...new Set(plan.days.map((day) => day.transportId).filter((id): id is number => id != null))];
  for (const transportId of transportIds) {
    const option = catalog.transport.find((row) => row.id === transportId);
    if (!option) continue;
    const amountUsd = option.dailyRateUsd * plan.durationDays;
    const cost = usd(amountUsd, currency);
    if (!cost) continue;
    drafts.push({
      type: "transport",
      cost,
      sequence: sequence++,
      label: `${option.name} × ${plan.durationDays} day${plan.durationDays === 1 ? "" : "s"}`,
      config: {
        label: option.name,
        transport_id: option.id,
        days: plan.durationDays,
        source: "enzi_catalog",
      },
    });
  }

  const transferIds = [...new Set(plan.days.map((day) => day.transferId).filter((id): id is number => id != null))];
  for (const transferId of transferIds) {
    const option = catalog.transfers.find((row) => row.id === transferId);
    if (!option) continue;
    const cost = usd(option.amountUsd, currency);
    if (!cost) continue;
    drafts.push({
      type: "transfer",
      cost,
      sequence: sequence++,
      label: option.name,
      config: {
        label: option.name,
        transfer_id: option.id,
        source: "enzi_catalog",
      },
    });
  }

  const activityCounts = new Map<number, number>();
  for (const day of plan.days) {
    for (const activityId of day.activityIds) {
      activityCounts.set(activityId, (activityCounts.get(activityId) ?? 0) + 1);
    }
  }
  for (const [activityId, count] of activityCounts) {
    const activity = catalog.activities.find((row) => row.id === activityId);
    if (!activity) continue;
    const amountUsd =
      count * (party.adults * activity.adultUsd + party.children * activity.childUsd);
    const cost = usd(amountUsd, currency);
    if (!cost) continue;
    drafts.push({
      type: "activity",
      cost,
      sequence: sequence++,
      label: activity.name,
      config: {
        label: activity.name,
        activity_id: activity.id,
        occurrences: count,
        source: "enzi_catalog",
      },
    });
  }

  const quote = PricingService.quoteComponents({
    components: drafts,
    currency,
    markupPercent,
    travellerCounts: {
      adults: requirements.adults,
      children: requirements.children,
      infants: requirements.infants,
    },
  });

  const components: ItineraryComponentDraft[] = quote.components.map((row) => ({
    type: row.type,
    cost: row.cost,
    sequence: row.sequence,
    label: row.label ?? String(row.config.label ?? row.type),
    config: row.config,
  }));

  return {
    currency: quote.currency,
    costTotal: quote.costTotal,
    markupPercent: quote.markupPercent,
    markupAmount: quote.markupAmount,
    baseSellingPrice: quote.baseSellingPrice,
    sellingPrice: quote.sellingPrice,
    roundedUpBy: quote.roundedUpBy,
    travellerCounts: quote.travellerCounts,
    components,
  };
}

export { quoteBookingComponents };
