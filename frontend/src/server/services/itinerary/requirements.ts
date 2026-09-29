import { z } from "zod";
import { CURRENCIES, type CurrencyCode } from "@/lib/data";
import { companyIdZod } from "@/lib/schemas/company-id";
import { normalizeTravellerCounts, travellerHeadcount } from "@/lib/travellers";
import {
  ACCOMMODATION_CATEGORIES,
  INTEREST_TAGS,
  type ItineraryRequirements,
} from "@/server/services/itinerary/types";

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional()
  .nullable();

const currencyCodeSchema = z.enum(CURRENCIES.map((c) => c.code) as [CurrencyCode, ...CurrencyCode[]]);

function addDaysIso(start: string, daysToAdd: number): string | null {
  const d = new Date(`${start}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

export const itineraryRequirementsSchema = z
  .object({
    companyId: companyIdZod,
    country: z.string().trim().max(100).optional().nullable(),
    destinationIds: z.array(z.coerce.number().int().positive()).max(12).default([]),
    attractionIds: z.array(z.coerce.number().int().positive()).max(24).default([]),
    activityIds: z.array(z.coerce.number().int().positive()).max(24).default([]),
    startDate: ymd,
    endDate: ymd,
    durationDays: z.coerce.number().int().min(1).max(30).optional(),
    adults: z.coerce.number().int().min(0).max(99).optional(),
    children: z.coerce.number().int().min(0).max(99).optional(),
    infants: z.coerce.number().int().min(0).max(99).optional(),
    guests: z.coerce.number().int().min(1).max(99).optional(),
    childAges: z.array(z.coerce.number().int().min(0).max(17)).max(20).default([]),
    accommodationCategory: z.enum(ACCOMMODATION_CATEGORIES).optional().nullable(),
    accommodationPreferences: z.string().trim().max(500).optional().nullable(),
    budgetAmount: z.coerce.number().int().min(0).max(10_000_000).optional().nullable(),
    budgetCurrency: currencyCodeSchema.optional().nullable(),
    interests: z.array(z.enum(INTEREST_TAGS)).max(12).default([]),
    wildlifeInterests: z.string().trim().max(500).optional().nullable(),
    preferredTransport: z.string().trim().max(80).optional().nullable(),
    airportTransfer: z.boolean().optional().default(true),
    notes: z.string().trim().max(4000).optional().nullable(),
    extra: z.record(z.unknown()).optional(),
    guestEmail: z.string().trim().email().max(255).optional().nullable(),
    guestName: z.string().trim().max(255).optional().nullable(),
    guestPhone: z.string().trim().max(50).optional().nullable(),
    currency: currencyCodeSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const counts = normalizeTravellerCounts(data);
    if (travellerHeadcount(counts) < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one traveller is required", path: ["adults"] });
    }
    if (data.childAges.length > 0 && data.childAges.length !== counts.children) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide one age for each child",
        path: ["childAges"],
      });
    }
    if (!data.durationDays && !data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide durationDays or startDate",
        path: ["durationDays"],
      });
    }
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endDate must be on or after startDate",
        path: ["endDate"],
      });
    }
  });

export type ItineraryRequirementsInput = z.infer<typeof itineraryRequirementsSchema>;

export function durationFromDates(startDate: string, endDate: string): number {
  const a = new Date(`${startDate}T12:00:00.000Z`);
  const b = new Date(`${endDate}T12:00:00.000Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0;
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1);
}

export function normalizeItineraryRequirements(
  input: ItineraryRequirementsInput
): ItineraryRequirements {
  const counts = normalizeTravellerCounts(input);
  let durationDays = input.durationDays ?? 0;
  if (!durationDays && input.startDate && input.endDate) {
    durationDays = durationFromDates(input.startDate, input.endDate);
  }
  if (!durationDays) durationDays = 5;

  let endDate = input.endDate ?? null;
  if (input.startDate && !endDate) {
    endDate = addDaysIso(input.startDate, durationDays - 1);
  }

  const childAges = input.childAges.slice(0, counts.children);
  while (childAges.length < counts.children) childAges.push(8);

  return {
    companyId: input.companyId,
    country: input.country?.trim() || null,
    destinationIds: [...new Set(input.destinationIds)],
    attractionIds: [...new Set(input.attractionIds)],
    activityIds: [...new Set(input.activityIds)],
    startDate: input.startDate ?? null,
    endDate,
    durationDays,
    adults: counts.adults,
    children: counts.children,
    infants: counts.infants,
    childAges,
    accommodationCategory: input.accommodationCategory ?? null,
    accommodationPreferences: input.accommodationPreferences?.trim() || null,
    budgetAmount: input.budgetAmount ?? null,
    budgetCurrency: input.budgetCurrency ?? null,
    interests: input.interests,
    wildlifeInterests: input.wildlifeInterests?.trim() || null,
    preferredTransport: input.preferredTransport?.trim() || null,
    airportTransfer: input.airportTransfer !== false,
    notes: input.notes?.trim() || null,
    guestEmail: input.guestEmail?.trim().toLowerCase() || null,
    guestName: input.guestName?.trim() || null,
    guestPhone: input.guestPhone?.trim() || null,
    currency: input.currency ?? "USD",
  };
}

/** Strip free-text that could be used for prompt injection from the AI-facing payload. */
export function requirementsForPrompt(req: ItineraryRequirements): Record<string, unknown> {
  return {
    country: req.country,
    destinationIds: req.destinationIds,
    attractionIds: req.attractionIds,
    activityIds: req.activityIds,
    startDate: req.startDate,
    endDate: req.endDate,
    durationDays: req.durationDays,
    adults: req.adults,
    children: req.children,
    infants: req.infants,
    childAges: req.childAges,
    accommodationCategory: req.accommodationCategory,
    budgetAmount: req.budgetAmount,
    budgetCurrency: req.budgetCurrency,
    interests: req.interests,
    airportTransfer: req.airportTransfer,
    preferredTransport: req.preferredTransport,
    notes: req.notes ? req.notes.slice(0, 500) : null,
    wildlifeInterests: req.wildlifeInterests ? req.wildlifeInterests.slice(0, 200) : null,
    accommodationPreferences: req.accommodationPreferences
      ? req.accommodationPreferences.slice(0, 200)
      : null,
  };
}
