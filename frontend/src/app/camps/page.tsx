// app/accommodations/page.tsx
import { Suspense } from "react";
import { Container, Section } from "@/components/layout";
import { AccommodationList } from "@/components/accommodation-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safari Accommodations | African Home Adventure",
  description:
    "Browse our curated selection of safari lodges, tented camps, and luxury cottages across Kenya and Tanzania.",
};

export default function AccommodationsPage() {
  return (
    <>
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            Stay in the Wild
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            Safari Accommodations
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            From authentic tented camps to luxury lodges and private cottages, 
            find your perfect home in the African wilderness.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <Suspense
            fallback={
              <div className="py-10 text-center text-base-content/60">
                Loading accommodations...
              </div>
            }
          >
            <AccommodationList />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
