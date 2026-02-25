"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  MapPin,
  Star,
  ArrowRight,
  Wifi,
  Waves,           // Swimming Pool
  UtensilsCrossed, // Restaurant
  Bath,            // Ensuite/Spa
  Zap,             // Power/24h
  Wine,            // Bar
  Flower2,         // Garden/Spa
  User,            // Guided walks/Butler
  Flame,           // Fireplace
  Gift,            // Gift shop
  Plane,           // Airport transfer
  Coffee,          // Breakfast
  ChevronRight,
  Check,
  Car,             // Parking
  Dumbbell,        // Gym
  Baby,            // Kids playground
  Binoculars,      // Boardwalk/Views
} from "lucide-react";
import type { Accomodations } from "@/lib/data";
import { useCurrency } from "@/lib/currency-context"

// Icon mapping in the COMPONENT (not data file)
const amenityIcons: Record<string, React.ElementType> = {
  "WiFi": Wifi,
  "Swimming Pool": Waves,
  "Private Pool": Waves,
  "Restaurant": UtensilsCrossed,
  "Bar": Wine,
  "Ensuite Tents": Bath,
  "Ensuite Bathroom": Bath,
  "Spa": Flower2,
  "Spa & Gym": Dumbbell,
  "Hot Shower": Bath,
  "24h Power": Zap,
  "Parking": Car,
  "Mini Golf": User,
  "Organic Garden": Flower2,
  "Balcony Views": Binoculars,
  "Hippo Boardwalk": Binoculars,
  "Kids Playground": Baby,
  "Airport Transfer": Plane,
  "Breakfast Included": Coffee,
  "Fireplace": Flame,
  "Gift Shop": Gift,
  "Guided Walks": User,
  "Butler Service": User,
  "Personal Chef": UtensilsCrossed,
  "Garden": Flower2,
  "Private Terrace": Flower2,
  "Laundry": Flower2,
  "Game Drives": User,
};

interface AccommodationCardProps {
  accommodation: Accomodations;
  variant?: "default" | "horizontal";
}

export function AccommodationCard({ 
  accommodation, 
  variant = "default" 
}: AccommodationCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Type label mapping
  const typeLabels: Record<string, string> = {
    lodge: "Safari Lodge",
    "tented-camp": "Tented Camp",
    "luxury-cottage": "Luxury Cottage",
  };

  if (variant === "horizontal") {
    return (
      <article className="group flex flex-col overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300 my-5 hover:shadow-lg sm:flex-row">
        {/* Image Section */}
        <div className="relative sm:w-80 sm:shrink-0">
          <div className="relative aspect-[4/3] sm:aspect-auto sm:h-full">
            <Image
              src={accommodation.image}
              alt={accommodation.name}
              fill
              className={`object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              sizes="(max-width: 640px) 100vw, 320px"
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-base-200 animate-pulse" />
            )}
          </div>
          
          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {accommodation.badges.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className={`badge badge-sm ${
                  badge === "Luxury" || badge === "Ultra-Luxury" || badge === "Premium"
                    ? "badge-accent"
                    : badge === "Eco" || badge === "Heritage"
                    ? "badge-success"
                    : "badge-primary"
                }`}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="badge badge-outline badge-sm">
              {typeLabels[accommodation.type]}
            </span>
            <span className="badge badge-ghost badge-sm">
              {accommodation.country}
            </span>
          </div>

          <h3 className="font-serif text-xl font-bold text-base-content">
            {accommodation.name}
          </h3>
          
          <div className="mt-1 flex items-center gap-1.5 text-sm text-base-content/60">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{accommodation.location}</span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-base-content/70 line-clamp-3 flex-1">
            {accommodation.description}
          </p>

          {/* Amenities */}
          <div className="mt-4 flex flex-wrap gap-2">
            {accommodation.amenities.slice(0, 10).map((amenity) => {
              const Icon = amenityIcons[amenity] || Check;
              return (
                <div
                  key={amenity}
                  className="flex items-center gap-1.5 rounded-md bg-base-200 px-2 py-1"
                >
                  <Icon className="h-3 w-3 text-primary" />
                  <span className="text-xs text-base-content/80">{amenity}</span>
                </div>
              );
            })}
            {accommodation.amenities.length > 4 && (
              <span className="flex items-center rounded-md bg-base-200 px-2 py-1 text-xs text-base-content/60">
                +{accommodation.amenities.length - 4} more
              </span>
            )}
          </div>

          {/* Price and CTA */}
          <div className="mt-4 flex items-end justify-between border-t border-base-content/10 pt-4">
            <div>
              <p className="text-xs text-base-content/60">From</p>
              <p className="text-2xl font-bold text-base-content">
                {formatPrice(accommodation.priceFrom)}
              </p>
              <p className="text-xs text-base-content/60">per night</p>
            </div>
            <Link
              href={`/accommodations/${accommodation.slug}`}
              className="btn btn-primary btn-sm gap-2"
            >
              Enquire <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // Default vertical card
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={accommodation.image}
          alt={accommodation.name}
          fill
          className={`object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-base-200 animate-pulse" />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-base-content/60 via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {accommodation.badges.map((badge) => (
            <span
              key={badge}
              className={`badge badge-sm ${
                badge === "Luxury" || badge === "Ultra-Luxury" || badge === "Premium"
                  ? "badge-accent"
                  : badge === "Eco" || badge === "Heritage"
                  ? "badge-success"
                  : "badge-primary"
              }`}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Country badge */}
        <div className="absolute top-3 right-3">
          <span className="badge badge-ghost badge-sm bg-base-100/90 text-base-content">
            {accommodation.country}
          </span>
        </div>

        {/* Price badge */}
        <div className="absolute bottom-3 left-3">
          <div className="rounded-lg bg-base-100/95 backdrop-blur px-3 py-2">
            <p className="text-xs text-base-content/60">From</p>
            <p className="text-lg font-bold text-base-content">
              {formatPrice(accommodation.priceFrom)}
            </p>
            <p className="text-xs text-base-content/60">per night</p>
          </div>
        </div>

        {/* Recommended badge */}
        {accommodation.recommended && (
          <div className="absolute bottom-3 right-3">
            <div className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5">
              <Star className="h-3.5 w-3.5 fill-primary-content text-primary-content" />
              <span className="text-xs font-medium text-primary-content">Recommended</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2">
          <span className="badge badge-outline badge-sm capitalize">
            {typeLabels[accommodation.type]}
          </span>
        </div>

        <h3 className="font-serif text-lg font-bold text-base-content line-clamp-1">
          {accommodation.name}
        </h3>
        
        <div className="mt-1 flex items-center gap-1.5 text-sm text-base-content/60">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span>{accommodation.location}</span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-base-content/70 line-clamp-3 flex-1">
          {accommodation.description}
        </p>

        {/* Amenities scroll */}
        <div className="relative mb-4 mt-3">
          <div 
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {accommodation.amenities.slice(0, 10).map((amenity) => {
              const Icon = amenityIcons[amenity] || Check;
              return (
                <div
                  key={amenity}
                  className="flex shrink-0 items-center gap-1.5 rounded-md bg-base-200 px-2.5 py-1.5"
                  title={amenity}
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-base-content/80 whitespace-nowrap">
                    {amenity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/accommodations/${accommodation.slug}`}
          className="btn btn-primary btn-block btn-sm gap-2"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}