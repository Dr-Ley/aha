import { Suspense } from "react";
import { Container, Section } from "@/components/layout";
import { TourFilters } from "@/components/tour-filters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safari Tours | African Home Adventure",
  description:
    "Browse our collection of Kenya and Tanzania safari tours. From 3-day getaways to 12-day expeditions, find your perfect African adventure.",
};

type SearchParams = { [key: string]: string | string[] | undefined };

const heroContentByCategory: Record<
  string,
  { eyebrow: string; title: string; description: string }
> = {
  budget: {
    eyebrow: "Affordable Adventures",
    title: "Budget Safaris in East Africa",
    description:
      "Experience unforgettable safaris without breaking the bank. Handpicked budget-friendly tours across Kenya and Tanzania.",
  },
  luxury: {
    eyebrow: "Premium Experiences",
    title: "Luxury Safaris & Fly-In Tours",
    description:
      "Stay in exclusive lodges and luxury tented camps, with seamless transport and personalized service throughout your safari.",
  },
  kilimanjaro: {
    eyebrow: "Mountain Expeditions",
    title: "Kilimanjaro Climbing Packages",
    description:
      "Choose from carefully curated Kilimanjaro routes with expert guides, acclimatization plans, and full support teams.",
  },
  beach: {
    eyebrow: "Coastal Paradise",
    title: "Beach Holidays & Safaris",
    description:
      "Combine wildlife adventures with time on the Indian Ocean’s finest beaches in Diani, Zanzibar, and beyond.",
  },
  "day-trips": {
    eyebrow: "Quick Getaways",
    title: "Day Trips from Nairobi & Arusha",
    description:
      "Short on time? Explore nearby parks and attractions on expertly guided day tours.",
  },
  kenya: {
    eyebrow: "Kenya Adventures",
    title: "Kenya Safaris & Tours",
    description:
      "From the Masai Mara to Amboseli and Tsavo, discover Kenya’s most iconic safari destinations.",
  },
  tanzania: {
    eyebrow: "Tanzania Expeditions",
    title: "Tanzania Safaris & Tours",
    description:
      "Witness the Great Migration and explore Serengeti, Ngorongoro Crater, Tarangire, and more.",
  },
  balloon: {
    eyebrow: "Aerial Safaris",
    title: "Hot Air Balloon Safaris",
    description:
      "See the savannah from above with sunrise balloon flights over wildlife-rich plains.",
  },
};

function getCategoryKey(searchParams: SearchParams): string | null {
  const getSingle = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const tier = getSingle(searchParams.tier);
  const type = getSingle(searchParams.type);
  const country = getSingle(searchParams.country);
  const duration = getSingle(searchParams.duration);

  if (tier === "budget") return "budget";
  if (tier === "luxury") return "luxury";

  if (country === "Kenya") return "kenya";
  if (country === "Tanzania") return "tanzania";

  if (type === "kilimanjaro") return "kilimanjaro";
  if (type === "beach") return "beach";
  if (type === "balloon") return "balloon";

  if (duration === "day" || duration === "1 Day") return "day-trips";

  return null;
}

interface ToursPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ToursPage({ searchParams }: ToursPageProps) {
  const resolvedSearchParams = await searchParams;
  const categoryKey = getCategoryKey(resolvedSearchParams);
  const hero =
    (categoryKey && heroContentByCategory[categoryKey]) || {
      eyebrow: "Explore East Africa",
      title: "Safari Tours & Packages",
      description:
        "Choose from our carefully curated safari experiences across Kenya and Tanzania. Every tour can be customized to your preferences, budget, and schedule.",
    };

  return (
    <>
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            {hero.eyebrow}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            {hero.description}
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <Suspense
            fallback={
              <div className="py-10 text-center text-base-content/60">
                Loading tours...
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
