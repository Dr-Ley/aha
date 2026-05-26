import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, Section } from "@/components/layout";
import { TourFilters } from "@/components/tour-filters";

export const metadata: Metadata = {
  title: "Beach Holidays | African Home Adventure",
  description:
    "Safari and beach holiday packages combining wildlife with the white-sand beaches of Diani, Zanzibar, and the Swahili Coast.",
};

export default function BeachHolidaysPage() {
  return (
    <>
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            Coastal Paradise
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            Beach Holidays & Safaris
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            Combine unforgettable safari adventures with time to relax on the Indian Ocean&apos;s
            most beautiful beaches, from Diani to Zanzibar.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <Suspense
            fallback={
              <div className="py-10 text-center text-base-content/60">
                Loading beach holidays...
              </div>
            }
          >
            <TourFilters />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}

