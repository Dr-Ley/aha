// components/accommodation-filters.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Star,
  DollarSign,
  Home,
  Tent,
  Castle
} from "lucide-react";
import { AccommodationCard } from "@/components/accommodation-card";
import type { Accomodations } from "@/lib/data";

const ITEMS_PER_PAGE = 6;

// Filter options
const countries = ["All", "Kenya", "Tanzania"];
const types = [
  { value: "all", label: "All Types", icon: Home },
  { value: "lodge", label: "Safari Lodges", icon: Castle },
  { value: "tented-camp", label: "Tented Camps", icon: Tent },
];
const priceRanges = [
  { value: "all", label: "All Prices", min: 0, max: Infinity },
  { value: "budget", label: "Budget ($0-200)", min: 0, max: 200 },
  { value: "mid", label: "Mid-Range ($200-400)", min: 200, max: 400 },
  { value: "luxury", label: "Luxury ($400+)", min: 400, max: Infinity },
];
const amenitiesList = [
  "Wi-Fi",
  "Swimming Pool",
  "Private Pool",
  "Spa",
  "Restaurant & Bar",
  "Game Drives",
  "Airport Transfer",
];

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A-Z" },
];

interface AccommodationFiltersProps {
  accommodations: Accomodations[];
}

export function AccommodationFilters({ accommodations }: AccommodationFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filter states
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All");
  const [type, setType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sort, setSort] = useState("recommended");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Read URL params on mount
  useEffect(() => {
    const urlCountry = searchParams.get("country");
    const urlType = searchParams.get("type");
    const urlPrice = searchParams.get("price");
    const urlAmenities = searchParams.get("amenities");
    const urlSort = searchParams.get("sort");

    const hasUrlFilter = urlCountry || urlType || urlPrice;

    if (hasUrlFilter) {
      // Clear existing and apply URL filters
      setSearch("");
      setCountry(urlCountry || "All");
      setType(urlType || "all");
      setPriceRange(urlPrice || "all");
      setSelectedAmenities(urlAmenities ? urlAmenities.split(",") : []);
      setSort(urlSort || "recommended");
      setPage(1);
    } else if (urlSort) {
      setSort(urlSort);
    }
  }, [searchParams]);

  // Filter logic
  const filtered = useMemo(() => {
    let result = [...accommodations];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }

    // Country filter
    if (country !== "All") {
      result = result.filter((a) => a.country === country);
    }

    // Type filter
    if (type !== "all") {
      result = result.filter((a) => a.type === type);
    }

    // Price range filter
    if (priceRange !== "all") {
      const range = priceRanges.find((r) => r.value === priceRange);
      if (range) {
        result = result.filter(
          (a) => a.priceFrom >= range.min && a.priceFrom <= range.max
        );
      }
    }

    // Amenities filter (must have ALL selected amenities)
    if (selectedAmenities.length > 0) {
      result = result.filter((a) =>
        selectedAmenities.every((amenity) => a.amenities.includes(amenity))
      );
    }

    // Sorting
    switch (sort) {
      case "price-asc":
        result.sort((a, b) => a.priceFrom - b.priceFrom);
        break;
      case "price-desc":
        result.sort((a, b) => b.priceFrom - a.priceFrom);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Recommended: recommended first, then by price
        result.sort((a, b) => {
          if (a.recommended && !b.recommended) return -1;
          if (!a.recommended && b.recommended) return 1;
          return a.priceFrom - b.priceFrom;
        });
    }

    return result;
  }, [accommodations, search, country, type, priceRange, selectedAmenities, sort]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Active filters count
  const activeFilters = [
    country !== "All",
    type !== "all",
    priceRange !== "all",
    selectedAmenities.length > 0,
  ].filter(Boolean).length;

  // Toggle amenity selection
  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
    setPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setCountry("All");
    setType("all");
    setPriceRange("all");
    setSelectedAmenities([]);
    setSort("recommended");
    setPage(1);
    router.push(pathname);
  };

  // Update URL
  const updateUrl = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      {/* Active filter badges */}
      {(country !== "All" || type !== "all" || priceRange !== "all" || selectedAmenities.length > 0) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {country !== "All" && (
            <span className="badge badge-primary gap-2 px-3 py-2">
              <MapPin className="h-3 w-3" />
              {country}
              <button 
                onClick={() => { setCountry("All"); updateUrl("country", null); }}
                className="ml-1 hover:text-primary-content/80"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {type !== "all" && (
            <span className="badge badge-primary gap-2 px-3 py-2">
              {types.find(t => t.value === type)?.label}
              <button 
                onClick={() => { setType("all"); updateUrl("type", null); }}
                className="ml-1 hover:text-primary-content/80"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {priceRange !== "all" && (
            <span className="badge badge-primary gap-2 px-3 py-2">
              <DollarSign className="h-3 w-3" />
              {priceRanges.find(p => p.value === priceRange)?.label}
              <button 
                onClick={() => { setPriceRange("all"); updateUrl("price", null); }}
                className="ml-1 hover:text-primary-content/80"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedAmenities.map((amenity) => (
            <span key={amenity} className="badge badge-secondary gap-2 px-3 py-2">
              {amenity}
              <button 
                onClick={() => toggleAmenity(amenity)}
                className="ml-1 hover:text-secondary-content/80"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button 
            onClick={clearFilters}
            className="btn btn-ghost btn-xs gap-1"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        </div>
      )}

      {/* Search and filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50" />
          <input
            type="search"
            placeholder="Search accommodations..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input input-bordered w-full pl-10 focus:outline-primary"
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
              <span className="badge badge-primary badge-sm">{activeFilters}</span>
            )}
          </button>
          
          <div className="hidden sm:flex items-center gap-3">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="select select-bordered select-sm w-40"
            >
              {sortOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop filter buttons */}
      <div className="hidden sm:block mt-6 space-y-4">
        {/* Type filter buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-base-content/70 mr-2 py-2">Type:</span>
          {types.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => {
                  setType(t.value);
                  updateUrl("type", t.value === "all" ? null : t.value);
                  setPage(1);
                }}
                className={`btn btn-sm gap-2 ${
                  type === t.value 
                    ? "btn-primary" 
                    : "btn-outline"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Country filter buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-base-content/70 mr-2 py-2">Country:</span>
          {countries.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCountry(c);
                updateUrl("country", c === "All" ? null : c);
                setPage(1);
              }}
              className={`btn btn-sm ${
                country === c 
                  ? "btn-primary" 
                  : "btn-outline"
              }`}
            >
              {c === "All" ? "All Countries" : c}
            </button>
          ))}
        </div>

        {/* Price range buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-base-content/70 mr-2 py-2">Price:</span>
          {priceRanges.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                setPriceRange(p.value);
                updateUrl("price", p.value === "all" ? null : p.value);
                setPage(1);
              }}
              className={`btn btn-sm ${
                priceRange === p.value 
                  ? "btn-primary" 
                  : "btn-outline"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Amenities filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-base-content/70 mr-2 py-2">Amenities:</span>
          {amenitiesList.map((amenity) => (
            <button
              key={amenity}
              onClick={() => toggleAmenity(amenity)}
              className={`btn btn-sm ${
                selectedAmenities.includes(amenity)
                  ? "btn-secondary"
                  : "btn-outline"
              }`}
            >
              {amenity}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile filter panel */}
      {showFilters && (
        <div className="mt-4 flex flex-col gap-4 rounded-xl border border-base-content/10 bg-base-100 p-4 sm:hidden">
          {/* Type select */}
          <div>
            <label className="label label-text text-xs font-semibold uppercase">Type</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {types.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`btn btn-sm flex-1 ${
                    type === t.value ? "btn-primary" : "btn-outline"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Country select */}
          <div>
            <label className="label label-text text-xs font-semibold uppercase">Country</label>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setPage(1);
              }}
              className="select select-bordered w-full mt-1"
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Countries" : c}
                </option>
              ))}
            </select>
          </div>

          {/* Price select */}
          <div>
            <label className="label label-text text-xs font-semibold uppercase">Price Range</label>
            <select
              value={priceRange}
              onChange={(e) => {
                setPriceRange(e.target.value);
                setPage(1);
              }}
              className="select select-bordered w-full mt-1"
            >
              {priceRanges.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amenities checkboxes */}
          <div>
            <label className="label label-text text-xs font-semibold uppercase">Amenities</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {amenitiesList.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                  <span className="text-sm">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="label label-text text-xs font-semibold uppercase">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="select select-bordered w-full mt-1"
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
              className="btn btn-ghost btn-sm gap-2 mt-2"
            >
              <X className="h-4 w-4" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="mt-6 text-sm text-base-content/60">
        Showing {filtered.length} {filtered.length === 1 ? "property" : "properties"}
      </p>

      {/* Results grid */}
      {filtered.length > 0 ? (
        <>
          {/* <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"> */}
            {paginated.map((accommodation) => (
              <AccommodationCard 
                key={accommodation.id} 
                accommodation={accommodation}
                variant="horizontal"
              />
            ))}
          {/* </div> */}

          {/* Pagination */}
          {totalPages > 1 && (
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
          )}
        </>
      ) : (
        <div className="mt-12 py-16 text-center">
          <p className="font-serif text-lg font-semibold text-base-content">
            No accommodations found
          </p>
          <p className="mt-2 text-sm text-base-content/60">
            Try adjusting your search or filters.
          </p>
          <button 
            type="button" 
            onClick={clearFilters} 
            className="btn btn-outline mt-4"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}