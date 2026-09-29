import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeTravellerCounts,
  occupantGuestLabel,
  parseOccupantGuests,
  parseOccupantNames,
  payingTravellerCount,
  travellerCountsLabel,
  travellerHeadcount,
} from "./travellers";

describe("normalizeTravellerCounts", () => {
  it("treats a legacy guest count as adults", () => {
    assert.deepEqual(normalizeTravellerCounts({ guests: 3 }), {
      adults: 3,
      children: 0,
      infants: 0,
    });
  });

  it("keeps an explicit age split", () => {
    assert.deepEqual(normalizeTravellerCounts({ adults: 2, children: 1, infants: 1 }), {
      adults: 2,
      children: 1,
      infants: 1,
    });
  });
});

describe("payingTravellerCount", () => {
  it("does not charge infants at the website rate", () => {
    assert.equal(payingTravellerCount({ adults: 2, children: 1, infants: 1 }), 3);
    assert.equal(travellerHeadcount({ adults: 2, children: 1, infants: 1 }), 4);
  });
});

describe("parseOccupantNames", () => {
  it("accepts a JSON array of names", () => {
    assert.deepEqual(parseOccupantNames([" Mary ", "", "Peter"]), ["Mary", "Peter"]);
  });

  it("accepts objects with a name field from older payloads", () => {
    assert.deepEqual(parseOccupantNames([{ name: "Jane Kamau" }]), ["Jane Kamau"]);
  });
});

describe("parseOccupantGuests", () => {
  it("keeps name and email from object rows", () => {
    assert.deepEqual(parseOccupantGuests([{ name: "Jane Kamau", email: "jane@example.com" }]), [
      { name: "Jane Kamau", email: "jane@example.com" },
    ]);
  });

  it("treats legacy name strings as guests without email", () => {
    assert.deepEqual(parseOccupantGuests(["Mary"]), [{ name: "Mary", email: "" }]);
  });

  it("formats a guest for display", () => {
    assert.equal(
      occupantGuestLabel({ name: "Jane Kamau", email: "jane@example.com" }),
      "Jane Kamau (jane@example.com)"
    );
  });
});

describe("travellerCountsLabel", () => {
  it("formats a mixed party", () => {
    assert.equal(
      travellerCountsLabel({ adults: 1, children: 2, infants: 1 }),
      "1 adult, 2 children, 1 infant"
    );
  });
});
