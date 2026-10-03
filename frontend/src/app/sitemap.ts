import type { MetadataRoute } from "next";
import { getTourSitemapEntries } from "@/lib/tours-db";
import { DEFAULT_COMPANY_ID } from "@/types/company";
import { SITE_URL } from "@/lib/site-url";

const staticPaths: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/tours", changeFrequency: "weekly", priority: 0.9 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/booking", changeFrequency: "monthly", priority: 0.7 },
  { path: "/plan-safari", changeFrequency: "weekly", priority: 0.8 },
  { path: "/kenya-safaris", changeFrequency: "weekly", priority: 0.8 },
  { path: "/tanzania-safaris", changeFrequency: "weekly", priority: 0.8 },
  { path: "/budget-safaris", changeFrequency: "weekly", priority: 0.7 },
  { path: "/luxury-safaris", changeFrequency: "weekly", priority: 0.7 },
  { path: "/day-trips", changeFrequency: "weekly", priority: 0.7 },
  { path: "/balloon-safaris", changeFrequency: "monthly", priority: 0.6 },
  { path: "/beach-holidays", changeFrequency: "monthly", priority: 0.6 },
  { path: "/kilimanjaro-climbing", changeFrequency: "monthly", priority: 0.6 },
  { path: "/luxury-lodges", changeFrequency: "monthly", priority: 0.6 },
  { path: "/tented-camps", changeFrequency: "monthly", priority: 0.6 },
  { path: "/camps", changeFrequency: "monthly", priority: 0.6 },
  { path: "/flights", changeFrequency: "monthly", priority: 0.5 },
  { path: "/seasons", changeFrequency: "monthly", priority: 0.5 },
  { path: "/visa", changeFrequency: "monthly", priority: 0.5 },
];

/** Public AHA itineraries that should stay in the sitemap even if the catalog query fails. */
const CATALOG_TOUR_SLUGS = [
  "3-day-masai-mara-safari",
  "5-day-nakuru-naivasha-masai-mara",
  "3-day-amboseli-safari",
  "6-day-serengeti-ngorongoro-masai-mara",
  "5-day-amboseli-tsavo-west-tsavo-east",
  "8-day-kenya-tanzania-combined",
  "4-day-masai-mara-group-safari",
  "7-day-luxury-masai-mara-amboseli",
  "3-day-masai-mara-national-reserve-safari",
  "6-day-masai-mara-lake-nakuru-lake-naivasha-road-safari",
  "4-days-masai-mara-safari-enchoro-wildlife-camp",
  "3-day-amboseli-safari-drop-off-diani",
  "3-day-masai-mara-group-joining-safari",
  "4-day-masai-mara-group-joining-safari",
  "5-day-lake-nakuru-lake-naivasha-masai-mara-mid-comfort-safari",
  "6-day-masai-mara-lake-nakuru-lake-naivasha-migration-safari",
  "6-day-ngorongoro-serengeti-masai-mara-mid-range-safari",
  "8-day-lake-nakuru-masai-mara-diani-beach-safari",
  "9-day-ol-pejeta-nakuru-masai-mara-naivasha-amboseli-safari",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = staticPaths.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })
  );

  const tourLastModified = new Map<string, Date>();
  for (const slug of CATALOG_TOUR_SLUGS) {
    tourLastModified.set(slug, now);
  }
  try {
    const tourEntries = await getTourSitemapEntries(DEFAULT_COMPANY_ID);
    for (const tour of tourEntries) {
      if (!tour.slug) continue;
      tourLastModified.set(tour.slug, tour.lastModified);
    }
  } catch {
    // Keep the catalog slugs so itinerary pages remain indexable.
  }

  const tourPages: MetadataRoute.Sitemap = [...tourLastModified.entries()].map(
    ([slug, lastModified]) => ({
      url: `${SITE_URL}/tours/${slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.95,
    })
  );

  let destinationPages: MetadataRoute.Sitemap = [];
  try {
    const { ensureSprint7Schema } = await import("@/server/database/ensure-sprint7");
    const { destinations } = await import("@/lib/schema");
    const { db } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    await ensureSprint7Schema();
    const published = await db
      .select({ slug: destinations.slug })
      .from(destinations)
      .where(eq(destinations.published, true));
    destinationPages = published.map((row) => ({
      url: `${SITE_URL}/destinations/${row.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    destinationPages = [];
  }

  return [...staticPages, ...tourPages, ...destinationPages];
}
