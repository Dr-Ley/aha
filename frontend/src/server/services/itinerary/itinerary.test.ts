import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HeuristicItineraryProvider } from "../ai/heuristic-provider";
import { itineraryAccess } from "./access";
import { parseAiItineraryOutput } from "./plan-schema";
import { quoteItineraryPlan } from "./pricing";
import { itineraryRequirementsSchema, normalizeItineraryRequirements } from "./requirements";
import type { ItineraryPlan, ItineraryRequirements, TourismCatalog } from "./types";
import { validateItineraryPlan } from "./validation";

const catalog: TourismCatalog = {
  destinations: [
    { id: 1, name: "Maasai Mara", slug: "maasai-mara", country: "Kenya", region: "Narok", description: null },
    { id: 2, name: "Amboseli", slug: "amboseli", country: "Kenya", region: "Kajiado", description: null },
  ],
  attractions: [
    { id: 10, destinationId: 1, name: "Game drive", type: "activity", duration: "half-day" },
  ],
  accommodations: [
    {
      id: 100,
      destinationId: 1,
      name: "Enchoro Wildlife Camp",
      slug: "enchoro-wildlife-camp",
      type: "tented-camp",
      category: "budget",
      priceFromUsd: 100,
      location: "Maasai Mara",
    },
    {
      id: 101,
      destinationId: 1,
      name: "Mara Serena",
      slug: "mara-serena",
      type: "lodge",
      category: "luxury",
      priceFromUsd: 200,
      location: "Maasai Mara",
    },
    {
      id: 102,
      destinationId: 2,
      name: "Amboseli Sopa",
      slug: "amboseli-sopa",
      type: "lodge",
      category: "mid-range",
      priceFromUsd: 150,
      location: "Amboseli",
    },
  ],
  parkFees: [
    { id: 20, destinationId: 1, name: "Maasai Mara park fee", adultUsd: 200, childUsd: 100, infantUsd: 0, adultUsdLow: 100, childUsdLow: 50 },
    { id: 21, destinationId: 2, name: "Amboseli park fee", adultUsd: 60, childUsd: 30, infantUsd: 0 },
  ],
  activities: [
    { id: 30, destinationId: 1, attractionId: 10, name: "Game drive", adultUsd: 0, childUsd: 0 },
    { id: 31, destinationId: 1, attractionId: null, name: "Hot air balloon", adultUsd: 450, childUsd: 350 },
    { id: 32, destinationId: 2, attractionId: null, name: "Observation Hill", adultUsd: 20, childUsd: 10 },
  ],
  transfers: [{ id: 40, name: "JKIA airport transfer", fromLabel: "JKIA", toLabel: "Nairobi", destinationId: 1, amountUsd: 50 }],
  transport: [{ id: 50, name: "Land Cruiser", vehicleType: "landcruiser", dailyRateUsd: 230, capacity: 7 }],
};

function baseRequirements(overrides: Partial<ItineraryRequirements> = {}): ItineraryRequirements {
  return {
    companyId: "aha",
    country: "Kenya",
    destinationIds: [1, 2],
    attractionIds: [],
    activityIds: [],
    startDate: "2026-10-01",
    endDate: "2026-10-05",
    durationDays: 5,
    adults: 2,
    children: 2,
    infants: 0,
    childAges: [6, 9],
    accommodationCategory: "budget",
    airportTransfer: true,
    interests: ["wildlife"],
    currency: "USD",
    ...overrides,
  };
}

function validPlan(overrides: Partial<ItineraryPlan> = {}): ItineraryPlan {
  return {
    title: "Mara & Amboseli",
    summary: "Five day safari",
    durationDays: 5,
    destinationIds: [1, 2],
    days: [
      { day: 1, destinationId: 1, activityIds: [30], accommodationId: 100, transportId: 50, transferId: 40, notes: "Arrive" },
      { day: 2, destinationId: 1, activityIds: [30], accommodationId: 100, transportId: 50, transferId: null, notes: null },
      { day: 3, destinationId: 1, activityIds: [31], accommodationId: 100, transportId: 50, transferId: null, notes: null },
      { day: 4, destinationId: 2, activityIds: [32], accommodationId: 102, transportId: 50, transferId: null, notes: null },
      { day: 5, destinationId: 2, activityIds: [32], accommodationId: 102, transportId: 50, transferId: null, notes: "Depart" },
    ],
    notes: [],
    assumptions: [],
    recommendations: [],
    ...overrides,
  };
}

describe("itinerary requirements", () => {
  it("captures adults, children, child ages, destinations and activities", () => {
    const parsed = itineraryRequirementsSchema.parse({
      companyId: "aha",
      destinationIds: [1],
      activityIds: [31],
      durationDays: 4,
      adults: 2,
      children: 2,
      childAges: [4, 11],
      accommodationCategory: "luxury",
    });
    const req = normalizeItineraryRequirements(parsed);
    assert.equal(req.adults, 2);
    assert.equal(req.children, 2);
    assert.deepEqual(req.childAges, [4, 11]);
    assert.deepEqual(req.destinationIds, [1]);
    assert.deepEqual(req.activityIds, [31]);
    assert.equal(req.accommodationCategory, "luxury");
  });

  it("rejects missing travellers and mismatched child ages", () => {
    const none = itineraryRequirementsSchema.safeParse({ companyId: "aha", durationDays: 3, adults: 0 });
    assert.equal(none.success, false);
    const ages = itineraryRequirementsSchema.safeParse({
      companyId: "aha",
      durationDays: 3,
      adults: 1,
      children: 2,
      childAges: [8],
    });
    assert.equal(ages.success, false);
  });
});

describe("AI itinerary schema", () => {
  it("accepts a valid structured plan", () => {
    const parsed = parseAiItineraryOutput({
      title: "Mara",
      summary: "Game drives",
      duration_days: 2,
      destination_ids: [1],
      days: [
        { day: 1, destination_id: 1, activity_ids: [30], accommodation_id: 100, transport_id: 50, transfer_id: 40 },
        { day: 2, destination_id: 1, activity_ids: [], accommodation_id: 100, transport_id: 50, transfer_id: null },
      ],
    });
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.equal(parsed.plan.days[0]?.accommodationId, 100);
  });

  it("rejects invalid schema and incomplete responses", () => {
    assert.equal(parseAiItineraryOutput({ title: "x" }).ok, false);
    assert.equal(parseAiItineraryOutput(null).ok, false);
    assert.equal(parseAiItineraryOutput("prose itinerary").ok, false);
  });
});

describe("business validation", () => {
  it("rejects nonexistent accommodation, destination, and fabricated activity", () => {
    const req = baseRequirements();
    const unknownAcc = validateItineraryPlan(
      validPlan({
        days: validPlan().days.map((day, i) => (i === 0 ? { ...day, accommodationId: 9999 } : day)),
      }),
      catalog,
      req
    );
    assert.equal(unknownAcc.ok, false);
    if (!unknownAcc.ok) {
      assert.ok(unknownAcc.issues.some((issue) => issue.code === "unknown_accommodation"));
    }

    const unknownDest = validateItineraryPlan(
      validPlan({
        days: validPlan().days.map((day, i) => (i === 0 ? { ...day, destinationId: 888 } : day)),
      }),
      catalog,
      req
    );
    assert.equal(unknownDest.ok, false);
    if (!unknownDest.ok) {
      assert.ok(unknownDest.issues.some((issue) => issue.code === "unknown_destination"));
    }

    const fabricated = validateItineraryPlan(
      validPlan({
        days: validPlan().days.map((day, i) => (i === 0 ? { ...day, activityIds: [777] } : day)),
      }),
      catalog,
      req
    );
    assert.equal(fabricated.ok, false);
    if (!fabricated.ok) {
      assert.ok(fabricated.issues.some((issue) => issue.code === "unknown_activity"));
    }
  });

  it("accepts a catalog-backed plan", () => {
    const result = validateItineraryPlan(validPlan(), catalog, baseRequirements());
    assert.equal(result.ok, true);
  });
});

describe("itinerary pricing", () => {
  it("prices accommodation, transport, park fees, children, markup, currency and rounding in Enzi", () => {
    const quote = quoteItineraryPlan({
      plan: validPlan(),
      catalog,
      requirements: baseRequirements(),
      markupPercent: 20,
      currency: "USD",
    });
    const accNights = 3 * (2 * 100 + 2 * 75) + 1 * (2 * 150 + 2 * Math.round(150 * 0.75));
    const park = 3 * (2 * 200 + 2 * 100) + 2 * (2 * 60 + 2 * 30);
    const transport = 230 * 5;
    const transfer = 50;
    const balloon = 2 * 450 + 2 * 350;
    const hill = 2 * (2 * 20 + 2 * 10);
    const costTotal = accNights + park + transport + transfer + balloon + hill;
    assert.equal(quote.costTotal, costTotal);
    assert.equal(quote.markupPercent, 20);
    assert.equal(quote.markupAmount, Math.round((costTotal * 20) / 100));
    assert.equal(quote.sellingPrice, Math.ceil((costTotal + quote.markupAmount) / 10) * 10);
    assert.ok(quote.components.some((row) => row.type === "accommodation"));
    assert.ok(quote.components.some((row) => row.type === "transport"));
    assert.ok(quote.components.some((row) => row.type === "park_fee"));
    assert.ok(quote.components.every((row) => !("aiPrice" in row.config)));
  });

  it("recalculates when accommodation, destination, or activity changes", () => {
    const requirements = baseRequirements();
    const original = quoteItineraryPlan({
      plan: validPlan(),
      catalog,
      requirements,
      markupPercent: 20,
      currency: "USD",
    });
    const changedAcc = validPlan();
    changedAcc.days = changedAcc.days.map((day) =>
      day.destinationId === 1 ? { ...day, accommodationId: 101 } : day
    );
    const afterAcc = quoteItineraryPlan({
      plan: changedAcc,
      catalog,
      requirements,
      markupPercent: 20,
      currency: "USD",
    });
    assert.ok(afterAcc.sellingPrice > original.sellingPrice);

    const changedDest = validPlan();
    changedDest.days = changedDest.days.map((day) =>
      day.day <= 3
        ? { ...day, destinationId: 2, accommodationId: 102, activityIds: [32] }
        : day
    );
    changedDest.destinationIds = [2];
    const afterDest = quoteItineraryPlan({
      plan: changedDest,
      catalog,
      requirements,
      markupPercent: 20,
      currency: "USD",
    });
    assert.notEqual(afterDest.sellingPrice, original.sellingPrice);

    const changedAct = validPlan();
    changedAct.days[2] = { ...changedAct.days[2]!, activityIds: [30] };
    const afterAct = quoteItineraryPlan({
      plan: changedAct,
      catalog,
      requirements,
      markupPercent: 20,
      currency: "USD",
    });
    assert.ok(afterAct.sellingPrice < original.sellingPrice);
  });
});

describe("itinerary access", () => {
  const record = {
    id: 9,
    publicToken: "tok_a",
    companyId: "aha",
    userId: 3,
    guestEmail: "ada@example.com",
    status: "generated",
  };

  it("blocks a customer from another customer's itinerary", () => {
    const access = itineraryAccess({ kind: "customer", userId: 99, email: "other@example.com" }, record);
    assert.equal(access.view, false);
    assert.equal(access.reason, "not_owner");
  });

  it("blocks tenant A staff from tenant B itineraries", () => {
    const access = itineraryAccess({ kind: "staff", companyId: "ewc", canEdit: true }, record);
    assert.equal(access.view, false);
    assert.equal(access.reason, "tenant_mismatch");
  });

  it("blocks unauthorized staff from modifying itineraries", () => {
    const access = itineraryAccess({ kind: "staff", companyId: "aha", canEdit: false }, record);
    assert.equal(access.view, true);
    assert.equal(access.edit, false);
    assert.equal(access.convert, false);
  });

  it("does not expose private access via the wrong public token", () => {
    const access = itineraryAccess({ kind: "public", token: "wrong" }, record);
    assert.equal(access.view, false);
    assert.equal(access.reason, "token_mismatch");
  });
});

describe("conversion mapping", () => {
  it("preserves priced components for booking conversion", () => {
    const quote = quoteItineraryPlan({
      plan: validPlan(),
      catalog,
      requirements: baseRequirements(),
      markupPercent: 20,
      currency: "USD",
    });
    const drafts = quote.components.map((row) => ({
      type: row.type,
      cost: row.cost,
      sequence: row.sequence,
      config: { ...row.config, label: row.label },
    }));
    assert.ok(drafts.length >= 4);
    assert.equal(
      drafts.reduce((sum, row) => sum + row.cost, 0),
      quote.costTotal
    );
    assert.ok(
      drafts
        .filter((row) => row.type === "accommodation")
        .every((row) => typeof (row.config as { accommodation_id?: unknown }).accommodation_id === "number")
    );
  });
});

describe("heuristic provider", () => {
  it("only selects catalog IDs", async () => {
    const provider = new HeuristicItineraryProvider();
    const result = await provider.generateStructured({
      systemInstruction: "ignore",
      userPayload: { requirements: baseRequirements(), catalog },
    });
    const parsed = parseAiItineraryOutput(result.parsed);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const validated = validateItineraryPlan(parsed.plan, catalog, baseRequirements());
    assert.equal(validated.ok, true);
  });
});
