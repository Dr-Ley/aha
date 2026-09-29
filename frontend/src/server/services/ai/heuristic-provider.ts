import type { AIProvider, AIStructuredRequest, AIStructuredResult } from "@/server/services/ai/provider";
import { planToAiShape } from "@/server/services/itinerary/plan-schema";
import type {
  AccommodationCategory,
  CatalogAccommodation,
  ItineraryDayPlan,
  ItineraryRequirements,
  TourismCatalog,
} from "@/server/services/itinerary/types";

function isRequirements(value: unknown): value is ItineraryRequirements {
  return Boolean(value && typeof value === "object" && "durationDays" in value && "destinationIds" in value);
}

function isCatalog(value: unknown): value is TourismCatalog {
  return Boolean(value && typeof value === "object" && "destinations" in value && "accommodations" in value);
}

function splitDays(duration: number, destinationCount: number): number[] {
  const n = Math.max(1, destinationCount);
  const base = Math.floor(duration / n);
  let remainder = duration - base * n;
  const parts = Array.from({ length: n }, () => Math.max(1, base));
  let total = parts.reduce((sum, x) => sum + x, 0);
  while (total > duration) {
    const idx = parts.findIndex((x) => x > 1);
    if (idx < 0) break;
    parts[idx] -= 1;
    total -= 1;
  }
  let i = 0;
  while (total < duration) {
    parts[i % parts.length] += 1;
    total += 1;
    i += 1;
  }
  void remainder;
  return parts;
}

function pickAccommodation(
  catalog: TourismCatalog,
  destinationId: number,
  category: AccommodationCategory | null | undefined
): CatalogAccommodation | null {
  const atDest = catalog.accommodations.filter(
    (row) => row.destinationId === destinationId || row.destinationId == null
  );
  if (atDest.length === 0) return catalog.accommodations[0] ?? null;
  if (category) {
    const match = atDest.find((row) => row.category === category);
    if (match) return match;
  }
  return atDest[0] ?? null;
}

/**
 * Deterministic catalog sequencer used when no LLM key is configured, and as a test double.
 * Selects only IDs from the supplied catalog. Does not invent prices.
 */
export class HeuristicItineraryProvider implements AIProvider {
  readonly name = "heuristic";
  readonly model = "enzi-heuristic-v1";

  async generateStructured(request: AIStructuredRequest): Promise<AIStructuredResult> {
    const payload = request.userPayload as { requirements?: unknown; catalog?: unknown };
    const requirements = isRequirements(payload.requirements) ? payload.requirements : null;
    const catalog = isCatalog(payload.catalog) ? payload.catalog : null;
    if (!requirements || !catalog) {
      throw new Error("Heuristic provider requires requirements and catalog");
    }

    const destList =
      requirements.destinationIds.length > 0
        ? catalog.destinations.filter((row) => requirements.destinationIds.includes(row.id))
        : catalog.destinations.slice(0, 2);
    const destinations = destList.length > 0 ? destList : catalog.destinations.slice(0, 1);
    if (destinations.length === 0) {
      throw new Error("No destinations available in catalog");
    }

    const parts = splitDays(requirements.durationDays, destinations.length);
    const transport = catalog.transport[0] ?? null;
    const airportTransfer = requirements.airportTransfer ? catalog.transfers[0] ?? null : null;
    const days: ItineraryDayPlan[] = [];
    let dayNumber = 1;
    for (let i = 0; i < destinations.length; i += 1) {
      const dest = destinations[i]!;
      const stay = parts[i] ?? 1;
      const acc = pickAccommodation(catalog, dest.id, requirements.accommodationCategory);
      const activities = catalog.activities.filter((row) => row.destinationId === dest.id);
      for (let d = 0; d < stay; d += 1) {
        const activityPick = activities.length
          ? [activities[d % activities.length]!.id]
          : [];
        days.push({
          day: dayNumber,
          destinationId: dest.id,
          activityIds: activityPick,
          accommodationId: acc?.id ?? null,
          transportId: transport?.id ?? null,
          transferId: dayNumber === 1 ? airportTransfer?.id ?? null : null,
          notes: d === 0 ? `Arrive ${dest.name}` : `Game viewing in ${dest.name}`,
        });
        dayNumber += 1;
      }
    }

    const names = destinations.map((row) => row.name).join(" & ");
    const plan = {
      title: `${requirements.durationDays}-Day ${names} Safari`,
      summary: `A ${requirements.durationDays}-day safari visiting ${names} for ${requirements.adults} adult${requirements.adults === 1 ? "" : "s"}${requirements.children ? ` and ${requirements.children} child${requirements.children === 1 ? "" : "ren"}` : ""}.`,
      durationDays: requirements.durationDays,
      destinationIds: destinations.map((row) => row.id),
      days,
      notes: ["Heuristic plan sequenced from Enzi catalog records."],
      assumptions: ["Park fees apply on each destination day.", "Last day is treated as departure (no extra night)."],
      recommendations: ["Staff should confirm lodge availability before converting to a booking."],
    };

    const parsed = planToAiShape(plan);
    return {
      rawText: JSON.stringify(parsed),
      parsed,
      provider: this.name,
      model: this.model,
      estimatedCostUsd: 0,
    };
  }
}
