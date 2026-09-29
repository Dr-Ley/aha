import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attractions, destinations, guides, vehicleProviders, vehicles } from "@/lib/schema";
import { ensureSprint6Schema } from "@/server/database/ensure-sprint6";
import {
  migrateCatalogAccommodations,
  seedTenantOwnedProperties,
} from "./accommodation/migrate-catalog";
import { TOURISM_ATTRACTIONS, TOURISM_DESTINATIONS } from "./destinations-data";
import { AHA_GUIDES } from "./guides-data";
import { AHA_OWNED_VEHICLES, SAMPLE_VEHICLE_PROVIDER } from "./vehicles-data";

export async function seedDestinationsAndAttractions(): Promise<void> {
  for (const dest of TOURISM_DESTINATIONS) {
    const existing = await db
      .select({ id: destinations.id })
      .from(destinations)
      .where(eq(destinations.slug, dest.slug))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(destinations).values(dest);
      console.log(`Created destination: ${dest.name}`);
    } else {
      console.log(`Destination exists: ${dest.name}`);
    }
  }

  const destRows = await db
    .select({ id: destinations.id, slug: destinations.slug })
    .from(destinations);
  const destIdBySlug = new Map(destRows.map((d) => [d.slug, d.id]));

  for (const attr of TOURISM_ATTRACTIONS) {
    const destinationId = destIdBySlug.get(attr.destinationSlug);
    if (!destinationId) {
      console.log(`Skipping attraction ${attr.name}: missing destination ${attr.destinationSlug}`);
      continue;
    }
    const existing = await db
      .select({ id: attractions.id })
      .from(attractions)
      .where(and(eq(attractions.destinationId, destinationId), eq(attractions.name, attr.name)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(attractions).values({
        destinationId,
        name: attr.name,
        type: attr.type,
        duration: attr.duration,
        bestTime: attr.bestTime,
        description: attr.description,
      });
      console.log(`Created attraction: ${attr.name}`);
    } else {
      console.log(`Attraction exists: ${attr.name}`);
    }
  }
}

export async function seedVehiclesAndGuides(): Promise<void> {
  const existingProvider = await db
    .select({ id: vehicleProviders.id })
    .from(vehicleProviders)
    .where(eq(vehicleProviders.name, SAMPLE_VEHICLE_PROVIDER.name))
    .limit(1);
  if (existingProvider.length === 0) {
    await db.insert(vehicleProviders).values(SAMPLE_VEHICLE_PROVIDER);
    console.log(`Created vehicle provider: ${SAMPLE_VEHICLE_PROVIDER.name}`);
  }

  for (const vehicle of AHA_OWNED_VEHICLES) {
    const existing = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(
        and(eq(vehicles.companyId, vehicle.companyId), eq(vehicles.registration, vehicle.registration))
      )
      .limit(1);
    if (existing.length === 0) {
      await db.insert(vehicles).values(vehicle);
      console.log(`Created vehicle: ${vehicle.registration}`);
    } else {
      console.log(`Vehicle exists: ${vehicle.registration}`);
    }
  }

  for (const guide of AHA_GUIDES) {
    const existing = await db
      .select({ id: guides.id })
      .from(guides)
      .where(and(eq(guides.companyId, guide.companyId), eq(guides.name, guide.name)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(guides).values(guide);
      console.log(`Created guide: ${guide.name}`);
    } else {
      console.log(`Guide exists: ${guide.name}`);
    }
  }
}

export async function seedTourismEngine(): Promise<void> {
  console.log("Seeding tourism engine (Sprint 6)...");
  await ensureSprint6Schema();
  await seedDestinationsAndAttractions();
  await seedTenantOwnedProperties();
  await migrateCatalogAccommodations();
  await seedVehiclesAndGuides();
  const { seedItineraryCatalog } = await import("./seed-itinerary-catalog");
  await seedItineraryCatalog();
}
