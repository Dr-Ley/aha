import { z } from "zod";
import type { ItineraryDayPlan, ItineraryPlan } from "@/server/services/itinerary/types";

const optionalId = z.number().int().positive().nullable().optional();

/** Structured AI itinerary output. IDs must refer to Enzi catalog records. */
export const aiItineraryDaySchema = z.object({
  day: z.number().int().positive().max(30),
  destination_id: z.number().int().positive(),
  activity_ids: z.array(z.number().int().positive()).max(12).optional().default([]),
  accommodation_id: optionalId,
  transport_id: optionalId,
  transfer_id: optionalId,
  notes: z.string().max(2000).nullable().optional(),
});

export const aiItineraryOutputSchema = z.object({
  title: z.string().trim().min(1).max(255),
  summary: z.string().trim().min(1).max(4000),
  duration_days: z.number().int().positive().max(30),
  destination_ids: z.array(z.number().int().positive()).min(1).max(12),
  days: z.array(aiItineraryDaySchema).min(1).max(30),
  notes: z.array(z.string().max(1000)).max(20).optional().default([]),
  assumptions: z.array(z.string().max(1000)).max(20).optional().default([]),
  recommendations: z.array(z.string().max(1000)).max(20).optional().default([]),
});

export type AiItineraryOutput = z.infer<typeof aiItineraryOutputSchema>;

export function parseAiItineraryOutput(raw: unknown): {
  ok: true;
  plan: ItineraryPlan;
} | {
  ok: false;
  issues: string[];
} {
  const parsed = aiItineraryOutputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`),
    };
  }
  return { ok: true, plan: toItineraryPlan(parsed.data) };
}

export function toItineraryPlan(output: AiItineraryOutput): ItineraryPlan {
  const days: ItineraryDayPlan[] = output.days.map((day) => ({
    day: day.day,
    destinationId: day.destination_id,
    activityIds: [...new Set(day.activity_ids ?? [])],
    accommodationId: day.accommodation_id ?? null,
    transportId: day.transport_id ?? null,
    transferId: day.transfer_id ?? null,
    notes: day.notes?.trim() || null,
  }));
  return {
    title: output.title.trim(),
    summary: output.summary.trim(),
    durationDays: output.duration_days,
    destinationIds: [...new Set(output.destination_ids)],
    days,
    notes: output.notes ?? [],
    assumptions: output.assumptions ?? [],
    recommendations: output.recommendations ?? [],
  };
}

export function planToAiShape(plan: ItineraryPlan): AiItineraryOutput {
  return {
    title: plan.title,
    summary: plan.summary,
    duration_days: plan.durationDays,
    destination_ids: plan.destinationIds,
    days: plan.days.map((day) => ({
      day: day.day,
      destination_id: day.destinationId,
      activity_ids: day.activityIds,
      accommodation_id: day.accommodationId,
      transport_id: day.transportId,
      transfer_id: day.transferId,
      notes: day.notes ?? null,
    })),
    notes: plan.notes,
    assumptions: plan.assumptions,
    recommendations: plan.recommendations,
  };
}
