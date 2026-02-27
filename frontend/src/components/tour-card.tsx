"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Clock, MapPin, Star, Users } from "lucide-react";
import { tours, type Tour } from "@/lib/data";
import { useCurrency } from "@/lib/currency-context";
import { LikeButton } from "@/components/like-button";

const SLIDESHOW_INTERVAL_MS = 2000;

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

export function TourCard({ tour }: { tour: Tour }) {
  const images = tour.image?.slice(0, 4) || tour.image; // Limit to 4 for hover-gallery
  const { formatPrice } = useCurrency();
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideshowActive, setSlideshowActive] = useState(false);
  const isMobile = useIsMobile();

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

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-sm transition-shadow hover:shadow-lg">
      
      {/* Wrapper needed for positioning context */}
      <div className="relative">
        
        {/* LikeButton overlay - outside hover-gallery but positioned over it */}
        <div className="absolute top-3 right-3 z-20 [&_button]:!border-0 [&_button]:shadow-lg [&_button]:bg-white/90 [&_button]:backdrop-blur-sm">
          <LikeButton
            tourId={typeof (tour as unknown as { id?: unknown }).id === "number" ? (tour as unknown as { id: number }).id : undefined}
            initialLikes={(tour as { likes?: number }).likes ?? 0}
            size="sm"
          />
        </div>

        {isMobile ? (
          // Mobile: Slideshow
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
                alt={i === 0 ? tour.title : `${tour.title} - image ${i + 1}`}
                fill
                className="object-cover transition-opacity duration-500"
                style={{ opacity: i === activeIndex ? 1 : 0 }}
                sizes="100vw"
                loading="lazy"
              />
            ))}
            
            {/* Mobile slideshow indicator dots */}
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
          // Desktop: DaisyUI hover-gallery with horizontal hover zones
          <figure className="hover-gallery aspect-[4/3]">
            {images.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt={`${tour.title} - image ${i + 1}`}
                width={400}
                height={300}
                className="object-cover w-full h-full"
                loading={i === 0 ? "eager" : "lazy"}
              />
            ))}
          </figure>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-1">
          <Star className="h-4 w-4 fill-accent text-accent" />
          <span className="text-sm font-medium">{tour.rating}</span>
          <span className="text-xs text-base-content/60">
            ({tour.reviewCount} reviews)
          </span>
        </div>

        <h3 className="relative font-serif text-lg font-semibold leading-snug text-base-content transition-colors group-hover:text-primary">
          <Link href={`/tours/${tour.slug}`} className="after:absolute after:inset-0 after:block">
            {tour.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-base-content/70">
          {tour.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-base-content/60">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {tour.duration}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {tour.destination}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {tour.groupSize}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-base-content/10 pt-5 overflow-hidden gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-base-content/60">From</p>
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-lg font-bold text-base-content">
                {formatPrice(tour.price)}
              </span>
              {tour.originalPrice != null && (
                <span className="text-xs text-base-content/50 line-through truncate">
                  {formatPrice(tour.originalPrice)}
                </span>
              )}
            </div>
            <p className="text-xs text-base-content/60">per person</p>
          </div>
          <Link
            href={`/tours/${tour.slug}`}
            className="btn btn-primary btn-sm shrink-0"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}