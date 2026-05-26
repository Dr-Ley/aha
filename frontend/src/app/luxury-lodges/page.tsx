import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, Section } from "@/components/layout";
import { AccommodationFilters } from "@/components/accommodation-filters";

export const metadata: Metadata = {
  title: "Luxury Safari Lodges | African Home Adventure",
  description:
    "Premium safari lodges in Kenya and Tanzania. Experience world-class luxury accommodations with stunning views, gourmet dining, and exceptional service.",
};

export default function LuxuryLodgesPage() {
  return (
    <>
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            Premium Comfort & Service
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            Luxury Safari Lodges
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            Indulge in the finest safari accommodations across East Africa. 
            Our luxury lodges offer elegant suites, infinity pools, spa treatments, 
            and personalized service for an unforgettable wilderness retreat.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <Suspense
            fallback={
              <div className="py-10 text-center text-base-content/60">
                Loading luxury lodges...
              </div>
            }
          >
            <AccommodationFilters />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}