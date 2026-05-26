import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, Section } from "@/components/layout";
import { TourFilters } from "@/components/tour-filters";

export const metadata: Metadata = {
  title: "Tanzania Safaris | African Home Adventure",
  description:
    "Tanzania safari tours to Serengeti, Ngorongoro Crater, Tarangire and more, including Great Migration itineraries.",
};

export default function TanzaniaSafarisPage() {
  return (
    <>
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            Tanzania Expeditions
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            Tanzania Safaris & Tours
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            Follow the Great Migration and discover Serengeti, Ngorongoro Crater, Tarangire and
            other legendary Tanzania safari destinations.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <Suspense
            fallback={
              <div className="py-10 text-center text-base-content/60">
                Loading Tanzania safaris...
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

