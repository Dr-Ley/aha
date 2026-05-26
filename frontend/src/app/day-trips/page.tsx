import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, Section } from "@/components/layout";
import { TourFilters } from "@/components/tour-filters";

export const metadata: Metadata = {
  title: "Day Trips | African Home Adventure",
  description:
    "Short safari and city excursions perfect for travelers with limited time, departing from Nairobi and Arusha.",
};

export default function DayTripsPage() {
  return (
    <>
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            Quick Getaways
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            Day Trips & Short Excursions
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            Discover nearby parks and attractions on expertly guided day trips—perfect if you have
            just one free day in Nairobi or Arusha.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <Suspense
            fallback={
              <div className="py-10 text-center text-base-content/60">
                Loading day trips...
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

