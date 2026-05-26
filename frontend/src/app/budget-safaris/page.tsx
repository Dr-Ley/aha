import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, Section } from "@/components/layout";
import { TourFilters } from "@/components/tour-filters";

export const metadata: Metadata = {
  title: "Budget Safaris | African Home Adventure",
  description:
    "Affordable Kenya and Tanzania safari tours with quality accommodations and expert guides. Explore East Africa on a budget.",
};

export default function BudgetSafarisPage() {
  return (
    <>
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            Affordable Adventures
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            Budget Safaris in East Africa
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            Handpicked budget-friendly safaris across Kenya and Tanzania, designed to give you
            maximum wildlife viewing and authentic experiences at an affordable price.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <Suspense
            fallback={
              <div className="py-10 text-center text-base-content/60">
                Loading budget safaris...
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

