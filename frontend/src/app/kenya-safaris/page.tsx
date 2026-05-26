import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, Section } from "@/components/layout";
import { TourFilters } from "@/components/tour-filters";

export const metadata: Metadata = {
  title: "Kenya Safaris | African Home Adventure",
  description:
    "Kenya safari tours to Masai Mara, Amboseli, Tsavo and more, with customizable itineraries for all budgets.",
};

export default function KenyaSafarisPage() {
  return (
    <>
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            Kenya Adventures
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            Kenya Safaris & Tours
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            Explore Kenya&apos;s most iconic parks—including Masai Mara, Amboseli, Tsavo, and more—
            on well-crafted safaris tailored to your travel style.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <Suspense
            fallback={
              <div className="py-10 text-center text-base-content/60">
                Loading Kenya safaris...
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

