import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, Section } from "@/components/layout";
import { TourFilters } from "@/components/tour-filters";

export const metadata: Metadata = {
  title: "Balloon Safaris | African Home Adventure",
  description:
    "Hot air balloon safaris over Masai Mara and Serengeti, including sunrise flights and champagne breakfasts.",
};

export default function BalloonSafarisPage() {
  return (
    <>
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            Aerial Safaris
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            Hot Air Balloon Safaris
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            Experience the savannah from above with sunrise hot air balloon flights over
            wildlife-rich plains, followed by bush breakfasts.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <Suspense
            fallback={
              <div className="py-10 text-center text-base-content/60">
                Loading balloon safaris...
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

