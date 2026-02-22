"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { TourCard } from "@/components/tour-card";
import type { Tour } from "@/lib/data";

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

export function TourFilters({ tours }: { tours: Tour[] }) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All");
  const [duration, setDuration] = useState("All");
  const [sort, setSort] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...tours];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    if (country !== "All") result = result.filter((t) => t.country === country);
    if (duration !== "All") {
      if (duration === "1-3 Days") result = result.filter((t) => t.days <= 3);
      else if (duration === "4-5 Days") result = result.filter((t) => t.days >= 4 && t.days <= 5);
      else if (duration === "6+ Days") result = result.filter((t) => t.days >= 6);
    }
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
  }, [tours, search, country, duration, sort]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activeFilters = [country, duration].filter((f) => f !== "All").length;

  function clearFilters() {
    setSearch("");
    setCountry("All");
    setDuration("All");
    setSort("featured");
    setPage(1);
  }

  return (
    <div>
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
              <span className="badge badge-primary badge-sm h-4 w-4">{activeFilters}</span>
            )}
          </button>
          <div className="hidden sm:flex items-center gap-3">
            <select
              value={country}
              style={{ outline: "1px solid gray" }}
              onChange={(e) => {
                setCountry(e.target.value);
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
              className="btn btn-ghost btn-sm hidden sm:flex gap-1"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-base-content/10 bg-base-100 p-4 sm:hidden">
          <select
            value={country}
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

      {filtered.length > 0 ? (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>

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
