import { notFound } from "next/navigation";
import { TourDetail } from "@/components/tour-detail";
import { JsonLd } from "@/components/json-ld";
import { getTourBySlug, getTourSlugs } from "@/lib/tours-db";
import { tourJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await getTourSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) return { title: "Tour Not Found" };
  return {
    title: `${tour.title} | African Home Adventure`,
    description: tour.description,
  };
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  return (
    <>
      <JsonLd data={tourJsonLd(tour)} />
      <TourDetail tour={tour} />
    </>
  );
}
