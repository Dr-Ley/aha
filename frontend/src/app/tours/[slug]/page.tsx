import { notFound } from "next/navigation";
import { TourDetail } from "@/components/tour-detail";
import { JsonLd } from "@/components/json-ld";
import { getTourBySlug, getTourSlugs } from "@/lib/tours-db";
import { tourJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { DEFAULT_COMPANY_ID } from "@/types/company";
import { withCanonical } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await getTourSlugs(DEFAULT_COMPANY_ID);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug, DEFAULT_COMPANY_ID);
  if (!tour) return { title: "Tour Not Found", robots: { index: false, follow: false } };
  return withCanonical(`/tours/${slug}`, {
    title: `${tour.title} | African Home Adventure`,
    description: tour.description,
  });
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug, DEFAULT_COMPANY_ID);
  if (!tour) notFound();

  return (
    <>
      <JsonLd data={tourJsonLd(tour)} />
      <TourDetail tour={tour} />
    </>
  );
}
