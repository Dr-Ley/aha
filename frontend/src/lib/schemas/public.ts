import { z } from "zod";
import { companyIdZod } from "@/lib/schemas/company-id";
import { normalizeTravellerCounts, travellerHeadcount } from "@/lib/travellers";

export const emailSchema = z.string().trim().email().max(255);

export const registerBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: emailSchema,
  password: z.string().min(8).max(128),
});

export const contactBodySchema = z.object({
  companyId: companyIdZod,
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional().nullable(),
  email: emailSchema,
  phone: z.string().trim().max(50).optional().nullable(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
});

export const likeBodySchema = z
  .object({
    tourId: z.coerce.number().int().positive().optional(),
    accommodationId: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (d) => (d.tourId != null) !== (d.accommodationId != null),
    { message: "Provide exactly one of tourId or accommodationId" }
  );

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const publicBookingBodySchema = z
  .object({
    companyId: companyIdZod,
    tourSlug: z.string().trim().min(1).max(255).optional(),
    tourId: z.coerce.number().int().positive().optional(),
    travelDate: ymd,
    guests: z.coerce.number().int().min(1).max(99).optional(),
    adults: z.coerce.number().int().min(0).max(99).optional(),
    children: z.coerce.number().int().min(0).max(99).optional(),
    infants: z.coerce.number().int().min(0).max(99).optional(),
    accommodation: z.string().max(50).optional().nullable(),
    transport: z.string().max(50).optional().nullable(),
    specialRequests: z.string().max(2000).optional().nullable(),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().max(100).optional().nullable(),
    email: emailSchema,
    phone: z.string().trim().max(50).optional().nullable(),
    country: z.string().trim().max(100).optional().nullable(),
    originalCurrency: z.string().max(10).optional(),
    originalAmount: z.coerce.number().int().min(0).optional(),
    pricePerPerson: z.coerce.number().int().min(0).optional(),
    totalPrice: z.coerce.number().int().min(0).optional(),
  })
  .refine((d) => Boolean(d.tourSlug) || d.tourId != null, {
    message: "tourSlug or tourId is required",
  })
  .refine((d) => travellerHeadcount(normalizeTravellerCounts(d)) >= 1, {
    message: "At least one traveller is required",
    path: ["adults"],
  });

export const accommodationQuerySchema = z.object({
  country: z.enum(["Kenya", "Tanzania", "All"]).optional(),
  type: z.enum(["lodge", "tented-camp", "luxury-cottage", "all"]).optional(),
  minPrice: z.coerce.number().int().min(0).max(1_000_000).optional(),
  maxPrice: z.coerce.number().int().min(0).max(1_000_000).optional(),
  search: z.string().trim().max(120).optional(),
  recommended: z.enum(["true", "false"]).optional(),
});

const imageListSchema = z.array(z.string().min(1).max(2000)).min(1).max(20);

export const accommodationWriteSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(255),
  location: z.string().trim().min(1).max(255),
  country: z.enum(["Kenya", "Tanzania"]),
  image: imageListSchema,
  description: z.string().trim().min(1).max(20_000),
  amenities: z.array(z.string().min(1).max(120)).max(50),
  priceFrom: z.coerce.number().int().min(0).max(1_000_000),
  badges: z.array(z.string().min(1).max(80)).max(20),
  recommended: z.boolean().optional(),
  type: z.enum(["lodge", "tented-camp", "luxury-cottage"]),
});

export const accommodationPatchSchema = accommodationWriteSchema.partial().extend({
  id: z.coerce.number().int().positive(),
});
