import type { MetadataRoute } from "next";
import { getTourSitemapEntries } from "@/lib/tours-db";

const SITE_URL = "https://africanhomeadventure.com";

const staticPaths: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/tours", changeFrequency: "weekly", priority: 0.9 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/booking", changeFrequency: "monthly", priority: 0.7 },
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

  const tourEntries = await getTourSitemapEntries();
  const tourPages: MetadataRoute.Sitemap = tourEntries.map((tour) => ({
    url: `${SITE_URL}/tours/${tour.slug}`,
    lastModified: tour.lastModified,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...tourPages];
}
