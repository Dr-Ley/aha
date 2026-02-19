import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Star,
  Clock,
  MapPin,
  Users,
  Calendar,
  Check,
  X,
  ChevronRight,
  ArrowRight,
  Shield,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { tours } from "@/lib/data"
import type { Metadata } from "next"

export function generateStaticParams() {
  return tours.map((tour) => ({ slug: tour.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const tour = tours.find((t) => t.slug === slug)
  if (!tour) return { title: "Tour Not Found" }
  return {
    title: `${tour.title} | Africa Home Adventure`,
    description: tour.description,
  }
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tour = tours.find((t) => t.slug === slug)
  if (!tour) notFound()

  return (
    <>
      {/* Breadcrumb */}
        <div className="bg-secondary">
          <div className="mx-auto max-w-7xl px-6 py-3">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href="/tours" className="hover:text-foreground transition-colors">
                Tours
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium truncate">{tour.shortTitle}</span>
            </nav>
          </div>
        </div>

        {/* Hero image */}
        <section className="relative h-[40vh] sm:h-[50vh] overflow-hidden">
          <Image
            src={tour.image}
            alt={tour.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-primary text-primary-foreground">{tour.country}</Badge>
                <Badge variant="secondary" className="bg-card/90 text-card-foreground">
                  {tour.difficulty}
                </Badge>
              </div>
              <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl lg:text-4xl text-balance max-w-3xl">
                {tour.title}
              </h1>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-10 lg:py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-10 lg:grid-cols-3">
              {/* Main content */}
              <div className="lg:col-span-2">
                {/* Quick info */}
                <div className="flex flex-wrap gap-6 rounded-lg bg-secondary p-5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-semibold text-foreground">{tour.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Destinations</p>
                      <p className="text-sm font-semibold text-foreground">{tour.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Group Size</p>
                      <p className="text-sm font-semibold text-foreground">{tour.groupSize}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Departing</p>
                      <p className="text-sm font-semibold text-foreground">{tour.departing}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-accent text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                      <p className="text-sm font-semibold text-foreground">
                        {tour.rating} ({tour.reviewCount})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overview */}
                <div className="mt-10">
                  <h2 className="font-serif text-2xl font-bold text-foreground">Overview</h2>
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {tour.longDescription}
                  </p>
                </div>

                {/* Highlights */}
                <div className="mt-10">
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    Tour Highlights
                  </h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {tour.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3">
                        <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator className="my-10" />

                {/* Itinerary */}
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    Day-by-Day Itinerary
                  </h2>
                  <div className="mt-6 space-y-6">
                    {tour.itinerary.map((day) => (
                      <div
                        key={day.day}
                        className="relative flex gap-4 rounded-lg border border-border bg-card p-5"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {day.day}
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">{day.title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {day.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-10" />

                {/* Included / Excluded */}
                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-foreground">
                      {"What's Included"}
                    </h2>
                    <ul className="mt-4 space-y-2.5">
                      {tour.included.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-foreground">
                      {"What's Excluded"}
                    </h2>
                    <ul className="mt-4 space-y-2.5">
                      {tour.excluded.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sidebar — Booking card */}
              <aside className="lg:col-span-1">
                <div className="sticky top-24 rounded-lg border border-border bg-card p-6">
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground">From</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">${tour.price}</span>
                      {tour.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through">
                          ${tour.originalPrice}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">per person</p>
                  </div>

                  {tour.originalPrice && (
                    <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
                      Save ${tour.originalPrice - tour.price} per person
                    </Badge>
                  )}

                  <Button className="w-full" size="lg" asChild>
                    <Link href={`/booking?tour=${tour.slug}`}>
                      Book This Safari <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full mt-3" asChild>
                    <Link href="/contact">Get a Custom Quote</Link>
                  </Button>

                  <Separator className="my-5" />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="h-4 w-4 text-primary" />
                      KATO bonding scheme protection
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      Free cancellation up to 30 days
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      Private tour — fully customizable
                    </div>
                  </div>

                  <Separator className="my-5" />

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">Need help planning?</p>
                    <a
                      href="tel:+254722760661"
                      className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" /> +254 722 760 661
                    </a>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
    </>
  )
}
