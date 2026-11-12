import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchAccommodationContract } from "@/features/tourism/accommodation-contracts";
import { assessItineraryQuote } from "@/server/services/itinerary/planner/price-assessment";
import { planItinerary } from "@/server/services/itinerary/planner/plan";
import { applyNarrative } from "@/server/services/itinerary/planner/narrative";
import { shortestRoute } from "@/server/services/itinerary/planner/route-graph";
import type { ItineraryRequirements, TourismCatalog } from "@/server/services/itinerary/types";

const catalog: TourismCatalog = {
  destinations: [
    { id: 1, name: "Maasai Mara", slug: "maasai-mara", country: "Kenya", region: "Narok", description: null },
    { id: 2, name: "Amboseli", slug: "amboseli", country: "Kenya", region: "Kajiado", description: null },
    { id: 7, name: "Nairobi", slug: "nairobi", country: "Kenya", region: "Nairobi", description: null },
  ],
  attractions: [],
  accommodations: [
    {
      id: 11,
      destinationId: 1,
      name: "Enchoro Wildlife Camp",
      slug: "enchoro-wildlife-camp",
      type: "tented-camp",
      category: "mid-range",
      priceFromUsd: 100,
      location: "Maasai Mara",
    },
    {
      id: 38,
      destinationId: 1,
      name: "Masai Mara Sopa Lodge",
      slug: "masai-mara-sopa-lodge",
      type: "lodge",
      category: "mid-range",
      priceFromUsd: 200,
      location: "Maasai Mara",
    },
  ],
  parkFees: [
    { id: 2, destinationId: 1, name: "Maasai Mara park entrance", adultUsd: 200, childUsd: 100, infantUsd: 0 },
  ],
  activities: [
    { id: 1, destinationId: 1, attractionId: null, name: "Shared game drive", adultUsd: 0, childUsd: 0 },
    { id: 2, destinationId: 1, attractionId: null, name: "Hot air balloon safari", adultUsd: 450, childUsd: 350 },
  ],
  transfers: [
    { id: 1, name: "JKIA – Nairobi hotel transfer", fromLabel: "JKIA", toLabel: "Nairobi hotel", destinationId: 7, amountUsd: 50 },
    { id: 3, name: "Nairobi – Mara private", fromLabel: "Nairobi", toLabel: "Maasai Mara", destinationId: 1, amountUsd: 200 },
  ],
  transport: [
    { id: 2, name: "Safari van", vehicleType: "safari_van", dailyRateUsd: 120, capacity: 6 },
    { id: 1, name: "Safari Land Cruiser", vehicleType: "landcruiser", dailyRateUsd: 230, capacity: 7 },
  ],
};

function requirements(overrides: Partial<ItineraryRequirements> = {}): ItineraryRequirements {
  return {
    companyId: "aha",
    country: "Kenya",
    destinationIds: [1],
    attractionIds: [],
    activityIds: [],
    startDate: "2026-08-01",
    endDate: "2026-08-03",
    durationDays: 3,
    adults: 2,
    children: 0,
    infants: 0,
    childAges: [],
    accommodationCategory: "mid-range",
    airportTransfer: true,
    interests: ["wildlife"],
    currency: "USD",
    ...overrides,
  };
}

describe("route graph", () => {
  it("connects Mara and Amboseli through Nairobi", () => {
    const allowed = new Set(["maasai-mara", "amboseli", "nairobi"]);
    assert.deepEqual(shortestRoute("maasai-mara", "amboseli", allowed), ["maasai-mara", "nairobi", "amboseli"]);
  });

  it("refuses a park that is not on the graph", () => {
    const allowed = new Set(["samburu", "nairobi"]);
    assert.equal(shortestRoute("samburu", "nairobi", allowed), null);
  });
});

describe("deterministic planner", () => {
  it("builds a Mara plan from catalog ids and does not use the Nairobi transfer for the park", () => {
    const result = planItinerary({ requirements: requirements(), catalog });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.plan.days.length, 3);
    assert.equal(result.plan.days[0]?.destinationId, 1);
    assert.equal(result.plan.days[0]?.transferId, null);
    assert.equal(result.plan.days[0]?.transportId, 2);
    assert.deepEqual(result.plan.days[0]?.activityIds, [1]);
    assert.ok(result.plan.days.every((day) => day.accommodationId === 11 || day.accommodationId === 38));
  });

  it("inserts Nairobi between Mara and Amboseli", () => {
    const result = planItinerary({
      requirements: requirements({ destinationIds: [1, 2], durationDays: 4, endDate: "2026-08-04" }),
      catalog,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(
      result.plan.days.map((day) => day.destinationId),
      [1, 1, 7, 2]
    );
    assert.equal(result.plan.days[2]?.accommodationId, null);
  });

  it("explains when the party does not fit a vehicle", () => {
    const result = planItinerary({
      requirements: requirements({ adults: 8, durationDays: 2 }),
      catalog,
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.issues[0]?.code, "transport_capacity");
  });

  it("explains an unsupported park", () => {
    const result = planItinerary({
      requirements: requirements({ destinationIds: [99] }),
      catalog,
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.issues[0]?.code, "unknown_destination");
  });

  it("does not let narrative replace skeleton ids", () => {
    const result = planItinerary({ requirements: requirements(), catalog });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const narrated = applyNarrative(result.plan, {
      title: "August in the Mara",
      summary: "Open plains and big cats.",
      day_notes: [{ day: 1, notes: "Morning arrival and a first game drive." }],
      days: [{ day: 1, destination_id: 999, accommodation_id: 12345 }],
    });
    assert.equal(narrated.title, "August in the Mara");
    assert.equal(narrated.days[0]?.destinationId, 1);
    assert.equal(narrated.days[0]?.notes, "Morning arrival and a first game drive.");
  });
});

describe("price confirmation", () => {
  it("marks a calculated quote as quote_required", () => {
    const result = planItinerary({ requirements: requirements(), catalog });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const quote = assessItineraryQuote({
      plan: result.plan,
      catalog,
      requirements: requirements(),
      markupPercent: 20,
      currency: "USD",
    });
    assert.equal(quote.pricingStatus, "quote_required");
    assert.ok(quote.sellingPrice >= quote.costTotal);
    assert.ok(quote.confirmationReasons.length > 0);
  });

  it("matches one Sopa contract and ignores an ambiguous name", () => {
    const sopa = matchAccommodationContract("Masai Mara Sopa Lodge", "maasai-mara");
    assert.equal(sopa?.key, "mara-sopa");
    assert.equal(sopa?.sellingConfirmed, false);
    assert.equal(matchAccommodationContract("Mara Camp", "maasai-mara"), null);
  });
});
