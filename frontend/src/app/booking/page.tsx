import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/layout";
import { tours } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Your Safari | African Home Adventure",
  description:
    "Complete your safari booking with African Home Adventure. Secure your East African wildlife adventure today.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string }>;
}) {
  const params = await searchParams;
  const tourSlug = params?.tour;
  const tour = tourSlug ? tours.find((t) => t.slug === tourSlug) : null;

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
            within 24 hours. No payment required until confirmation.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          {tour && (
            <div className="mb-8 rounded-xl border border-base-content/10 bg-base-200 p-6">
              <p className="text-sm text-base-content/60">Selected tour</p>
              <p className="font-serif text-lg font-semibold">{tour.title}</p>
              <p className="text-sm text-base-content/70">
                From ${tour.price} per person
              </p>
            </div>
          )}
          <p className="text-base-content/70">
            Contact us to complete your booking:{" "}
            <a href="tel:+254722760661" className="link link-primary">
              +254 722 760 661
            </a>{" "}
            or{" "}
            <a href="mailto:info@africahomeadventure.com" className="link link-primary">
              info@africahomeadventure.com
            </a>
          </p>
          <Link href="/contact" className="btn btn-primary mt-6 gap-2">
            Get a Custom Quote <ArrowRight className="h-4 w-4" />
          </Link>
        </Container>
      </Section>
    </>
  );
}
