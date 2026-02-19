import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ArrowRight,
  Shield,
  Compass,
  Binoculars,
  Car,
  Phone,
  Mail,
  ChevronRight,
} from "lucide-react";
import { Container, Section } from "@/components/layout";
import { TourCard } from "@/components/tour-card";
import { tours, testimonials, destinations } from "@/lib/data";

function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1519659528534-7fd733a832a0?q=80&w=1026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="African savanna at golden hour with elephants and acacia trees"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-foreground/20" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6 py-32">
        <div className="max-w-2xl">
        <span className="badge badge-accent mb-6 text-xs px-2 font-semibold uppercase tracking-wider">
          KATO Certified Tour Operator
        </span>
          <h1 className="font-serif text-4xl font-bold leading-tight text-white text-balance sm:text-5xl lg:text-6xl">
            Your Next Great Adventure Starts in Africa
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90">
            Experience the magic of Kenya and Tanzania with expertly guided
            safaris. Over 25 years creating unforgettable wildlife adventures
            across East Africa with African Home Adventure.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
  <Link
    href="/tours"
    className="btn btn-accent btn-lg gap-2"
  >
    Explore Safaris <ArrowRight className="h-4 w-4" />
  </Link>
  <Link
    href="/contact"
    className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-black"
  >
    Get a Free Quote
  </Link>
</div>

          <div className="mt-12 flex flex-wrap gap-8">
            {[
              { value: "25+", label: "Years Experience" },
              { value: "5,000+", label: "Happy Travelers" },
              { value: "4.9", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


function DestinationsCarousel() {
  return (
    <Section spacing="none">
      <Container>
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-accent">
          Where We Go
        </p>
        <h2 className="mt-2 text-center font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
          Popular Destinations
        </h2>
        <div className="mt-8 overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex gap-4 pb-2 sm:justify-center">
            {destinations.map((d) => (
              <Link
                key={`${d.name}-${d.country}`}
                href={`/tours?destination=${encodeURIComponent(d.name)}`}
                className="group relative flex min-w-[160px] h-[180px] flex-col items-center justify-center rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-lg"
                style={{
                  backgroundImage: `url(${d.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/70 group-hover:via-black/30 transition-all" />
                
                {/* Text content positioned at bottom */}
                <div className="relative z-10 flex flex-col items-center mt-auto mb-4">
                  <span className="font-serif text-lg font-semibold text-white drop-shadow-lg">
                    {d.name}
                  </span>
                  <span className="text-xs text-white/80 drop-shadow-md">{d.country}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}


function FeaturedToursSection() {
  const featuredTours = tours.filter((t) => t.featured);

  return (
    <Section>
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Handpicked Experiences
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
              Featured Safari Tours
            </h2>
            <p className="mt-3 max-w-xl leading-relaxed text-base-content/70">
              Our most popular and highly-rated safari packages, carefully
              designed to showcase the best of East African wildlife and
              landscapes.
            </p>
          </div>
          <Link
            href="/tours"
            className="btn btn-outline btn-sm shrink-0 gap-1"
          >
            View All Tours <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </Container>
    </Section>
  );
}


function WhyChooseSection() {
  const features = [
    {
      icon: Shield,
      title: "Licensed & Certified",
      description:
        "KATO member FE/459 with Ministry of Tourism registration. Your holiday is fully protected under the KATO bonding scheme.",
    },
    {
      icon: Car,
      title: "Own Fleet of 4x4 Vehicles",
      description:
        "No middlemen. We own our safari Land Cruisers and deal directly with camps, lodges, and park authorities for better prices.",
    },
    {
      icon: Compass,
      title: "Expert Driver Guides",
      description:
        "Highly trained, experienced, and multilingual guides who are passionate about wildlife and have years of guiding expertise.",
    },
    {
      icon: Binoculars,
      title: "Tailor-Made Safaris",
      description:
        "Every itinerary is customized to your preferences, budget, and pace. Private tours with full flexibility at competitive prices.",
    },
  ];

  return (
    <Section variant="secondary">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Why African Home Adventure
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
            Book with Confidence
          </h2>
          <p className="mt-3 leading-relaxed text-base-content/70">
            Over two decades of crafting exceptional safari experiences across
            Kenya and Tanzania, serving clients from the UK, USA, EU, Australia,
            and Asia.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-start rounded-xl border border-base-content/10 bg-base-100 p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-base-content">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function ExperienceSection() {
  return (
    <Section>
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image
              src="https://i.pinimg.com/1200x/e0/04/a0/e004a036edb305dc40e8bae5fe98257e.jpg"
              alt="Safari 4x4 Land Cruiser on game drive in the African savanna"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              The Safari Experience
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
              A Day on Safari in East Africa
            </h2>
            <div className="mt-6 space-y-4 leading-relaxed text-base-content/70">
              <p>
                Your days on safari begin with a quiet African voice waking you
                well before sunrise. After an early morning coffee, you head out
                for hours in a safari vehicle as your driver guide leads the way
                looking for wildlife.
              </p>
              <p>
                You return to the lodge mid-morning for breakfast, then relax
                through the hottest part of the day. Afternoon tea around 3 PM
                signals another game drive, watching the reserve come alive as
                golden hour approaches.
              </p>
              <p>
                Just before sunset, enjoy the legendary &ldquo;Sundowner&rdquo;
                experience, watching the African sunset with a drink of your
                choice, before returning to your lodge for dinner under the
                stars.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/tours" className="btn btn-primary">
                Browse All Safaris
              </Link>
              <Link href="/contact" className="btn btn-outline">
                Plan My Trip
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function TestimonialsSection() {
  return (
    <Section variant="secondary">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Traveler Stories
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
            What Our Guests Say
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 6).map((t) => (
            <figure
              key={t.id}
              className="flex flex-col rounded-xl border border-base-content/10 bg-base-100 p-6 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < t.rating
                        ? "fill-accent text-accent"
                        : "fill-base-content/20 text-base-content/20"
                    }`}
                  />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-base-content/70">
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-base-content/10 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-content text-sm font-semibold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-base-content">
                    {t.name}
                  </p>
                  <p className="text-xs text-base-content/60">
                    {t.country} — {t.tour}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1634646350433-fe03ad698448?q=80&w=1334&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Beautiful Zanzibar beach with crystal clear water"
          fill
          className="object-cover"
          sizes="100vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-foreground/50" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-serif text-3xl font-bold text-white text-balance sm:text-4xl lg:text-5xl">
          Ready to Experience the Magic of Africa?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/80">
          Let us design your perfect safari. Share your travel dates and
          preferences, and we will craft a personalized itinerary just for you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="btn btn-accent btn-lg gap-2 text-accent-content"
          >
            Get a Free Quote <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/tours"
            className="btn btn-outline btn-lg border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 hover:text-white"
          >
            Browse Safaris
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/70">
          <a
            href="tel:+254722760661"
            className="flex items-center gap-2 transition-colors hover:text-white"
          >
            <Phone className="h-4 w-4" /> +254 722 760 661
          </a>
          <a
            href="mailto:info@africahomeadventure.com"
            className="flex items-center gap-2 transition-colors hover:text-white"
          >
            <Mail className="h-4 w-4" /> info@africahomeadventure.com
          </a>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <DestinationsCarousel />
      <FeaturedToursSection />
      <WhyChooseSection />
      <ExperienceSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
