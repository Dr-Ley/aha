import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  accommodations,
  activityOfferings,
  attractions,
  destinations,
  parkFeeRates,
  transferOptions,
  transportOptions,
} from "@/lib/schema";
import { ensureSprint7Schema } from "@/server/database/ensure-sprint7";
import type {
  AccommodationCategory,
  ItineraryRequirements,
  TourismCatalog,
} from "@/server/services/itinerary/types";

function inferCategory(type: string, badges: string[] | null | undefined): AccommodationCategory {
  const hay = `${type} ${(badges ?? []).join(" ")}`.toLowerCase();
  if (hay.includes("budget")) return "budget";
  if (hay.includes("luxury") || hay.includes("premium")) return "luxury";
  return "mid-range";
}

function catalogForPrompt(catalog: TourismCatalog): Record<string, unknown> {
  return {
    destinations: catalog.destinations.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      country: row.country,
      region: row.region,
    })),
    attractions: catalog.attractions.map((row) => ({
      id: row.id,
      destination_id: row.destinationId,
      name: row.name,
      type: row.type,
    })),
    accommodations: catalog.accommodations.map((row) => ({
      id: row.id,
      destination_id: row.destinationId,
      name: row.name,
      type: row.type,
      category: row.category,
    })),
    activities: catalog.activities.map((row) => ({
      id: row.id,
      destination_id: row.destinationId,
      attraction_id: row.attractionId,
      name: row.name,
    })),
    park_fees: catalog.parkFees.map((row) => ({
      id: row.id,
      destination_id: row.destinationId,
      name: row.name,
    })),
    transfers: catalog.transfers.map((row) => ({
      id: row.id,
      name: row.name,
      from: row.fromLabel,
      to: row.toLabel,
      destination_id: row.destinationId,
    })),
    transport: catalog.transport.map((row) => ({
      id: row.id,
      name: row.name,
      vehicle_type: row.vehicleType,
      capacity: row.capacity,
    })),
  };
}

/**
 * Retrieves only tourism records relevant to the request.
 * Prices stay on the full catalog object for Enzi pricing; the AI prompt catalog omits amounts.
 */
export async function retrieveTourismCatalog(
  companyId: string,
  requirements: Pick<ItineraryRequirements, "destinationIds" | "country" | "activityIds" | "attractionIds">
): Promise<TourismCatalog> {
  await ensureSprint7Schema();

  let destRows = await db.select().from(destinations);
  if (requirements.country) {
    destRows = destRows.filter((row) => row.country.toLowerCase() === requirements.country!.toLowerCase());
  }
  if (requirements.destinationIds.length > 0) {
    const wanted = new Set(requirements.destinationIds);
    const matched = destRows.filter((row) => wanted.has(row.id));
    if (matched.length > 0) destRows = matched;
  }

  const destIds = destRows.map((row) => row.id);
  const attractionRows =
    destIds.length === 0
      ? []
      : await db.select().from(attractions).where(inArray(attractions.destinationId, destIds));

  const accommodationRows =
    destIds.length === 0
      ? []
      : await db
          .select()
          .from(accommodations)
          .where(
            and(
              eq(accommodations.companyId, companyId),
              or(inArray(accommodations.destinationId, destIds), isNull(accommodations.destinationId))
            )
          );

  const parkRows =
    destIds.length === 0
      ? []
      : await db
          .select()
          .from(parkFeeRates)
          .where(and(eq(parkFeeRates.companyId, companyId), inArray(parkFeeRates.destinationId, destIds)));

  let activityRows =
    destIds.length === 0
      ? []
      : await db
          .select()
          .from(activityOfferings)
          .where(
            and(eq(activityOfferings.companyId, companyId), inArray(activityOfferings.destinationId, destIds))
          );
  if (requirements.activityIds.length > 0) {
    const wanted = new Set(requirements.activityIds);
    const preferred = activityRows.filter((row) => wanted.has(row.id));
    if (preferred.length > 0) {
      const rest = activityRows.filter((row) => !wanted.has(row.id));
      activityRows = [...preferred, ...rest];
    }
  }

  const transferRows = await db
    .select()
    .from(transferOptions)
    .where(eq(transferOptions.companyId, companyId));
  const transportRows = await db
    .select()
    .from(transportOptions)
    .where(eq(transportOptions.companyId, companyId));

  return {
    destinations: destRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      country: row.country,
      region: row.region,
      description: row.description,
    })),
    attractions: attractionRows.map((row) => ({
      id: row.id,
      destinationId: row.destinationId,
      name: row.name,
      type: row.type,
      duration: row.duration,
    })),
    accommodations: accommodationRows.map((row) => ({
      id: row.id,
      destinationId: row.destinationId,
      name: row.name,
      slug: row.slug,
      type: row.type,
      category: inferCategory(row.type, row.badges),
      priceFromUsd: row.priceFrom,
      location: row.location,
    })),
    parkFees: parkRows.map((row) => ({
      id: row.id,
      destinationId: row.destinationId,
      name: row.name,
      adultUsd: row.adultUsd,
      childUsd: row.childUsd,
      infantUsd: row.infantUsd,
      adultUsdLow: row.adultUsdLow,
      childUsdLow: row.childUsdLow,
      adultKes: row.adultKes,
      childKes: row.childKes,
    })),
    activities: activityRows.map((row) => ({
      id: row.id,
      destinationId: row.destinationId,
      attractionId: row.attractionId,
      name: row.name,
      adultUsd: row.adultUsd,
      childUsd: row.childUsd,
    })),
    transfers: transferRows.map((row) => ({
      id: row.id,
      name: row.name,
      fromLabel: row.fromLabel,
      toLabel: row.toLabel,
      destinationId: row.destinationId,
      amountUsd: row.amountUsd,
    })),
    transport: transportRows.map((row) => ({
      id: row.id,
      name: row.name,
      vehicleType: row.vehicleType,
      dailyRateUsd: row.dailyRateUsd,
      capacity: row.capacity,
    })),
  };
}

export { catalogForPrompt };
