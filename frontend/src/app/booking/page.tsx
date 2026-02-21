import { BookingForm } from "@/components/booking-form";
import { Container, Section } from "@/components/layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Your Safari | African Home Adventure",
  description:
    "Complete your safari booking with African Home Adventure. Secure your East African wildlife adventure today.",
};

export default function BookingPage() {
  return (
    <>
      <section className="bg-primary py-12 lg:py-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Secure Your Adventure
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl">
            Book Your Safari
          </h1>
          <p className="mt-3 max-w-xl text-primary-content/70">
            Fill in your details below and our team will confirm your booking
            within 2 hours. No payment required until confirmation.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <BookingForm />
        </Container>
      </Section>
    </>
  );
}
