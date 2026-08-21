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
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Shield,
  Phone,
  MessageCircle,
} from "lucide-react";
import type { Tour } from "@/lib/data";
import { useCurrency } from "@/lib/currency-context"
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "254722760661";

const KNOWN_PLACES: { name: string; query: string; lat: number; lng: number }[] = [
  { name: "Nairobi", query: "Nairobi, Kenya", lat: -1.2864, lng: 36.8172 },
  { name: "Masai Mara", query: "Masai Mara National Reserve, Kenya", lat: -1.5021, lng: 35.1440 },
  { name: "Maasai Mara", query: "Masai Mara National Reserve, Kenya", lat: -1.5021, lng: 35.1440 },
  { name: "Amboseli", query: "Amboseli National Park, Kenya", lat: -2.6527, lng: 37.2606 },
  { name: "Lake Nakuru", query: "Lake Nakuru National Park, Kenya", lat: -0.3667, lng: 36.0880 },
  { name: "Nakuru", query: "Lake Nakuru National Park, Kenya", lat: -0.3667, lng: 36.0880 },
  { name: "Lake Naivasha", query: "Lake Naivasha, Kenya", lat: -0.7667, lng: 36.3500 },
  { name: "Naivasha", query: "Lake Naivasha, Kenya", lat: -0.7667, lng: 36.3500 },
  { name: "Tsavo West", query: "Tsavo West National Park, Kenya", lat: -3.0200, lng: 38.0000 },
  { name: "Tsavo East", query: "Tsavo East National Park, Kenya", lat: -2.9667, lng: 38.7667 },
  { name: "Mombasa", query: "Mombasa, Kenya", lat: -4.0435, lng: 39.6682 },
  { name: "Serengeti", query: "Serengeti National Park, Tanzania", lat: -2.3333, lng: 34.8333 },
  { name: "Ngorongoro", query: "Ngorongoro Crater, Tanzania", lat: -3.2000, lng: 35.5833 },
  { name: "Arusha", query: "Arusha, Tanzania", lat: -3.3869, lng: 36.6830 },
  { name: "Lake Manyara", query: "Lake Manyara National Park, Tanzania", lat: -3.6167, lng: 35.8167 },
  { name: "Kilimanjaro", query: "Mount Kilimanjaro, Tanzania", lat: -3.0674, lng: 37.3556 },
  { name: "Samburu", query: "Samburu National Reserve, Kenya", lat: 0.6167, lng: 37.5333 },
  { name: "Ol Pejeta", query: "Ol Pejeta Conservancy, Kenya", lat: -0.0167, lng: 36.9167 },
  { name: "Aberdares", query: "Aberdare National Park, Kenya", lat: -0.4000, lng: 36.7000 },
  { name: "Diani", query: "Diani Beach, Kenya", lat: -4.3167, lng: 39.5833 },
  { name: "Zanzibar", query: "Zanzibar, Tanzania", lat: -6.1659, lng: 39.1989 },
  { name: "Tarangire", query: "Tarangire National Park, Tanzania", lat: -4.0167, lng: 36.0167 },
  { name: "Great Rift Valley", query: "Great Rift Valley, Kenya", lat: -0.5000, lng: 36.2000 },
  { name: "Mzima Springs", query: "Mzima Springs, Tsavo West, Kenya", lat: -2.9833, lng: 38.0333 },
  { name: "Galana River", query: "Galana River, Tsavo East, Kenya", lat: -2.8500, lng: 38.9000 },
];

function extractTourDestinations(tour: Tour): string[] {
  const allText = [
    tour.destination,
    // tour.description,
    // tour.longDescription,
    // ...tour.highlights,
    ...tour.itinerary.map((d) => `${d.title} ${d.description}`),
  ].join(" ");

  const seen = new Set<string>();
  const ordered: string[] = [];

  const itineraryText = tour.itinerary.map((d) => `${d.title} ${d.description}`).join(" ");

  for (const place of KNOWN_PLACES) {
    const regex = new RegExp(`\\b${place.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(allText) && !seen.has(place.query)) {
      seen.add(place.query);
      ordered.push(place.query);
    }
  }

  // Reorder based on first appearance in itinerary
  ordered.sort((a, b) => {
    const nameA = KNOWN_PLACES.find((p) => p.query === a)!.name;
    const nameB = KNOWN_PLACES.find((p) => p.query === b)!.name;
    const idxA = itineraryText.search(new RegExp(`\\b${nameA.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"));
    const idxB = itineraryText.search(new RegExp(`\\b${nameB.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"));
    return (idxA === -1 ? 9999 : idxA) - (idxB === -1 ? 9999 : idxB);
  });

  return ordered;
}

function TourMap({ tour }: { tour: Tour }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const destinations = extractTourDestinations(tour);
    const coords = destinations
      .map((d) => KNOWN_PLACES.find((p) => p.query === d))
      .filter((p): p is (typeof KNOWN_PLACES)[number] => p != null);

    if (coords.length === 0) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as unknown as { L: any }).L;
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, { scrollWheelZoom: false });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const bounds = L.latLngBounds([]);
      coords.forEach((place) => {
        const marker = L.marker([place.lat, place.lng]).addTo(map);
        marker.bindPopup(`<b>${place.name}</b>`);
        bounds.extend([place.lat, place.lng]);
      });

      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [tour]);

  return <div ref={mapRef} className="h-full w-full rounded-lg" />;
}

export function TourDetail({ tour }: { tour: Tour }) {
  const { formatPrice } = useCurrency()
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
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showMobileCTA, setShowMobileCTA] = useState(true);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
  
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When real CTA is visible → hide mobile sticky
        setShowMobileCTA(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.1,
      }
    );
  
    observer.observe(el);
  
    return () => observer.disconnect();
  }, []);

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
        <div className="absolute inset-0 bg-linear-to-t from-base-content/60 via-base-content/20 to-transparent" />

        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setHeroIndex((heroIndex - 1 + gallery.length) % gallery.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setHeroIndex((heroIndex + 1) % gallery.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

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
              <span className="badge badge-primary text-xs px-2">{tour.countries}</span>
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

              <section aria-labelledby="itinerary-heading">
                <h2 id="itinerary-heading" className="font-serif text-2xl font-bold">
                  Day-by-Day Itinerary
                </h2>
                <ol className="mt-6 join join-vertical w-full list-none p-0">
                  {tour.itinerary.map((day) => (
                    <li
                      key={day.day}
                      className="collapse collapse-arrow join-item border border-base-content/10 bg-base-100"
                    >
                      <input
                        type="radio"
                        name="itinerary"
                        defaultChecked={day.day === 1}
                      />
                      <h3 className="collapse-title flex items-center gap-4 font-medium">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content text-sm font-bold">
                          {day.day}
                        </span>
                        {day.title}
                        <time dateTime="P1D" className="sr-only">
                          1 day
                        </time>
                      </h3>
                      <div className="collapse-content">
                        <p className="pt-2 text-sm leading-relaxed text-base-content/70">
                          {day.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <div className="divider" />

              <div className="rounded-xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
                <h3 className="mb-3 font-serif text-lg font-bold text-base-content">
                  Destinations
                </h3>
                <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                  <TourMap tour={tour} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {extractTourDestinations(tour).map((dest) => (
                    <span key={dest} className="badge badge-ghost badge-sm">
                      {KNOWN_PLACES.find((p) => p.query === dest)?.name ?? dest}
                    </span>
                  ))}
                </div>
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

              {gallery.length > 1 && (
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
                        {gallery.map((src, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setHeroIndex(i);
                              scrollToImage(i);
                            }}
                            className={`relative shrink-0 snap-start aspect-4/3 w-64 sm:w-72 md:w-80 overflow-hidden rounded-lg focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all ${
                              i === heroIndex ? "ring-inset ring-offset-emerald-700 ring-offset-5 scale-95" : "hover:scale-95"
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
                      <div className="absolute right-0 top-0 bottom-4 bg-linear-to-l from-base-100 to-transparent w-12 pointer-events-none" />
                    </div>
                    
                    {/* Dot indicators */}
                    <div className="mt-3 flex justify-center gap-2">
                      {gallery.map((_, i) => (
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
                    <span className="text-3xl font-bold">{formatPrice(tour.price)}</span>
                    {tour.originalPrice != null && (
                      <span className="text-lg text-base-content/50 line-through">
                        {formatPrice(tour.originalPrice)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-base-content/60">per person</p>
                </div>

                {tour.originalPrice != null && tour.originalPrice > tour.price && (
                  <span className="badge badge-accent mb-4 px-2 border-none">
                    Save {formatPrice(tour.originalPrice - tour.price)} per person
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
                    href="tel:+254722760661,tel:+254793852450"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" /> +254 722 760 661 / +254 793 852 450
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
        className="fixed bottom-18 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
      {showMobileCTA && (
  <div
  className={cn(
    "fixed bottom-0 left-0 right-0 z-40 px-4 md:hidden transition-all duration-300",
    showMobileCTA ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
  )}
> <div ref={ctaRef}>
    <div className="flex gap-3 rounded-xl border border-base-content/10 bg-base-100/90 backdrop-blur p-3 shadow-lg">
      <Link href={`/booking?tour=${tour.slug}`} className="btn btn-primary flex-1">
        Book Safari
      </Link>
      <Link href="/contact" className="btn btn-outline flex-1">
        Custom Quote
      </Link>
    </div>
  </div></div>
)}
      
    </>
    
  );
}