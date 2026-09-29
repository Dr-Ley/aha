import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  inferDestinationSlug,
  REQUIRED_DESTINATION_SLUGS,
  TOURISM_ATTRACTIONS,
  TOURISM_DESTINATIONS,
} from "./destinations-data";
import { AHA_GUIDES } from "./guides-data";
import { toTourismSlug } from "./slug";
import { AHA_OWNED_VEHICLES } from "./vehicles-data";
import { DESTINATION_CONTENT, PARK_FEE_SEEDS } from "./itinerary-catalog-data";

describe("toTourismSlug", () => {
  it("produces kebab-case without punctuation", () => {
    assert.equal(toTourismSlug("Maasai Mara"), "maasai-mara");
    assert.equal(toTourismSlug("Ngorongoro"), "ngorongoro");
    assert.equal(toTourismSlug("  Lake Nakuru  "), "lake-nakuru");
  });
});

describe("tourism seed data", () => {
  it("has unique destination slugs including required parks", () => {
    const slugs = TOURISM_DESTINATIONS.map((d) => d.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const required of REQUIRED_DESTINATION_SLUGS) {
      assert.ok(slugs.includes(required), `missing ${required}`);
    }
  });

  it("attaches every attraction to a known destination", () => {
    const destSlugs = new Set(TOURISM_DESTINATIONS.map((d) => d.slug));
    for (const attr of TOURISM_ATTRACTIONS) {
      assert.ok(destSlugs.has(attr.destinationSlug), attr.destinationSlug);
      assert.ok(attr.name.length > 0);
      assert.ok(attr.type.length > 0);
    }
  });

  it("seeds three AHA-owned vehicles with unique registrations", () => {
    assert.equal(AHA_OWNED_VEHICLES.length, 3);
    assert.ok(AHA_OWNED_VEHICLES.every((v) => v.companyId === "aha" && v.ownership === "owned"));
    const regs = AHA_OWNED_VEHICLES.map((v) => v.registration);
    assert.equal(new Set(regs).size, 3);
  });

  it("seeds an AHA employee guide", () => {
    assert.ok(AHA_GUIDES.some((g) => g.companyId === "aha" && g.type === "employee"));
  });

  it("has published SEO content and park fees for core Kenya parks", () => {
    const slugs = DESTINATION_CONTENT.map((row) => row.slug);
    for (const required of ["nairobi", "maasai-mara", "amboseli", "lake-nakuru", "tsavo-east", "tsavo-west"]) {
      assert.ok(slugs.includes(required), required);
    }
    assert.ok(DESTINATION_CONTENT.every((row) => row.published && row.seoTitle && row.metaDescription));
    const feeSlugs = PARK_FEE_SEEDS.map((row) => row.destinationSlug);
    for (const required of ["maasai-mara", "amboseli", "nairobi"]) {
      assert.ok(feeSlugs.includes(required), required);
    }
  });
});

describe("inferDestinationSlug", () => {
  it("maps lodging text to destination slugs", () => {
    assert.equal(inferDestinationSlug("Near Oloolaimutia Gate, Maasai Mara"), "maasai-mara");
    assert.equal(inferDestinationSlug("Serengeti, Tanzania"), "serengeti");
    assert.equal(inferDestinationSlug("Ngorongoro Crater Rim"), "ngorongoro");
    assert.equal(inferDestinationSlug("unknown lodge"), null);
  });
});
