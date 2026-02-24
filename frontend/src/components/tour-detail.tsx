"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
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
  MessageCircle,
} from "lucide-react";
import type { Tour } from "@/lib/data";

const WHATSAPP_NUMBER = "254722760661";

export function TourDetail({ tour }: { tour: Tour }) {
  const [heroIndex, setHeroIndex] = useState(0);
  const gallery: string[] = tour.gallery ?? tour.image;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(
      () => setHeroIndex((i) => (i + 1) % gallery.length),
      5000
    );
    return () => clearInterval(t);
  }, [gallery.length]);

  const scrollToImage = (index: number) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const item = container.children[index] as HTMLElement;
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      }
    }
    setHeroIndex(index);
  };

  return (
    <>
      <div className="bg-base-200">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <nav
            className="flex items-center gap-2 text-sm text-base-content/60"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="transition-colors hover:text-base-content">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/tours" className="transition-colors hover:text-base-content">
              Tours
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="truncate font-medium text-base-content">
              {tour.shortTitle}
            </span>
          </nav>
        </div>
      </div>

      <section className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[72vh] xl:h-[75vh] overflow-hidden">
        <Image
          key={heroIndex}
          src={gallery[heroIndex]}
          alt={`${tour.title} - image ${heroIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-500"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-base-content/60 via-base-content/20 to-transparent" />

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {gallery.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setHeroIndex(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === heroIndex ? "bg-white" : "bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="badge badge-primary text-xs px-2">{tour.country}</span>
              <span className="badge badge-ghost text-xs px-2 bg-base-100/90">
                {tour.difficulty}
              </span>
            </div>
            <h1 className="max-w-3xl font-serif text-2xl font-bold text-white text-balance sm:text-3xl lg:text-4xl">
              {tour.title}
            </h1>
          </div>
        </div>
      </section>

      <section className="py-10 lg:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 min-w-0">
              <div className="flex flex-wrap gap-6 rounded-xl bg-base-200 p-5">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-base-content/60">Duration</p>
                    <p className="text-sm font-semibold">{tour.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-base-content/60">Destinations</p>
                    <p className="text-sm font-semibold">{tour.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-base-content/60">Group Size</p>
                    <p className="text-sm font-semibold">{tour.groupSize}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-base-content/60">Departing</p>
                    <p className="text-sm font-semibold">{tour.departing}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <div>
                    <p className="text-xs text-base-content/60">Rating</p>
                    <p className="text-sm font-semibold">
                      {tour.rating} ({tour.reviewCount} reviews)
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h2 className="font-serif text-2xl font-bold">Overview</h2>
                <p className="mt-4 leading-relaxed text-base-content/70">
                  {tour.longDescription}
                </p>
              </div>

              <div className="mt-10">
                <h2 className="font-serif text-2xl font-bold">Tour Highlights</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {tour.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-base-content/70">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>



              <div className="divider" />

              <div>
                <h2 className="font-serif text-2xl font-bold">
                  Day-by-Day Itinerary
                </h2>
                <div className="mt-6 join join-vertical w-full">
                  {tour.itinerary.map((day) => (
                    <div
                      key={day.day}
                      className="collapse collapse-arrow join-item border border-base-content/10 bg-base-100"
                    >
                      <input
                        type="radio"
                        name="itinerary"
                        defaultChecked={day.day === 1}
                      />
                      <div className="collapse-title flex items-center gap-4 font-medium">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content text-sm font-bold">
                          {day.day}
                        </span>
                        {day.title}
                      </div>
                      <div className="collapse-content">
                        <p className="pt-2 text-sm leading-relaxed text-base-content/70">
                          {day.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="divider" />

              <div className="rounded-xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
                <h3 className="mb-3 font-serif text-lg font-bold text-base-content">
                  Destinations
                </h3>
                <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                  <iframe
                    src="https://www.google.com/maps/d/embed?mid=1olCMk9JUep2A5solYEyNdncpmTjWUy0&ehbc=2E312F&noprof=1"
                    className="absolute inset-0 w-full h-full"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title="African Home Adventure Location"
                  />
                </div>
                <p className="mt-3 text-sm text-base-content/70">
                  Visit our office in Nairobi, Kenya
                </p>
              </div>

              <div className="divider" />

              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <h2 className="font-serif text-xl font-bold">
                    What&apos;s Included
                  </h2>
                  <ul className="mt-4 space-y-2.5">
                    {tour.included.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-base-content/70">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold">
                    What&apos;s Excluded
                  </h2>
                  <ul className="mt-4 space-y-2.5">
                    {tour.excluded.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                        <span className="text-base-content/70">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* REPLACED: Snap Carousel using tour.images */}
              {tour.image && tour.image.length > 1 && (
                <>
                  <div className="divider" />
                  <div>
                    <h2 className="font-serif text-2xl font-bold">Gallery</h2>
                    
                    {/* Snap Carousel Container */}
                    <div className="mt-4 relative">
                      <div 
                        ref={scrollRef}
                        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {tour.image.map((src, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setHeroIndex(i);
                              scrollToImage(i);
                            }}
                            className={`relative shrink-0 snap-start aspect-[4/3] w-64 sm:w-72 md:w-80 overflow-hidden rounded-lg focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all ${
                              i === heroIndex ? "ring-2 ring-primary ring-offset-2 scale-95" : "hover:scale-95"
                            }`}
                          >
                            <Image
                              src={src}
                              alt={`${tour.title} gallery ${i + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 256px, (max-width: 768px) 288px, 320px"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                      
                      {/* Scroll hint gradient */}
                      <div className="absolute right-0 top-0 bottom-4 bg-gradient-to-l from-base-100 to-transparent w-12 pointer-events-none" />
                    </div>
                    
                    {/* Dot indicators */}
                    <div className="mt-3 flex justify-center gap-2">
                      {tour.image.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => scrollToImage(i)}
                          className={`h-2 w-2 rounded-full transition-all ${
                            i === heroIndex ? "bg-primary w-4" : "bg-base-content/30 hover:bg-base-content/50"
                          }`}
                          aria-label={`Go to image ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <aside className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-base-content/10 bg-base-100 p-6 shadow-sm">
                <div className="mb-4">
                  <p className="text-xs text-base-content/60">From</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">${tour.price}</span>
                    {tour.originalPrice != null && (
                      <span className="text-lg text-base-content/50 line-through">
                        ${tour.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-base-content/60">per person</p>
                </div>

                {tour.originalPrice != null && (
                  <span className="badge badge-accent mb-4 px-2 border-none">
                    Save ${tour.originalPrice - tour.price} per person
                  </span>
                )}

                <Link
                  href={`/booking?tour=${tour.slug}`}
                  className="btn btn-primary btn-lg w-full gap-2"
                >
                  Book This Safari <ArrowRight className="h-4 w-4" />
                </Link>

                <Link href="/contact" className="btn btn-outline mt-3 w-full">
                  Get a Custom Quote
                </Link>

                <div className="divider" />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-base-content/70">
                    <Shield className="h-4 w-4 text-primary" />
                    KATO bonding scheme protection
                  </div>
                  <div className="flex items-center gap-2 text-base-content/70">
                    <Check className="h-4 w-4 text-primary" />
                    Free cancellation up to 30 days
                  </div>
                  <div className="flex items-center gap-2 text-base-content/70">
                    <Check className="h-4 w-4 text-primary" />
                    Private tour — fully customizable
                  </div>
                </div>

                <div className="divider" />

                <div className="text-center">
                  <p className="mb-2 text-xs text-base-content/60">
                    Need help planning?
                  </p>
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

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
          `Hi, I'm interested in the ${tour.title}. Can you help me with more details?`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </>
  );
}