import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attractions, destinations, guides, properties, accommodationProviders, vehicles } from "@/lib/schema";
import { ensureSprint6Schema } from "@/server/database/ensure-sprint6";
import type { CompanyId } from "@/types/company";

export async function listDestinations(country?: string) {
  await ensureSprint6Schema();
  if (country) {
    return db.select().from(destinations).where(eq(destinations.country, country));
  }
  return db.select().from(destinations);
}

export async function listAttractionsForDestination(destinationId: number) {
  await ensureSprint6Schema();
  return db.select().from(attractions).where(eq(attractions.destinationId, destinationId));
}

/** Tenant-scoped vehicle list. Never returns another company's fleet. */
export async function listVehiclesForCompany(companyId: CompanyId) {
  await ensureSprint6Schema();
  return db.select().from(vehicles).where(eq(vehicles.companyId, companyId));
}

export async function listGuidesForCompany(companyId: CompanyId, status: "active" | "inactive" = "active") {
  await ensureSprint6Schema();
  return db
    .select()
    .from(guides)
    .where(and(eq(guides.companyId, companyId), eq(guides.status, status)));
}

/** Company-owned property for hotel inventory (EWC/BTH). */
export async function getCompanyPropertyId(companyId: CompanyId): Promise<number | null> {
  await ensureSprint6Schema();
  const [row] = await db
    .select({ id: properties.id })
    .from(properties)
    .innerJoin(
      accommodationProviders,
      eq(properties.providerId, accommodationProviders.id)
    )
    .where(
      and(
        eq(properties.companyId, companyId),
        eq(accommodationProviders.type, "tenant")
      )
    )
    .limit(1);
  return row?.id ?? null;
}
