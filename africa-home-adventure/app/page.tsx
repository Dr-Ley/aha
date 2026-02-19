import Image from "next/image"
import Link from "next/link"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TourCard } from "@/components/tour-card"
import { tours, testimonials } from "@/lib/data"

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-safari.jpg"
          alt="African savanna at golden hour with elephants and acacia trees"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-foreground/50" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-6 py-32">
        <div className="max-w-2xl">
          <Badge className="mb-6 bg-accent/90 text-accent-foreground border-none text-xs tracking-wider uppercase px-3 py-1">
            KATO Certified Tour Operator
          </Badge>
          <h1 className="font-serif text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl text-balance">
            Your Next Great Adventure Starts in Africa
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/80 max-w-xl">
            Experience the magic of Kenya and Tanzania with expertly guided safaris. Over 25 years
            creating unforgettable wildlife adventures across East Africa.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link href="/tours">
                Explore Safaris <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white"
              asChild
            >
              <Link href="/contact">Get a Free Quote</Link>
            </Button>
          </div>

          {/* Quick stats */}
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
  )
}

function FeaturedToursSection() {
  const featuredTours = tours.filter((t) => t.featured)

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-accent">
              Handpicked Experiences
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-foreground sm:text-4xl text-balance">
              Featured Safari Tours
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground leading-relaxed">
              Our most popular and highly-rated safari packages, carefully designed to showcase the
              best of East African wildlife and landscapes.
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/tours">
              View All Tours <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </div>
    </section>
  )
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
  ]

  return (
    <section className="py-20 lg:py-28 bg-secondary">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-accent">
            Why Africa Home Adventure
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-secondary-foreground sm:text-4xl text-balance">
            Book with Confidence
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Over two decades of crafting exceptional safari experiences across Kenya and Tanzania,
            serving clients from the UK, USA, EU, Australia, and Asia.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-start rounded-lg bg-card p-6 border border-border"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-card-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ExperienceSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
            <Image
              src="/images/safari-vehicle.jpg"
              alt="Safari 4x4 Land Cruiser on game drive in the African savanna"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* Content */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-accent">
              The Safari Experience
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-foreground sm:text-4xl text-balance">
              A Day on Safari in East Africa
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Your days on safari begin with a quiet African voice waking you well before sunrise.
                After an early morning coffee, you head out for hours in a safari vehicle as your
                driver guide leads the way looking for wildlife.
              </p>
              <p>
                You return to the lodge mid-morning for breakfast, then relax through the hottest
                part of the day. Afternoon tea around 3 PM signals another game drive, watching the
                reserve come alive as golden hour approaches.
              </p>
              <p>
                Just before sunset, enjoy the legendary &ldquo;Sundowner&rdquo; experience,
                watching the African sunset with a drink of your choice, before returning to your
                lodge for dinner under the stars.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/tours">Browse All Safaris</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Plan My Trip</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-secondary">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-accent">
            Traveler Stories
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-secondary-foreground sm:text-4xl text-balance">
            What Our Guests Say
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 6).map((t) => (
            <figure
              key={t.id}
              className="flex flex-col rounded-lg bg-card p-6 border border-border"
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < t.rating ? "fill-accent text-accent" : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.country} &mdash; {t.tour}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/zanzibar.jpg"
          alt="Beautiful Zanzibar beach with crystal clear water"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl text-balance">
          Ready to Experience the Magic of Africa?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80 leading-relaxed">
          Let us design your perfect safari. Share your travel dates and preferences, and we will
          craft a personalized itinerary just for you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            <Link href="/contact">
              Get a Free Quote <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white"
            asChild
          >
            <Link href="/tours">Browse Safaris</Link>
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/70">
          <a href="tel:+254722760661" className="flex items-center gap-2 hover:text-white transition-colors">
            <Phone className="h-4 w-4" /> +254 722 760 661
          </a>
          <a
            href="mailto:info@africahomeadventure.com"
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <Mail className="h-4 w-4" /> info@africahomeadventure.com
          </a>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedToursSection />
      <WhyChooseSection />
      <ExperienceSection />
      <TestimonialsSection />
      <CTASection />
    </>
  )
}
