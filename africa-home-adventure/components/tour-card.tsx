import Image from "next/image"
import Link from "next/link"
import { Clock, MapPin, Star, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Tour } from "@/lib/data"

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className="bg-primary text-primary-foreground">{tour.country}</Badge>
          {tour.featured && (
            <Badge className="bg-accent text-accent-foreground">Featured</Badge>
          )}
        </div>
        {tour.originalPrice && (
          <div className="absolute right-3 top-3">
            <Badge variant="secondary" className="bg-card text-card-foreground font-semibold">
              Save ${tour.originalPrice - tour.price}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-4 w-4 fill-accent text-accent" />
          <span className="text-sm font-medium text-foreground">{tour.rating}</span>
          <span className="text-xs text-muted-foreground">({tour.reviewCount} reviews)</span>
        </div>

        <h3 className="font-serif text-lg font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          <Link href={`/tours/${tour.slug}`} className="after:absolute after:inset-0">
            {tour.title}
          </Link>
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {tour.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
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

        {/* Price & CTA */}
        <div className="mt-auto flex items-end justify-between pt-5 border-t border-border mt-5">
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">${tour.price}</span>
              {tour.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ${tour.originalPrice}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">per person</p>
          </div>
          <Button size="sm" asChild>
            <Link href={`/tours/${tour.slug}`}>View Details</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
