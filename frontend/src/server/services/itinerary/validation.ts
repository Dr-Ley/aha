import type {
  ItineraryPlan,
  ItineraryRequirements,
  ItineraryValidationResult,
  TourismCatalog,
  ValidationIssue,
} from "@/server/services/itinerary/types";

const CHILD_MAX_AGE = 12;
const INFANT_MAX_AGE = 2;

export function childBand(age: number): "infant" | "child" | "adult" {
  if (age <= INFANT_MAX_AGE) return "infant";
  if (age <= CHILD_MAX_AGE) return "child";
  return "adult";
}

function issue(code: string, message: string, path?: string): ValidationIssue {
  return path ? { code, message, path } : { code, message };
}

/**
 * Business validation against the retrieved Enzi catalog.
 * Fabricated IDs and incompatible combinations are rejected — never silently accepted.
 */
export function validateItineraryPlan(
  plan: ItineraryPlan,
  catalog: TourismCatalog,
  requirements: ItineraryRequirements
): ItineraryValidationResult {
  const issues: ValidationIssue[] = [];
  const destIds = new Set(catalog.destinations.map((row) => row.id));
  const accIds = new Set(catalog.accommodations.map((row) => row.id));
  const activityIds = new Set(catalog.activities.map((row) => row.id));
  const transportIds = new Set(catalog.transport.map((row) => row.id));
  const transferIds = new Set(catalog.transfers.map((row) => row.id));
  const destById = new Map(catalog.destinations.map((row) => [row.id, row]));
  const accById = new Map(catalog.accommodations.map((row) => [row.id, row]));
  const activityById = new Map(catalog.activities.map((row) => [row.id, row]));

  if (requirements.adults + requirements.children + requirements.infants < 1) {
    issues.push(issue("travellers", "At least one traveller is required"));
  }
  if (requirements.durationDays < 1 || requirements.durationDays > 30) {
    issues.push(issue("dates", "Trip duration must be between 1 and 30 days"));
  }
  if (requirements.startDate && requirements.endDate && requirements.endDate < requirements.startDate) {
    issues.push(issue("dates", "Departure date must be on or after arrival date"));
  }
  if (plan.durationDays !== requirements.durationDays) {
    issues.push(
      issue("duration", `Plan duration ${plan.durationDays} does not match requested ${requirements.durationDays} days`)
    );
  }
  if (plan.days.length !== requirements.durationDays) {
    issues.push(
      issue("days", `Expected ${requirements.durationDays} daily entries, received ${plan.days.length}`)
    );
  }

  const seenDays = new Set<number>();
  for (let i = 0; i < plan.days.length; i += 1) {
    const day = plan.days[i]!;
    const path = `days[${i}]`;
    if (day.day !== i + 1) {
      issues.push(issue("day_sequence", `Day numbers must be sequential starting at 1`, `${path}.day`));
    }
    if (seenDays.has(day.day)) {
      issues.push(issue("day_duplicate", `Duplicate day ${day.day}`, path));
    }
    seenDays.add(day.day);

    if (!destIds.has(day.destinationId)) {
      issues.push(issue("unknown_destination", `Unknown destination_id ${day.destinationId}`, `${path}.destination_id`));
    }
    if (day.accommodationId != null && !accIds.has(day.accommodationId)) {
      issues.push(
        issue("unknown_accommodation", `Unknown accommodation_id ${day.accommodationId}`, `${path}.accommodation_id`)
      );
    }
    if (day.transportId != null && !transportIds.has(day.transportId)) {
      issues.push(issue("unknown_transport", `Unknown transport_id ${day.transportId}`, `${path}.transport_id`));
    }
    if (day.transferId != null && !transferIds.has(day.transferId)) {
      issues.push(issue("unknown_transfer", `Unknown transfer_id ${day.transferId}`, `${path}.transfer_id`));
    }
    for (const activityId of day.activityIds) {
      if (!activityIds.has(activityId)) {
        issues.push(issue("unknown_activity", `Unknown activity_id ${activityId}`, `${path}.activity_ids`));
        continue;
      }
      const activity = activityById.get(activityId);
      if (activity && destIds.has(day.destinationId) && activity.destinationId !== day.destinationId) {
        issues.push(
          issue(
            "activity_destination_mismatch",
            `Activity ${activityId} does not belong to destination ${day.destinationId}`,
            `${path}.activity_ids`
          )
        );
      }
    }

    const dest = destById.get(day.destinationId);
    const acc = day.accommodationId != null ? accById.get(day.accommodationId) : null;
    if (dest && acc && acc.destinationId != null && acc.destinationId !== dest.id) {
      issues.push(
        issue(
          "accommodation_destination_mismatch",
          `${acc.name} is not at ${dest.name}`,
          `${path}.accommodation_id`
        )
      );
    }

    const paying = requirements.adults + requirements.children;
    const transport = day.transportId != null ? catalog.transport.find((row) => row.id === day.transportId) : null;
    if (transport && paying > transport.capacity) {
      issues.push(
        issue(
          "transport_capacity",
          `${transport.name} seats ${transport.capacity}; party has ${paying} paying travellers`,
          `${path}.transport_id`
        )
      );
    }
  }

  for (const destinationId of plan.destinationIds) {
    if (!destIds.has(destinationId)) {
      issues.push(issue("unknown_destination", `Unknown destination_id ${destinationId}`, "destination_ids"));
    }
  }

  if (requirements.destinationIds.length > 0) {
    const requested = new Set(requirements.destinationIds);
    const used = new Set(plan.days.map((day) => day.destinationId));
    for (const id of requested) {
      if (destIds.has(id) && !used.has(id)) {
        issues.push(issue("missing_requested_destination", `Requested destination ${id} is missing from the daily plan`));
      }
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, plan };
}
