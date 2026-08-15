"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Clock, MapPin, Star, Users } from "lucide-react";
import type { Tour } from "@/lib/data";
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
  const images = tour.image?.slice(0, 10) || tour.image; // Limit to 4 for hover-gallery
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

  const imageAlt = (index: number) =>
    index === 0
      ? `${tour.title} safari in ${tour.destination}`
      : `${tour.title} safari in ${tour.destination} - image ${index + 1}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-sm transition-shadow hover:shadow-lg">
      {/* Wrapper needed for positioning context */}
      <div className="relative">
        {/* LikeButton overlay - outside hover-gallery but positioned over it */}
        <div className="absolute top-3 right-3 z-20 [&_button]:!border-0 [&_button]:shadow-lg [&_button]:bg-white/90 [&_button]:backdrop-blur-sm">
          <LikeButton
            tourId={tour.id ? parseInt(String(tour.id), 10) || null : null}
            initialLikes={tour.likes ?? 0}
            size="sm"
          />
        </div>

        <figure>
          {isMobile ? (
            // Mobile: Slideshow
            <div
              className="relative aspect-[4/3] overflow-hidden cursor-pointer"
              onClick={handleImageClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleImageClick();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Start or stop image slideshow"
            >
              {images.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt={imageAlt(i)}
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
            </div>
          ) : (
            // Desktop: DaisyUI hover-gallery with horizontal hover zones
            <div className="hover-gallery aspect-[4/3]">
              {images.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt={imageAlt(i)}
                  width={400}
                  height={300}
                  className="object-cover w-full h-full"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              ))}
            </div>
          )}

          <figcaption className="mb-2 flex items-center gap-1 px-5 pt-5">
            <Star className="h-4 w-4 fill-accent text-accent" aria-hidden="true" />
            <span className="text-sm font-medium">{tour.rating}</span>
            <span className="text-xs text-base-content/60">
              ({tour.reviewCount} reviews)
            </span>
          </figcaption>
        </figure>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5">
        <h3 className="relative font-serif text-lg font-semibold leading-snug text-base-content transition-colors group-hover:text-primary">
          <Link href={`/tours/${tour.slug}`} className="after:absolute after:inset-0 after:block">
            {tour.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-base-content/70">
          {tour.description}
        </p>

        <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-base-content/60">
          <div className="flex items-center gap-1">
            <dt className="sr-only">Duration</dt>
            <dd className="m-0 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {tour.duration}
            </dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Destination</dt>
            <dd className="m-0 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {tour.destination}
            </dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Group size</dt>
            <dd className="m-0 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" /> {tour.groupSize}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between border-t border-base-content/10 pt-5 overflow-hidden gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-base-content/60">From</p>
            <div className="flex items-baseline gap-2 min-w-0">
              <data value={tour.price} className="text-lg font-bold text-base-content">
                {formatPrice(tour.price)}
              </data>
              {tour.originalPrice != null && (
                <data
                  value={tour.originalPrice}
                  className="text-xs text-base-content/50 line-through truncate"
                >
                  {formatPrice(tour.originalPrice)}
                </data>
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