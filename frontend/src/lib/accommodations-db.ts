import { db } from "@/lib/db";
import { accommodations } from "@/lib/schema";
import type { Accomodations } from "@/lib/data";
import { eq } from "drizzle-orm";
import { ensureCatalogCompanyColumns } from "@/lib/catalog-company";
import type { CompanyId } from "@/types/company";

type DbAccommodation = typeof accommodations.$inferSelect;

/** Normalize legacy single-string image values to the string[] shape the frontend expects. */
function normalizeImageArray(image: string[] | string | null | undefined): string[] {
  if (Array.isArray(image)) return image;
  if (typeof image === "string" && image.trim()) return [image];
  return [];
}

export function mapDbAccommodationToAccommodation(row: DbAccommodation): Accomodations {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    country: row.country as Accomodations["country"],
    image: normalizeImageArray(row.image),
    description: row.description,
    amenities: row.amenities,
    priceFrom: row.priceFrom,
    badges: row.badges,
    recommended: row.recommended ?? undefined,
    type: row.type as Accomodations["type"],
    likes: row.likes ?? 0,
  };
}

export async function getAccommodationsFromDb(companyId: CompanyId): Promise<Accomodations[]> {
  await ensureCatalogCompanyColumns();
  const rows = await db.select().from(accommodations).where(eq(accommodations.companyId, companyId));
  return rows.map(mapDbAccommodationToAccommodation);
}
