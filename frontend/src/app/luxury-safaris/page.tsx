import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, Section } from "@/components/layout";
import { TourFilters } from "@/components/tour-filters";

export const metadata: Metadata = {
  title: "Luxury Safaris | African Home Adventure",
  description:
    "Premium fly-in and lodge safaris across Kenya and Tanzania with luxury accommodations and personalized service.",
};

export default function LuxurySafarisPage() {
  return (
    <>
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            Premium Experiences
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            Luxury Safaris & Fly-In Tours
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            Discover handpicked luxury safaris featuring exclusive lodges, intimate camps, and
            seamless logistics for a truly indulgent African adventure.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <Suspense
            fallback={
              <div className="py-10 text-center text-base-content/60">
                Loading luxury safaris...
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

