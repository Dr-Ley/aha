import { Container, Section } from "@/components/layout";
import { PlanSafariForm } from "@/components/plan-safari-form";
import type { Metadata } from "next";
import { withCanonical } from "@/lib/site-url";

export const metadata: Metadata = withCanonical("/plan-safari", {
  title: "Plan Your Safari | African Home Adventure",
  description:
    "Tell us your travellers, dates, and preferred parks. We generate a structured Kenya safari itinerary with live Enzi pricing.",
  robots: { index: false, follow: false },
});

export default function PlanSafariPage() {
  return (
    <>
      <section className="bg-primary py-12 lg:py-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Custom itinerary</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl">
            Plan your safari
          </h1>
          <p className="mt-3 max-w-xl text-primary-content/70">
            Choose destinations and travellers. Enzi retrieves AHA tourism data, sequences a plan, validates it, then
            prices accommodation, park fees, transport, and activities.
          </p>
        </Container>
      </section>
      <Section>
        <Container>
          <PlanSafariForm />
        </Container>
      </Section>
    </>
  );
}
