"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { TourCard } from "@/components/tour-card";
import type { Tour } from "@/lib/data";
import { destinations } from "@/lib/data";
import { Container, Section } from "@/components/layout";
import Link from "next/link";

interface DestinationsCarouselProps {
  selectedDestination?: string | null;
  onDestinationClick?: (destination: string) => void;
}

export function DestinationsCarousel({ 
  selectedDestination, 
  onDestinationClick 
}: DestinationsCarouselProps) {
  // Reorder destinations to put selected one first
  const orderedDestinations = useMemo(() => {
    if (!selectedDestination) return destinations;
    
    const selected = destinations.find(d => d.name === selectedDestination);
    const others = destinations.filter(d => d.name !== selectedDestination);
    
    return selected ? [selected, ...others] : destinations;
  }, [selectedDestination]);

  const handleClick = (e: React.MouseEvent, destinationName: string) => {
    if (onDestinationClick) {
      e.preventDefault();
      onDestinationClick(destinationName);
    }
  };

  return (
    <Section spacing="none" className="-mt-18">
      {/* <Container className="px-0"> */}
        <h2 className="-mt-15 font-serif text-2xl font-bold text-center text-base-content text-balance sm:text-2xl">
          Popular Destinations
        </h2>
        <div className="mt-8 overflow-x-auto mb-8 pb-2 scrollbar-thin">
          <div className="flex gap-4 pb-2 sm:justify-start">
            {orderedDestinations.map((d) => {
              const isSelected = d.name === selectedDestination;
              
              return (
                <Link
                  key={`${d.name}-${d.country}`}
                  href={`/tours?destination=${encodeURIComponent(d.name)}`}
                  onClick={(e) => handleClick(e, d.name)}
                  className={`group relative flex min-w-[140px] h-[150px] flex-col items-center justify-center rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-lg ${
                    isSelected ? 'ring-inset ring-offset-amber-300 ring-offset-5' : ''
                  }`}
                  style={{
                    backgroundImage: `url(${d.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Dark gradient overlay for text readability */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/70 group-hover:via-black/30 transition-all ${
                    isSelected ? 'from-black/60 via-black/30' : ''
                  }`} />
                  
                  {/* Selected indicator */}
                  {/* {isSelected && (
                    <div className="absolute top-2 right-2 z-20">
                      <div className="badge badge-primary badge-sm">Selected</div>
                    </div>
                  )} */}
                  
                  {/* Text content positioned at bottom */}
                  <div className="relative z-10 flex flex-col items-center mt-auto mb-4">
                    <span className="font-serif text-lg font-semibold text-white drop-shadow-lg">
                      {d.name}
                    </span>
                    <span className="text-xs text-white/80 drop-shadow-md">{d.country}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      {/* </Container> */}
    </Section>
  );
}

const ITEMS_PER_PAGE = 6;
const countries = ["All", "Kenya", "Tanzania", "Kenya & Tanzania"];
const durations = ["All", "1-3 Days", "4-5 Days", "6+ Days"];
const sortOptions: { value: string; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "duration-asc", label: "Duration: Short to Long" },
  { value: "rating", label: "Highest Rated" },
];

// Price tiers
const TIERS = {
  budget: { max: 800, label: "Budget" },
  luxury: { min: 2000, label: "Luxury" },
  mid: { min: 800, max: 2000, label: "Mid-range" },
};

export function TourFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All");
  const [duration, setDuration] = useState("All");
  const [sort, setSort] = useState("featured");
  const [tier, setTier] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  // Scroll ref for the scrollable row
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Approximate card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    async function fetchTours() {
      try {
        const res = await fetch("/api/tours");
        const data = (await res.json()) as Tour[];
        setTours(data);
      } finally {
        setLoading(false);
      }
    }
    fetchTours();
  }, []);

  // Read URL params on mount
  useEffect(() => {
    const urlCountry = searchParams.get("country");
    const urlDuration = searchParams.get("duration");
    const urlTier = searchParams.get("tier");
    const urlType = searchParams.get("type");
    const urlSort = searchParams.get("sort");
    const urlDestination = searchParams.get("destination");

    // Check if any category filter is present in URL
    const hasCategoryFilter = urlCountry || urlTier || urlType || urlDuration || urlDestination;

    if (hasCategoryFilter) {
      // CLEAR ALL existing filters first
      setSearch("");
      setCountry("All");
      setDuration("All");
      setTier(null);
      setType(null);
      setDestination(null);
      setPage(1);
      // Keep existing sort or use URL sort
      setSort(urlSort || "featured");

      // Apply ONLY the URL filter
      if (urlCountry) setCountry(urlCountry);
      if (urlDuration) {
        if (urlDuration === "day") setDuration("1 Day");
        else setDuration(urlDuration);
      }
      if (urlTier) setTier(urlTier);
      if (urlType) setType(urlType);
      if (urlDestination) setDestination(urlDestination);
    } else {
      // No category filters in URL, just update sort if present
      if (urlSort) setSort(urlSort);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    let result = [...tours];

    // Destination filter (from carousel click) - substring search
    if (destination) {
      const destLower = destination.toLowerCase();
      result = result.filter((t) => 
        t.destination.toLowerCase().includes(destLower) ||
        t.title.toLowerCase().includes(destLower) ||
        t.description.toLowerCase().includes(destLower)
      );
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    // Country filter (from dropdown or URL)
    if (country !== "All") {
      if (country === "Kenya & Tanzania") {
        // Must have BOTH Kenya AND Tanzania
        result = result.filter((t) => 
          t.countries.includes("Kenya") && t.countries.includes("Tanzania")
        );
      } else {
        // Must include the specific country (could be single or multiple)
        result = result.filter((t) => t.countries.includes(country as "Kenya" | "Tanzania"));
      }
    }

    // Duration filter
    if (duration !== "All") {
      if (duration === "1-3 Days") result = result.filter((t) => t.days <= 3);
      else if (duration === "4-5 Days") result = result.filter((t) => t.days >= 4 && t.days <= 5);
      else if (duration === "6+ Days") result = result.filter((t) => t.days >= 6);
      else if (duration === "1 Day") result = result.filter((t) => t.days === 1);
    }

    // Price tier filter (from URL: ?tier=budget|luxury)
    if (tier) {
      if (tier === "budget") {
        result = result.filter((t) => t.price <= TIERS.budget.max);
      } else if (tier === "luxury") {
        result = result.filter((t) => t.price >= TIERS.luxury.min);
      } else if (tier === "mid") {
        result = result.filter((t) => t.price > TIERS.mid.min && t.price < TIERS.mid.max);
      }
    }

    // Type filter (from URL: ?type=kilimanjaro|beach)
    if (type) {
      const q = type.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.highlights.some((h) => h.toLowerCase().includes(q))
      );
    }

    // Sorting
    switch (sort) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "duration-asc":
        result.sort((a, b) => a.days - b.days);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [tours, search, country, duration, sort, tier, type, destination]);

  if (loading && !tours.length) {
    return (
      <div className="py-10 text-center text-base-content/60">
        Loading tours...
      </div>
    );
  }

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activeFilters = [
    country !== "All" ? country : null,
    duration !== "All" ? duration : null,
    tier ? `${TIERS[tier as keyof typeof TIERS]?.label || tier} Safaris` : null,
    type ? type.charAt(0).toUpperCase() + type.slice(1) : null,
    destination ? destination : null,
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setCountry("All");
    setDuration("All");
    setSort("featured");
    setTier(null);
    setType(null);
    setDestination(null);
    setPage(1);
    router.push(pathname);
  }

  // Update URL when filters change (optional - for shareable links)
  const updateUrl = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Handle destination click from carousel
  const handleDestinationClick = (destinationName: string) => {
    setDestination(destinationName);
    updateUrl("destination", destinationName);
    setPage(1);
    // Clear other filters when destination is selected
    setSearch("");
    setCountry("All");
    setDuration("All");
    setTier(null);
    setType(null);
  };

  return (
    <div>
      {/* Destination Carousel */}
      <DestinationsCarousel 
        selectedDestination={destination}
        onDestinationClick={handleDestinationClick}
      />
        {/* <div className="sticky top-15 py-3 bg-base-100 z-30"> */}
          {/* Active filter badges */}
          {(country !== "All" || duration !== "All" || tier || type || destination) && (
      
          <div className="mb-4 flex flex-wrap gap-2">
            {destination && (
              <span className="badge badge-primary gap-2 px-2">
                {destination}
                <button onClick={() => { setDestination(null); updateUrl("destination", null); }} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {country !== "All" && (
              <span className="badge badge-primary gap-2 px-2">
                {country}
                <button onClick={() => { setCountry("All"); updateUrl("country", null); }} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {duration !== "All" && (
              <span className="badge badge-primary gap-2 px-2">
                {duration}
                <button onClick={() => { setDuration("All"); updateUrl("duration", null); }} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {tier && (
              <span className="badge badge-primary gap-2 px-2">
                {TIERS[tier as keyof typeof TIERS]?.label} Safaris
                <button onClick={() => { setTier(null); updateUrl("tier", null); }} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {type && (
              <span className="badge badge-primary gap-2 px-2">
                {type.charAt(0).toUpperCase() + type.slice(1)}
                <button onClick={() => { setType(null); updateUrl("type", null); }} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50" />
            <input
              type="search"
              placeholder="Search safaris..."
              value={search}
              style={{ outline: "1px solid gray" }}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input input-bordered w-full pl-9"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline btn-sm sm:hidden gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilters > 0 && (
                <span className="badge badge-primary px-1 badge-sm">{activeFilters}</span>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-3">
              <select
                value={country}
                style={{ outline: "1px solid gray" }}
                onChange={(e) => {
                  setCountry(e.target.value);
                  updateUrl("country", e.target.value === "All" ? null : e.target.value);
                  setPage(1);
                }}
                className="select select-bordered w-44"
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Countries" : c}
                  </option>
                ))}
              </select>
              <select
                value={duration}
                style={{ outline: "1px solid gray" }}
                onChange={(e) => {
                  setDuration(e.target.value);
                  setPage(1);
                }}
                className="select select-bordered w-36"
              >
                {durations.map((d) => (
                  <option key={d} value={d}>
                    {d === "All" ? "All Durations" : d}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                style={{ outline: "1px solid gray" }}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="select select-bordered w-48"
              >
                {sortOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                style={{ outline: "1px solid gray" }}
                className="btn btn-ghost btn-sm hidden sm:flex gap-1"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </div>
        {/* </div> */}

      {showFilters && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-base-content/10 bg-base-100 p-4 sm:hidden">
          <select
            value={country}
            style={{ outline: "1px solid gray" }}
            onChange={(e) => {
              setCountry(e.target.value);
              setPage(1);
            }}
            className="select select-bordered"
          >
            {countries.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Countries" : c}</option>
            ))}
          </select>
          <select
            value={duration}
            style={{ outline: "1px solid gray" }}
            onChange={(e) => {
              setDuration(e.target.value);
              setPage(1);
            }}
            className="select select-bordered"
          >
            {durations.map((d) => (
              <option key={d} value={d}>{d === "All" ? "All Durations" : d}</option>
            ))}
          </select>
          <select
            value={sort}
            style={{ outline: "1px solid gray" }}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="select select-bordered"
          >
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {activeFilters > 0 && (
            <button type="button" onClick={clearFilters} className="btn btn-ghost btn-sm gap-1">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>
      )}

      <p className="mt-6 text-sm text-base-content/60">
        Showing {filtered.length} {filtered.length === 1 ? "safari" : "safaris"}
      </p>
      <div className="text-center text-sm mt-5 text-base-content/50 md:hidden lg:hidden">
        ← Tap to play →
      </div>
      <div className="text-center text-sm mt-5 text-base-content/50 hidden md:block">
        ← Hover to play →
      </div>

      {filtered.length > 0 ? (
        <>
          {/* Scrollable row for tours */}
          <div className="mt-6 relative">
            {/* Navigation arrows */}
            <button
              onClick={() => scroll('left')}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm bg-base-100 shadow-md hover:bg-base-200 hidden md:flex"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => scroll('right')}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm bg-base-100 shadow-md hover:bg-base-200 hidden md:flex"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Mobile scroll hint */}


            {/* Scrollable container */}
            <div 
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {filtered.map((tour) => (
                <div 
                  key={tour.id} 
                  className="shrink-0 snap-start w-72 sm:w-80"
                >
                  <TourCard tour={tour} />
                </div>
              ))}
            </div>
            <div className="md:hidden mb-2 mt-2 text-center text-sm text-base-content/50">
              ← Swipe to explore →
            </div>
          </div>

          {/* Pagination (optional - can be removed if using infinite scroll style) */}
          {/* {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-outline btn-sm gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="px-4 text-sm text-base-content/70">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-outline btn-sm gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )} */}
        </>
      ) : (
        <div className="mt-12 py-16 text-center">
          <p className="font-serif text-lg font-semibold text-base-content">No safaris found</p>
          <p className="mt-2 text-sm text-base-content/60">Try adjusting your search or filters.</p>
          <button type="button" onClick={clearFilters} className="btn btn-outline mt-4">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}