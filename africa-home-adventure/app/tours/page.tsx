import { TourFilters } from "@/components/tour-filters"
import { tours } from "@/lib/data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Safari Tours | Africa Home Adventure",
  description:
    "Browse our collection of Kenya and Tanzania safari tours. From 3-day getaways to 12-day expeditions, find your perfect African adventure.",
}

export default function ToursPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-primary py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-accent">
            Explore East Africa
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl text-balance">
            Safari Tours & Packages
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/70 leading-relaxed">
            Choose from our carefully curated safari experiences across Kenya and Tanzania. Every
            tour can be customized to your preferences, budget, and schedule.
          </p>
        </div>
      </section>

      {/* Tours Grid with Filters */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <TourFilters tours={tours} />
        </div>
      </section>
    </>
  )
}
