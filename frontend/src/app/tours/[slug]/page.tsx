import { notFound } from "next/navigation";
import { TourDetail } from "@/components/tour-detail";
import { tours } from "@/lib/data";
import type { Metadata } from "next";

export function generateStaticParams() {
  return tours.map((tour) => ({ slug: tour.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = tours.find((t) => t.slug === slug);
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
  const tour = tours.find((t) => t.slug === slug);
  if (!tour) notFound();

  return <TourDetail tour={tour} />;
}
