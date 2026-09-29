import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { tours } from "@/lib/schema";
import type { Tour } from "@/lib/data";
import { ensureCatalogCompanyColumns } from "@/lib/catalog-company";
import type { CompanyId } from "@/types/company";

type DbTour = typeof tours.$inferSelect;

export function mapDbTourToTour(row: DbTour): Tour {
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    shortTitle: row.shortTitle,
    destination: row.destination,
    countries: row.countries as Tour["countries"],
    duration: row.duration,
    days: row.days,
    price: row.price,
    childPrice: row.childPrice ?? undefined,
    infantPrice: row.infantPrice ?? undefined,
    originalPrice: row.originalPrice ?? undefined,
    image: row.image,
    gallery: row.gallery ?? undefined,
    description: row.description,
    longDescription: row.longDescription,
    highlights: row.highlights,
    included: row.included,
    excluded: row.excluded,
    itinerary: row.itinerary,
    rating: row.rating,
    reviewCount: row.reviewCount,
    departing: row.departing,
    difficulty: row.difficulty as Tour["difficulty"],
    groupSize: row.groupSize,
    type: row.type as Tour["type"],
    tier: row.tier as Tour["tier"],
    recommended: row.recommended ?? undefined,
    featured: row.featured ?? undefined,
    likes: row.likes ?? 0,
  };
}

export async function getToursFromDb(companyId: CompanyId): Promise<Tour[]> {
  await ensureCatalogCompanyColumns();
  const rows = await db.select().from(tours).where(eq(tours.companyId, companyId));
  return rows.map(mapDbTourToTour);
}

export async function getTourBySlug(slug: string, companyId: CompanyId): Promise<Tour | null> {
  await ensureCatalogCompanyColumns();
  const [row] = await db
    .select()
    .from(tours)
    .where(and(eq(tours.slug, slug), eq(tours.companyId, companyId)))
    .limit(1);
  return row ? mapDbTourToTour(row) : null;
}

export async function getTourSlugs(companyId: CompanyId): Promise<string[]> {
  await ensureCatalogCompanyColumns();
  const rows = await db
    .select({ slug: tours.slug })
    .from(tours)
    .where(eq(tours.companyId, companyId));
  return rows.map((r) => r.slug);
}

/** Slug + lastModified for sitemap (uses createdAt; tours table has no updatedAt). */
export async function getTourSitemapEntries(companyId: CompanyId): Promise<
  { slug: string; lastModified: Date }[]
> {
  await ensureCatalogCompanyColumns();
  const rows = await db
    .select({ slug: tours.slug, createdAt: tours.createdAt })
    .from(tours)
    .where(eq(tours.companyId, companyId));
  return rows.map((r) => ({
    slug: r.slug,
    lastModified: r.createdAt ?? new Date(),
  }));
}

export type TourPackageRatePatch = {
  price?: number;
  childPrice?: number | null;
  infantPrice?: number | null;
};

/** Update canonical USD package rates for one tenant tour. */
export async function updateTourPackageRates(
  companyId: CompanyId,
  id: number,
  patch: TourPackageRatePatch
): Promise<Tour | null> {
  await ensureCatalogCompanyColumns();
  const [row] = await db
    .update(tours)
    .set({
      ...(patch.price !== undefined ? { price: patch.price } : {}),
      ...(patch.childPrice !== undefined ? { childPrice: patch.childPrice } : {}),
      ...(patch.infantPrice !== undefined ? { infantPrice: patch.infantPrice } : {}),
    })
    .where(and(eq(tours.id, id), eq(tours.companyId, companyId)))
    .returning();
  return row ? mapDbTourToTour(row) : null;
}
