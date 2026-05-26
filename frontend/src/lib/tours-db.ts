import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tours } from "@/lib/schema";
import type { Tour } from "@/lib/data";

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
  };
}

export async function getToursFromDb(): Promise<Tour[]> {
  const rows = await db.select().from(tours);
  return rows.map(mapDbTourToTour);
}

export async function getTourBySlug(slug: string): Promise<Tour | null> {
  const [row] = await db
    .select()
    .from(tours)
    .where(eq(tours.slug, slug))
    .limit(1);
  return row ? mapDbTourToTour(row) : null;
}

export async function getTourSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: tours.slug }).from(tours);
  return rows.map((r) => r.slug);
}
