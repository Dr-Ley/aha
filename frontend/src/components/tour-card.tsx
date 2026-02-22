import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Star, Users } from "lucide-react";
import type { Tour } from "@/lib/data";

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="badge badge-primary text-xs px-2">{tour.country}</span>
          {tour.featured && (
            <span className="badge bg-accent text-xs px-2 text-accent-content border-none">
              Featured
            </span>
          )}
        </div>
        {tour.originalPrice != null && (
          <div className="absolute right-3 top-3">
            <span className="badge badge-ghost bg-base-100/90 text-xs px-2 font-semibold">
              Save ${tour.originalPrice - tour.price}
            </span>
          </div>
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

        <div className="mt-auto flex items-end justify-between border-t border-base-content/10 pt-5">
          <div>
            <p className="text-xs text-base-content/60">From</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-base-content">
                ${tour.price}
              </span>
              {tour.originalPrice != null && (
                <span className="text-sm text-base-content/50 line-through">
                  ${tour.originalPrice}
                </span>
              )}
            </div>
            <p className="text-xs text-base-content/60">per person</p>
          </div>
          <Link
            href={`/tours/${tour.slug}`}
            className="btn btn-primary btn-sm"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
