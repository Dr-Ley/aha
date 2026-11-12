import {
  ACCOMMODATION_CONTRACTS,
  contractSeasonCovering,
  matchAccommodationContract,
  type AccommodationContract,
} from "@/features/tourism/accommodation-contracts";
import type {
  CatalogAccommodation,
  CatalogDestination,
  CatalogTransfer,
  ItineraryDayPlan,
  ItineraryPlan,
  ItineraryRequirements,
  TourismCatalog,
} from "@/server/services/itinerary/types";
import { shortestRoute } from "@/server/services/itinerary/planner/route-graph";

export type PlannerIssue = {
  code: string;
  message: string;
};

export type PlanItineraryResult =
  | { ok: true; plan: ItineraryPlan; warnings: PlannerIssue[] }
  | { ok: false; issues: PlannerIssue[] };

function issue(code: string, message: string): PlannerIssue {
  return { code, message };
}

function seats(requirements: ItineraryRequirements): number {
  return requirements.adults + requirements.children;
}

function labelMatches(label: string, destination: CatalogDestination): boolean {
  const hay = label.toLowerCase();
  const name = destination.name.toLowerCase();
  const slug = destination.slug.replace(/-/g, " ");
  return hay.includes(name) || hay.includes(slug);
}

function arrivalTransfer(catalog: TourismCatalog, destination: CatalogDestination): CatalogTransfer | null {
  return (
    catalog.transfers.find(
      (row) => /jkia|airport/i.test(row.fromLabel) && labelMatches(row.toLabel, destination)
    ) ?? null
  );
}

function roadTransfer(
  catalog: TourismCatalog,
  from: CatalogDestination,
  to: CatalogDestination
): CatalogTransfer | null {
  return (
    catalog.transfers.find((row) => labelMatches(row.fromLabel, from) && labelMatches(row.toLabel, to)) ?? null
  );
}

function partyFits(accommodation: CatalogAccommodation, destination: CatalogDestination, requirements: ItineraryRequirements, contracts: AccommodationContract[]): boolean {
  const contract = matchAccommodationContract(accommodation.name, destination.slug, contracts);
  if (!contract?.maxOccupancy) return true;
  return seats(requirements) + requirements.infants <= contract.maxOccupancy;
}

function pickAccommodation(
  catalog: TourismCatalog,
  destination: CatalogDestination,
  requirements: ItineraryRequirements,
  contracts: AccommodationContract[],
  warnings: PlannerIssue[]
): CatalogAccommodation | null {
  const atDest = catalog.accommodations.filter((row) => row.destinationId === destination.id);
  const fitting = atDest.filter((row) => partyFits(row, destination, requirements, contracts));
  if (atDest.length > 0 && fitting.length === 0) {
    warnings.push(
      issue(
        "occupancy",
        `No ${destination.name} lodge in the catalog fits ${seats(requirements)} guests. The stay is unassigned.`
      )
    );
    return null;
  }
  const category = requirements.accommodationCategory;
  const preferred = category ? fitting.filter((row) => row.category === category) : fitting;
  const pool = preferred.length > 0 ? preferred : fitting;
  if (category && preferred.length === 0 && fitting.length > 0) {
    warnings.push(
      issue(
        "accommodation_preference",
        `No ${category} lodge at ${destination.name}. A catalog lodge of another category was used.`
      )
    );
  }
  return pool.slice().sort((a, b) => a.priceFromUsd - b.priceFromUsd)[0] ?? null;
}

function activitiesForDay(
  catalog: TourismCatalog,
  destinationId: number,
  requirements: ItineraryRequirements,
  usedPaid: Set<number>
): number[] {
  const atDest = catalog.activities.filter((row) => row.destinationId === destinationId);
  const requested = atDest.filter((row) => requirements.activityIds.includes(row.id) && !usedPaid.has(row.id));
  if (requested.length > 0) {
    const pick = requested.slice(0, 3);
    for (const row of pick) {
      if (row.adultUsd > 0) usedPaid.add(row.id);
    }
    return pick.map((row) => row.id);
  }
  const included = atDest.find((row) => row.adultUsd === 0 && /game drive|drive/i.test(row.name));
  return included ? [included.id] : [];
}

function addDays(ymd: string, days: number): string {
  const date = new Date(`${ymd}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Deterministic skeleton. Selects only catalog IDs.
 * Refuses disconnected destinations, missing destinations, and undersized vehicles.
 * Does not invent prices. Unpriced supported roads become warnings.
 */
export function planItinerary(input: {
  requirements: ItineraryRequirements;
  catalog: TourismCatalog;
  routeNodes?: CatalogDestination[];
  contracts?: AccommodationContract[];
}): PlanItineraryResult {
  const { requirements, catalog } = input;
  const contracts = input.contracts ?? ACCOMMODATION_CONTRACTS;
  const issues: PlannerIssue[] = [];
  const warnings: PlannerIssue[] = [];

  if (requirements.adults + requirements.children + requirements.infants < 1) {
    issues.push(issue("travellers", "At least one traveller is required."));
  }
  if (requirements.durationDays < 1 || requirements.durationDays > 30) {
    issues.push(issue("duration", "Trip duration must be between 1 and 30 days."));
  }
  if (requirements.destinationIds.length === 0) {
    issues.push(issue("destinations", "Choose at least one destination. The planner will not guess a park."));
  }

  const byId = new Map<number, CatalogDestination>();
  for (const row of input.routeNodes ?? catalog.destinations) byId.set(row.id, row);
  for (const row of catalog.destinations) byId.set(row.id, row);

  const requested: CatalogDestination[] = [];
  for (const id of requirements.destinationIds) {
    const row = byId.get(id);
    if (!row) {
      issues.push(issue("unknown_destination", `Destination ${id} is not in the catalog.`));
      continue;
    }
    requested.push(row);
  }
  if (issues.length > 0) return { ok: false, issues };

  const allowed = new Set([...byId.values()].map((row) => row.slug));
  const expanded: CatalogDestination[] = [];
  if (requested.length > 0) {
    expanded.push(requested[0]!);
    for (let i = 1; i < requested.length; i += 1) {
      const previous = expanded[expanded.length - 1]!;
      const next = requested[i]!;
      const path = shortestRoute(previous.slug, next.slug, allowed);
      if (!path) {
        return {
          ok: false,
          issues: [
            issue(
              "unsupported_route",
              `No supported route from ${previous.name} to ${next.name}. Add a connection in the route graph or choose parks that connect through Nairobi.`
            ),
          ],
        };
      }
      for (const slug of path.slice(1)) {
        const node = [...byId.values()].find((row) => row.slug === slug);
        if (!node) {
          return {
            ok: false,
            issues: [
              issue(
                "unsupported_route",
                `The route from ${previous.name} to ${next.name} needs ${slug}, which is not in the destination catalog.`
              ),
            ],
          };
        }
        expanded.push(node);
      }
    }
  }

  const stops: CatalogDestination[] = [];
  for (const stop of expanded) {
    if (stops[stops.length - 1]?.id !== stop.id) stops.push(stop);
  }
  if (stops.length > requirements.durationDays) {
    return {
      ok: false,
      issues: [
        issue(
          "duration",
          `A connected route visits ${stops.map((stop) => stop.name).join(" → ")} and needs at least ${stops.length} days. The request is ${requirements.durationDays} days.`
        ),
      ],
    };
  }

  const fleet = catalog.transport.filter((row) => row.capacity >= seats(requirements));
  if (fleet.length === 0) {
    const largest = catalog.transport.slice().sort((a, b) => b.capacity - a.capacity)[0];
    return {
      ok: false,
      issues: [
        issue(
          "transport_capacity",
          largest
            ? `No vehicle seats ${seats(requirements)} guests. Largest catalog vehicle is ${largest.name} (${largest.capacity}).`
            : "No transport option is in the catalog."
        ),
      ],
    };
  }
  const hint = requirements.preferredTransport?.toLowerCase() ?? "";
  const transport = fleet.slice().sort((a, b) => {
    const aPref = hint && a.vehicleType.toLowerCase().includes(hint) ? 0 : 1;
    const bPref = hint && b.vehicleType.toLowerCase().includes(hint) ? 0 : 1;
    return aPref - bPref || a.capacity - b.capacity || a.dailyRateUsd - b.dailyRateUsd;
  })[0]!;

  const dayCounts = stops.map(() => 1);
  let extra = requirements.durationDays - stops.length;
  const parkIndexes = stops
    .map((stop, index) => ({ stop, index }))
    .filter((row) => row.stop.slug !== "nairobi")
    .map((row) => row.index);
  const extraTargets = parkIndexes.length > 0 ? parkIndexes : stops.map((_, index) => index);
  let cursor = 0;
  while (extra > 0) {
    dayCounts[extraTargets[cursor % extraTargets.length]!] += 1;
    extra -= 1;
    cursor += 1;
  }

  const requestedIds = new Set(requirements.destinationIds);
  for (const stop of stops) {
    if (!requestedIds.has(stop.id)) {
      warnings.push(
        issue(
          "transit",
          `${stop.name} is inserted as a road connection. It was not a requested stay.`
        )
      );
    }
  }

  const days: ItineraryDayPlan[] = [];
  const usedPaid = new Set<number>();
  let dayNumber = 1;
  for (let stopIndex = 0; stopIndex < stops.length; stopIndex += 1) {
    const stop = stops[stopIndex]!;
    const previous = stopIndex > 0 ? stops[stopIndex - 1]! : null;
    const lodge = pickAccommodation(catalog, stop, requirements, contracts, warnings);
    const nightDate = requirements.startDate ? addDays(requirements.startDate, dayNumber - 1) : null;
    if (lodge) {
      const contract = matchAccommodationContract(lodge.name, stop.slug, contracts);
      const season = contract ? contractSeasonCovering(contract, nightDate) : null;
      if (contract && nightDate && !season) {
        warnings.push(
          issue(
            "rate_validity",
            `${lodge.name} has no contract window covering ${nightDate}. The stay can be planned, and the price stays unconfirmed.`
          )
        );
      }
      if (!contract) {
        warnings.push(
          issue(
            "rate_validity",
            `${lodge.name} has no dated supplier contract linked to it. price_from is not a confirmed selling rate.`
          )
        );
      }
    } else if (catalog.accommodations.every((row) => row.destinationId !== stop.id)) {
      warnings.push(
        issue("missing_accommodation", `No accommodation record is linked to ${stop.name}.`)
      );
    }

    const transfer =
      dayNumber === 1
        ? arrivalTransfer(catalog, stop)
        : previous
          ? roadTransfer(catalog, previous, stop)
          : null;
    if (requirements.airportTransfer && dayNumber === 1 && !transfer) {
      warnings.push(
        issue(
          "transfer",
          `No airport transfer row matches an arrival at ${stop.name}. A Nairobi hotel transfer is not used for another park.`
        )
      );
    }
    if (previous && !transfer) {
      warnings.push(
        issue(
          "transfer",
          `No priced transfer from ${previous.name} to ${stop.name}. The daily vehicle is assigned, and the road price is unconfirmed.`
        )
      );
    }

    const count = dayCounts[stopIndex] ?? 1;
    for (let offset = 0; offset < count; offset += 1) {
      const isArrival = offset === 0;
      days.push({
        day: dayNumber,
        destinationId: stop.id,
        activityIds: activitiesForDay(catalog, stop.id, requirements, usedPaid),
        accommodationId: lodge?.id ?? null,
        transportId: transport.id,
        transferId: isArrival ? transfer?.id ?? null : null,
        notes: isArrival
          ? previous
            ? `Travel from ${previous.name} to ${stop.name}.`
            : `Arrive in ${stop.name}.`
          : `Time in ${stop.name}.`,
      });
      dayNumber += 1;
    }
  }

  const names = requested.map((row) => row.name);
  const title = `${requirements.durationDays}-Day ${names.join(" & ")} Safari`;
  const plan: ItineraryPlan = {
    title,
    summary: `A ${requirements.durationDays}-day safari for ${requirements.adults} adult${requirements.adults === 1 ? "" : "s"}${
      requirements.children ? `, ${requirements.children} child${requirements.children === 1 ? "" : "ren"}` : ""
    }${requirements.infants ? `, ${requirements.infants} infant${requirements.infants === 1 ? "" : "s"}` : ""}, visiting ${names.join(", ")}.`,
    durationDays: requirements.durationDays,
    destinationIds: [...new Set(days.map((day) => day.destinationId))],
    days,
    notes: ["Skeleton built by the Enzi planner from catalog IDs. Prices are calculated separately and are not confirmed selling rates."],
    assumptions: [
      "The last day does not add another accommodation night.",
      "Park fees follow the stored catalog row for each destination day.",
      "Lodge availability is not stored, so no room is treated as held.",
      ...warnings.map((warning) => warning.message),
    ],
    recommendations: ["Confirm lodge availability, child policy, and the selling rate before sending this as a quotation."],
  };

  return { ok: true, plan, warnings };
}
