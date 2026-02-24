"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Clock, MapPin, Star, Users } from "lucide-react";
import type { Tour } from "@/lib/data";
import { useCurrency } from "@/lib/currency-context"

  

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
  const images = tour.image?.slice(0, 7) || tour.image;
  const { formatPrice } = useCurrency()
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

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return;
    if (images.length > 1) setActiveIndex(1);
  }, [isMobile, images.length]);

  const handleMouseLeave = useCallback(() => {
    if (isMobile) return;
    setActiveIndex(0);
  }, [isMobile]);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-sm transition-shadow hover:shadow-lg">
            <figure
        className={isMobile ? "relative aspect-[4/3] overflow-hidden cursor-pointer" : "hover-gallery aspect-[4/3]"}
        onClick={handleImageClick}
        role={isMobile ? "button" : undefined}
        tabIndex={isMobile ? 0 : undefined}
        aria-label={isMobile ? "Start or stop image slideshow" : undefined}
      >
        {isMobile ? (
          // Mobile: Slideshow with opacity transition
          images.map((src, i) => (
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
          ))
        ) : (
          // Desktop: DaisyUI hover-gallery (max 4 images)
          images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={`${tour.title} - image ${i + 1}`}
              width={400}
              height={300}
              className="object-cover w-full h-full"
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))
        )}
        
        {/* Mobile slideshow indicator dots */}
        {isMobile && images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
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

        <div className="mt-auto flex items-end justify-between border-t border-base-content/10 pt-5 overflow-hidden">
          <div className="min-w-0">
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
