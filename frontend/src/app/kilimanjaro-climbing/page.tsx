import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, Section } from "@/components/layout";
import { TourFilters } from "@/components/tour-filters";

export const metadata: Metadata = {
  title: "Kilimanjaro Climbing | African Home Adventure",
  description:
    "Guided Mt. Kilimanjaro trekking packages with experienced guides, support teams, and carefully planned routes.",
};

export default function KilimanjaroClimbingPage() {
  return (
    <>
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            Mountain Expeditions
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            Kilimanjaro Climbing Packages
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            Choose from carefully designed Kilimanjaro routes, with acclimatization schedules,
            professional guides, and full support teams to help you summit Africa&apos;s highest
            peak.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <Suspense
            fallback={
              <div className="py-10 text-center text-base-content/60">
                Loading Kilimanjaro climbs...
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

