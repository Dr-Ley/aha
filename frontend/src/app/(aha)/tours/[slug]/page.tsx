import { notFound } from "next/navigation";
import { TourDetail } from "@/components/tour-detail";
import { JsonLd } from "@/components/json-ld";
import { getTourBySlug } from "@/lib/tours-db";
import { tourJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { DEFAULT_COMPANY_ID } from "@/types/company";
import { withCanonical } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

function duringProductionBuild() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (duringProductionBuild()) {
    return { title: "Safari Tour | African Home Adventure" };
  }
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
  if (duringProductionBuild()) return null;
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
