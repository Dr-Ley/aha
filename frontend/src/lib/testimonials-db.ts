import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { testimonials, tours } from "@/lib/schema";
import type { Testimonial } from "@/lib/data";
import type { CompanyId } from "@/types/company";

type DbTestimonial = typeof testimonials.$inferSelect;

export function mapDbTestimonialToTestimonial(
  row: DbTestimonial,
  tour?: { title: string; slug: string } | null
): Testimonial {
  return {
    id: String(row.id),
    name: row.name,
    country: row.country,
    avatar: row.avatar,
    rating: row.rating,
    text: row.text,
    tour: tour?.title ?? "Safari Tour",
    tourSlug: tour?.slug,
  };
}

export async function getTestimonialsFromDb(
  companyId: CompanyId,
  limit?: number
): Promise<Testimonial[]> {
  const rows = await db
    .select({
      testimonial: testimonials,
      tour: {
        title: tours.title,
        slug: tours.slug,
      },
    })
    .from(testimonials)
    .leftJoin(tours, eq(testimonials.tourId, tours.id))
    .where(eq(testimonials.companyId, companyId))
    .orderBy(desc(testimonials.createdAt));

  const mapped = rows.map((row) =>
    mapDbTestimonialToTestimonial(row.testimonial, row.tour)
  );

  return limit != null ? mapped.slice(0, limit) : mapped;
}
