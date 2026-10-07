import { stat } from "node:fs/promises";
import path from "node:path";
import type { MetadataRoute } from "next";
import { getTourSitemapEntries } from "@/lib/tours-db";
import { DEFAULT_COMPANY_ID } from "@/types/company";
import { SITE_URL } from "@/lib/site-url";

/** Refresh hourly so tour and destination timestamps stay current. */
export const revalidate = 3600;

const staticPaths: {
  path: string;
  file: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", file: "src/app/home-page.tsx", changeFrequency: "weekly", priority: 1 },
  { path: "/tours", file: "src/app/tours/page.tsx", changeFrequency: "weekly", priority: 0.9 },
  { path: "/contact", file: "src/app/contact/page.tsx", changeFrequency: "monthly", priority: 0.8 },
  { path: "/kenya-safaris", file: "src/app/kenya-safaris/page.tsx", changeFrequency: "weekly", priority: 0.8 },
  { path: "/tanzania-safaris", file: "src/app/tanzania-safaris/page.tsx", changeFrequency: "weekly", priority: 0.8 },
  { path: "/budget-safaris", file: "src/app/budget-safaris/page.tsx", changeFrequency: "weekly", priority: 0.7 },
  { path: "/luxury-safaris", file: "src/app/luxury-safaris/page.tsx", changeFrequency: "weekly", priority: 0.7 },
  { path: "/day-trips", file: "src/app/day-trips/page.tsx", changeFrequency: "weekly", priority: 0.7 },
  { path: "/balloon-safaris", file: "src/app/balloon-safaris/page.tsx", changeFrequency: "monthly", priority: 0.6 },
  { path: "/beach-holidays", file: "src/app/beach-holidays/page.tsx", changeFrequency: "monthly", priority: 0.6 },
  { path: "/kilimanjaro-climbing", file: "src/app/kilimanjaro-climbing/page.tsx", changeFrequency: "monthly", priority: 0.6 },
  { path: "/luxury-lodges", file: "src/app/luxury-lodges/page.tsx", changeFrequency: "monthly", priority: 0.6 },
  { path: "/tented-camps", file: "src/app/tented-camps/page.tsx", changeFrequency: "monthly", priority: 0.6 },
  { path: "/camps", file: "src/app/camps/page.tsx", changeFrequency: "monthly", priority: 0.6 },
  { path: "/flights", file: "src/app/flights/page.tsx", changeFrequency: "monthly", priority: 0.5 },
  { path: "/seasons", file: "src/app/seasons/page.tsx", changeFrequency: "monthly", priority: 0.5 },
  { path: "/visa", file: "src/app/visa/page.tsx", changeFrequency: "monthly", priority: 0.5 },
];

/** Public AHA itineraries kept in the sitemap when the catalog query fails. */
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

async function fileLastModified(relativeFile: string): Promise<Date | undefined> {
  try {
    const info = await stat(path.join(process.cwd(), relativeFile));
    return info.mtime;
  } catch (error) {
    console.error(`[sitemap] could not read lastModified for ${relativeFile}`, error);
    return undefined;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = await Promise.all(
    staticPaths.map(async ({ path: pagePath, file, changeFrequency, priority }) => {
      const lastModified = await fileLastModified(file);
      return {
        url: `${SITE_URL}${pagePath}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency,
        priority,
      };
    })
  );

  const tourLastModified = new Map<string, Date | null>();
  try {
    const tourEntries = await getTourSitemapEntries(DEFAULT_COMPANY_ID);
    for (const tour of tourEntries) {
      if (!tour.slug) continue;
      tourLastModified.set(tour.slug, tour.lastModified);
    }
  } catch (error) {
    console.error("[sitemap] tour query failed; falling back to catalog slugs", error);
    for (const slug of CATALOG_TOUR_SLUGS) {
      tourLastModified.set(slug, null);
    }
  }

  const tourPages: MetadataRoute.Sitemap = [...tourLastModified.entries()].map(
    ([slug, lastModified]) => ({
      url: `${SITE_URL}/tours/${slug}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: "weekly" as const,
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
      .select({ slug: destinations.slug, createdAt: destinations.createdAt })
      .from(destinations)
      .where(eq(destinations.published, true));
    destinationPages = published.map((row) => ({
      url: `${SITE_URL}/destinations/${row.slug}`,
      ...(row.createdAt ? { lastModified: row.createdAt } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[sitemap] destination query failed", error);
    destinationPages = [];
  }

  return [...staticPages, ...tourPages, ...destinationPages];
}
