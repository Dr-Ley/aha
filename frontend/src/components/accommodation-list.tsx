// components/accommodation-list.tsx
"use client";

import { accommodations } from "@/lib/data";
import { AccommodationFilters } from "@/components/accommodation-filters";

interface AccommodationListProps {
  initialFilter?: "all" | "lodge" | "tented-camp" | "luxury-cottage";
}

export function AccommodationList({ 
  initialFilter = "all"
}: AccommodationListProps) {
  return (
    <AccommodationFilters 
      accommodations={accommodations} 
    />
  );
}