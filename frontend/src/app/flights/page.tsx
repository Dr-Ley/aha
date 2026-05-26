import type { Metadata } from "next";
import Link from "next/link";
import {
  Plane,
  Clock,
  Luggage,
  ArrowRight,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Info,
  MapPin,
} from "lucide-react";
import { Container, Section } from "@/components/layout";
import { FlightsMonthSection } from "./FlightsMonthSection";
import { FlightCostsTable, type FlightCostRow } from "./FlightCostsTable";

export const metadata: Metadata = {
  title:
    "Booking Flights for Kenya & Tanzania Safari | African Home Adventure",
  description:
    "Everything you need to know about booking flights for your Kenya and Tanzania safari. Best airports, airlines, flight costs, and expert tips from African Home Adventure.",
};

const airports = {
  kenya: [
    {
      code: "NBO",
      name: "Jomo Kenyatta International Airport",
      city: "Nairobi",
      description:
        "Kenya's main international gateway and the starting point for most safaris. Well-connected to all major global hubs.",
      bestFor: "Masai Mara, Amboseli, Lake Nakuru, Northern Kenya",
    },
    {
      code: "MBA",
      name: "Moi International Airport",
      city: "Mombasa",
      description:
        "Ideal if you're combining safari with a beach holiday on Kenya's coast or starting from Tsavo.",
      bestFor: "Tsavo, Diani Beach, Coastal Safaris",
    },
  ],
  tanzania: [
    {
      code: "JRO",
      name: "Kilimanjaro International Airport",
      city: "Arusha/Kilimanjaro",
      description:
        "The best entry point for Northern Tanzania safaris and Kilimanjaro climbs. Located between Arusha and Moshi.",
      bestFor: "Serengeti, Ngorongoro, Tarangire, Kilimanjaro",
    },
    {
      code: "ZNZ",
      name: "Abeid Amani Karume Airport",
      city: "Zanzibar",
      description:
        "Direct access to Zanzibar's beaches. Perfect for post-safari relaxation or a beach-focused trip.",
      bestFor: "Zanzibar Beach Extension, Spice Tours",
    },
    {
      code: "DAR",
      name: "Julius Nyerere International Airport",
      city: "Dar es Salaam",
      description:
        "Tanzania's largest airport. Good for Southern Tanzania circuit or connecting to Zanzibar.",
      bestFor: "Selous, Ruaha, Southern Tanzania, Zanzibar connections",
    },
  ],
};

const airlines = [
  {
    name: "Kenya Airways",
    routes: "Direct from London, Amsterdam, Paris, Dubai, Mumbai",
  },
  {
    name: "Ethiopian Airlines",
    routes: "Via Addis Ababa from most global destinations",
  },
  {
    name: "Emirates",
    routes: "Via Dubai from Americas, Europe, Asia, Australia",
  },
  {
    name: "Qatar Airways",
    routes: "Via Doha from major global hubs",
  },
  {
    name: "KLM",
    routes: "Direct to Nairobi from Amsterdam",
  },
  {
    name: "British Airways",
    routes: "Direct to Nairobi from London Heathrow",
  },
  {
    name: "Turkish Airlines",
    routes: "Via Istanbul from Europe and Americas",
  },
  {
    name: "South African Airways",
    routes: "Via Johannesburg from Southern Africa",
  },
];

const flightCosts: FlightCostRow[] = [
  {
    from: "London/Europe",
    minUsd: 600,
    maxUsd: 1200,
    season: "Varies by season",
  },
  {
    from: "New York/US East Coast",
    minUsd: 900,
    maxUsd: 1800,
    season: "Direct options limited",
  },
  {
    from: "Los Angeles/US West Coast",
    minUsd: 1000,
    maxUsd: 2000,
    season: "Usually 1-2 stops",
  },
  {
    from: "Dubai/Middle East",
    minUsd: 400,
    maxUsd: 800,
    season: "Frequent direct flights",
  },
  {
    from: "Mumbai/India",
    minUsd: 350,
    maxUsd: 700,
    season: "Good connections",
  },
  {
    from: "Sydney/Australia",
    minUsd: 1200,
    maxUsd: 2200,
    season: "Via Middle East",
  },
];

export default function FlightsPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            Travel Tips
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            Booking Flights for Your Safari
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            Your East African adventure starts with the right flight. Here is
            everything you need to know about getting to Kenya and Tanzania for
            your safari.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="btn btn-accent gap-2 text-accent-content"
            >
              Get Help with Flights <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tours"
              className="btn btn-outline border-primary-content/30 bg-primary-content/10 text-primary-content hover:bg-primary-content/20"
            >
              Browse Safari Tours
            </Link>
          </div>
        </Container>
      </section>

      {/* Month Selector Section - Client component */}
      <FlightsMonthSection />

      {/* International Gateways */}
 
      {/* Flight Costs */}
      <Section variant="secondary">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-md font-semibold uppercase tracking-widest text-primary">
                Budget Planning
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
                Typical Flight Costs
              </h2>
              <p className="mt-4 leading-relaxed text-base-content/70">
                Flight prices vary based on season, airline, and how far in
                advance you book. Here are typical round-trip ranges to help you
                plan your budget.
              </p>

              <div className="mt-6 card bg-warning/10 border border-warning/30 p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-semibold text-base-content">Pro Tip</p>
                    <p className="mt-1 text-sm text-base-content/70">
                      Book 3-6 months in advance for best rates, especially
                      during peak safari season (July-October). We can help
                      coordinate your flights with your safari dates.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <FlightCostsTable rows={flightCosts} />
          </div>
        </Container>
      </Section>

      {/* Timing and Transfers */}
      <Section>
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              Important Considerations
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
              Arrival Times & Transfers
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-base-content">
                Best Arrival Times
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                Aim to arrive by early afternoon (before 3 PM) if your safari
                starts the next day. This ensures time for rest and a relaxed
                start. For same-day departures to safari, arrive by 10 AM.
              </p>
            </div>

            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                <Plane className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-base-content">
                Safari Flight Coordination
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                We can align your international flights with bush plane
                schedules if you are flying into remote camps. Share your flight
                details and we will handle the rest.
              </p>
            </div>

            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                <AlertCircle className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-base-content">
                Missed Transfer Policy
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                Flight delays happen. We monitor your flight and adjust transfers
                accordingly. For significant delays, we will arrange alternative
                transport or overnight accommodation.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Bush Plane Baggage */}
      <Section variant="secondary">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">
                Good to Know
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
                Bush Plane Baggage Rules
              </h2>
              <p className="mt-4 leading-relaxed text-base-content/70">
                If your safari includes flights in small bush planes to remote
                camps, you will need to pack light. Here is what you need to
                know:
              </p>

              <ul className="mt-6 space-y-4">
                {[
                  "Weight limit: 15-20 kg (33-44 lbs) including carry-on",
                  "Use soft-sided bags only - no hard suitcases",
                  "Dimensions: approximately 25cm x 30cm x 62cm",
                  "Excess luggage can be stored securely in Nairobi/Arusha",
                  "Laundry service is available at most camps",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    <span className="text-base-content">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card bg-base-100 border border-base-300 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Luggage className="h-6 w-6 shrink-0 text-accent" />
                <div>
                  <h3 className="font-serif text-lg font-semibold text-base-content">
                    Packing Recommendation
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    Pack neutral-colored clothing (khaki, olive, tan) that can be
                    layered. Mornings are cool and afternoons are warm.
                    Quick-dry fabrics work best. Most camps have laundry
                    service, so you can pack less than you think.
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-base-300 pt-6">
                <h4 className="font-semibold text-base-content">
                  Essential Items
                </h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Sunscreen",
                    "Hat",
                    "Sunglasses",
                    "Binoculars",
                    "Camera",
                    "Light jacket",
                    "Comfortable shoes",
                    "Insect repellent",
                  ].map((item) => (
                    <span
                      key={item}
                      className="badge badge-ghost badge-md"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section variant="primary">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl">
              Need Help Coordinating Your Flights?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-primary-content/80">
              Our team can help you find the best flight options and ensure your
              arrival aligns perfectly with your safari. Share your travel dates
              and we will take care of the rest.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="btn btn-accent btn-lg gap-2 text-accent-content"
              >
                Get Flight Assistance <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tours"
                className="btn btn-outline btn-lg border-primary-content/30 bg-primary-content/10 text-primary-content hover:bg-primary-content/20"
              >
                Browse Safari Tours
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-primary-content/70">
              <a
                href="tel:+254722760661"
                className="flex items-center gap-2 transition-colors hover:text-primary-content"
              >
                <Phone className="h-4 w-4" /> +254 722 760 661
              </a>
              <a
                href="mailto:info@africahomeadventure.com"
                className="flex items-center gap-2 transition-colors hover:text-primary-content"
              >
                <Mail className="h-4 w-4" /> info@africahomeadventure.com
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
