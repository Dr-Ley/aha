import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, Section } from "@/components/layout";
import { AccommodationFilters } from "@/components/accommodation-filters";

export const metadata: Metadata = {
  title: "Tented Camps | African Home Adventure",
  description:
    "Authentic safari tented camps in Kenya and Tanzania. Experience the wild with comfortable canvas accommodations and immersive nature experiences.",
};

export default function TentedCampsPage() {
  return (
    <>
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            Authentic Wilderness Experience
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            Safari Tented Camps
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            Immerse yourself in nature with our carefully selected tented camps. 
            Enjoy the sounds of the wild while sleeping in comfort under canvas, 
            with amenities ranging from budget-friendly to luxury glamping experiences.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <Suspense
            fallback={
              <div className="py-10 text-center text-base-content/60">
                Loading tented camps...
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