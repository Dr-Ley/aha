"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TourCard } from "@/components/tour-card"
import type { Tour } from "@/lib/data"

const countries = ["All", "Kenya", "Tanzania", "Kenya & Tanzania"]
const durations = ["All", "1-3 Days", "4-5 Days", "6+ Days"]
const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "duration-asc", label: "Duration: Short to Long" },
  { value: "rating", label: "Highest Rated" },
]

export function TourFilters({ tours }: { tours: Tour[] }) {
  const searchParams = useSearchParams()
  const initialCountry = searchParams.get("country") || "All"

  const [search, setSearch] = useState("")
  const [country, setCountry] = useState(initialCountry)
  const [duration, setDuration] = useState("All")
  const [sort, setSort] = useState("featured")
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    let result = [...tours]

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
    }

    // Country
    if (country !== "All") {
      result = result.filter((t) => t.country === country)
    }

    // Duration
    if (duration !== "All") {
      if (duration === "1-3 Days") result = result.filter((t) => t.days <= 3)
      else if (duration === "4-5 Days") result = result.filter((t) => t.days >= 4 && t.days <= 5)
      else if (duration === "6+ Days") result = result.filter((t) => t.days >= 6)
    }

    // Sort
    switch (sort) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        result.sort((a, b) => b.price - a.price)
        break
      case "duration-asc":
        result.sort((a, b) => a.days - b.days)
        break
      case "rating":
        result.sort((a, b) => b.rating - a.rating)
        break
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }

    return result
  }, [tours, search, country, duration, sort])

  const activeFilters = [country, duration].filter((f) => f !== "All").length

  function clearFilters() {
    setSearch("")
    setCountry("All")
    setDuration("All")
    setSort("featured")
  }

  return (
    <div>
      {/* Search & Filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search safaris..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {activeFilters > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {activeFilters}
              </Badge>
            )}
          </Button>
          <div className="hidden sm:flex items-center gap-3">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "All" ? "All Countries" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                {durations.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d === "All" ? "All Durations" : d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="hidden sm:flex">
              <X className="mr-1 h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Mobile filter panel */}
      {showFilters && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:hidden">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "All" ? "All Countries" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              {durations.map((d) => (
                <SelectItem key={d} value={d}>
                  {d === "All" ? "All Durations" : d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3.5 w-3.5" /> Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="mt-6 text-sm text-muted-foreground">
        Showing {filtered.length} {filtered.length === 1 ? "safari" : "safaris"}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center py-16">
          <p className="text-lg font-serif font-semibold text-foreground">No safaris found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search or filters.
          </p>
          <Button variant="outline" className="mt-4" onClick={clearFilters}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  )
}
