import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publicCatalogCompanyId, tableScope } from "./table-tenancy";

describe("tableScope", () => {
  it("marks identity tables as global", () => {
    assert.equal(tableScope("users"), "global");
    assert.equal(tableScope("companies"), "global");
  });

  it("marks operational tables as tenant", () => {
    assert.equal(tableScope("bookings"), "tenant");
    assert.equal(tableScope("tours"), "tenant");
    assert.equal(tableScope("accommodations"), "tenant");
    assert.equal(tableScope("customers"), "tenant");
    assert.equal(tableScope("invoices"), "tenant");
    assert.equal(tableScope("booking_components"), "global");
    assert.equal(tableScope("booking_versions"), "global");
    assert.equal(tableScope("vehicles"), "tenant");
    assert.equal(tableScope("guides"), "tenant");
    assert.equal(tableScope("properties"), "tenant");
    assert.equal(tableScope("itineraries"), "tenant");
    assert.equal(tableScope("park_fee_rates"), "tenant");
    assert.equal(tableScope("itinerary_components"), "global");
    assert.equal(tableScope("itinerary_versions"), "global");
  });

  it("marks shared tourism reference tables as global", () => {
    assert.equal(tableScope("destinations"), "global");
    assert.equal(tableScope("attractions"), "global");
    assert.equal(tableScope("accommodation_providers"), "global");
    assert.equal(tableScope("vehicle_providers"), "global");
  });

  it("marks previously pending catalogs as tenant", () => {
    assert.equal(tableScope("testimonials"), "tenant");
    assert.equal(tableScope("contact_submissions"), "tenant");
    assert.equal(tableScope("likes"), "tenant");
  });
});

describe("publicCatalogCompanyId", () => {
  it("does not default to aha when companyId is omitted", () => {
    assert.equal(publicCatalogCompanyId(null), null);
    assert.equal(publicCatalogCompanyId(""), null);
    assert.equal(publicCatalogCompanyId("zzz"), null);
  });

  it("accepts a known tenant when provided", () => {
    assert.equal(publicCatalogCompanyId("ewc"), "ewc");
  });
});
