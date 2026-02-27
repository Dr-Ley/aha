"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Star,
  ArrowRight,
  Wifi,
  Waves,
  UtensilsCrossed,
  Bath,
  Zap,
  Wine,
  Flower2,
  User,
  Flame,
  Gift,
  Plane,
  Coffee,
  ChevronRight,
  Check,
  Car,
  Dumbbell,
  Baby,
  Binoculars,
} from "lucide-react";
import type { Accomodations } from "@/lib/data";
import { useCurrency } from "@/lib/currency-context";
import { LikeButton } from "@/components/like-button";

const SLIDESHOW_INTERVAL_MS = 3000;

// Icon mapping
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isMobile;
}

interface AccommodationCardProps {
  accommodation: Accomodations & { id: number; likes?: number };
  variant?: "default" | "horizontal";
}

export function AccommodationCard({ 
  accommodation, 
  variant = "default" 
}: AccommodationCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const isMobile = useIsMobile();
  const { formatPrice } = useCurrency();

  const images = Array.isArray(accommodation.image) 
  ? accommodation.image.slice(0, 4)
  : typeof accommodation.image === 'string' 
    ? [accommodation.image]  // Wrap single string in array
    : [];  // Fallback to empty array

  // Mobile slideshow effect
  useEffect(() => {
    if (!isMobile || !slideshowActive || images.length <= 1) return;
    const t = setInterval(
      () => setActiveIndex((i) => (i + 1) % images.length),
      SLIDESHOW_INTERVAL_MS
    );
    return () => clearInterval(t);
  }, [isMobile, slideshowActive, images.length]);

  const handleImageClick = useCallback(() => {
    if (!isMobile) return;
    setSlideshowActive((on) => !on);
    if (!slideshowActive) setActiveIndex((i) => (i + 1) % images.length);
  }, [isMobile, slideshowActive, images.length]);

  const handleImageLoad = (index: number) => {
    setImageLoaded((prev) => ({ ...prev, [index]: true }));
  };

  // Type label mapping
  const typeLabels: Record<string, string> = {
    lodge: "Safari Lodge",
    "tented-camp": "Tented Camp",
    "luxury-cottage": "Luxury Cottage",
  };

  // Image Gallery Component (shared logic) - structure matches tour-card for hover-gallery + like button
  const ImageGallery = ({ className = "", horizontal = false }: { className?: string, horizontal?: boolean }) => {
    const containerClasses = horizontal
      ? "relative aspect-[4/3] sm:aspect-auto sm:h-full overflow-hidden"
      : "relative overflow-hidden";

    return (
      <div className={`${containerClasses} ${className}`}>
        {/* LikeButton overlay - outside hover-gallery, same as tour-card; stopPropagation so clicks don't trigger slideshow */}
        <div
          className="absolute top-3 right-3 z-20 [&_button]:!border-0 [&_button]:shadow-lg [&_button]:bg-white/90 [&_button]:backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
        <LikeButton
          accommodationId={accommodation.id}
          initialLikes={accommodation.likes ?? 0}
          size="sm"
        />
        </div>

        {isMobile ? (
          // Mobile: Slideshow with opacity transition (figure clickable like tour-card)
          <figure
            className="relative aspect-[4/3] overflow-hidden cursor-pointer"
            onClick={handleImageClick}
            role="button"
            tabIndex={0}
            aria-label="Start or stop image slideshow"
          >
            {images.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt={i === 0 ? accommodation.name : `${accommodation.name} - image ${i + 1}`}
                fill
                className="object-cover transition-opacity duration-500"
                style={{ opacity: i === activeIndex ? 1 : 0 }}
                sizes={horizontal ? "(max-width: 640px) 100vw, 320px" : "100vw"}
                loading={i === 0 ? "eager" : "lazy"}
                onLoad={() => handleImageLoad(i)}
              />
            ))}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      i === activeIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </figure>
        ) : (
          // Desktop: DaisyUI hover-gallery - use figure + aspect-[4/3] like tour-card; horizontal variant fills container on sm+
          <figure className={`hover-gallery aspect-[4/3] ${horizontal ? "sm:h-full sm:w-full sm:aspect-auto" : ""}`}>
            {images.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt={`${accommodation.name} - image ${i + 1}`}
                width={400}
                height={300}
                className="object-cover w-full h-full"
                loading={i === 0 ? "eager" : "lazy"}
              />
            ))}
          </figure>
        )}
      </div>
    );
  };

  if (variant === "horizontal") {
    return (
      <article className="group flex flex-col overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-sm transition-all duration-300 my-5 hover:shadow-lg sm:flex-row">
        {/* Image Section */}
        <div className="relative sm:w-80 sm:shrink-0 cursor-pointer">
          <ImageGallery horizontal />
          
          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-20">
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
            {accommodation.amenities.slice(0, 4).map((amenity) => {
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
          <div className="mt-4 flex items-end justify-between border-t border-base-content/10 pt-4 gap-2">
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
      <div className="relative cursor-pointer">
        <ImageGallery />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-base-content/60 via-transparent to-transparent pointer-events-none z-10" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-20">
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
        <div className="absolute top-3 right-12 z-20"> {/* Moved left to avoid LikeButton */}
          <span className="badge badge-ghost badge-sm bg-base-100/90 text-base-content">
            {accommodation.country}
          </span>
        </div>

        {/* Price badge */}
        <div className="absolute bottom-3 left-3 z-20">
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
          <div className="absolute bottom-3 right-3 z-20">
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
        <div className="flex items-center justify-between gap-2 mt-2">
          <Link
            href={`/accommodations/${accommodation.slug}`}
            className="btn btn-primary btn-sm gap-2 flex-1"
          >
            View Details
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}