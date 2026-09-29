import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  breakdownSummary,
  dateRangeForPreset,
  formatWeekFromLabel,
  parseWeekPeriod,
  salesTotal,
  soldLines,
  weekOverlapsRange,
  weekPeriodLabel,
} from "./weekly-bar";

describe("parseWeekPeriod", () => {
  it("reads the stored EWC week range", () => {
    assert.deepEqual(parseWeekPeriod("27/06/2026 - 03/07/2026"), {
      start: "2026-06-27",
      end: "2026-07-03",
    });
  });

  it("accepts an en-dash", () => {
    assert.equal(parseWeekPeriod("21/03/2026 – 27/03/2026")?.start, "2026-03-21");
  });
});

describe("formatWeekFromLabel", () => {
  it("formats a short management label", () => {
    assert.equal(formatWeekFromLabel("27/06/2026 - 03/07/2026"), "27 Jun – 03 Jul 2026");
  });
});

describe("week helpers", () => {
  it("builds the stored table_label format", () => {
    assert.equal(weekPeriodLabel("2026-06-27", "2026-07-03"), "27/06/2026 - 03/07/2026");
  });

  it("filters by the week period, not created_at", () => {
    const week = parseWeekPeriod("27/06/2026 - 03/07/2026");
    assert.equal(weekOverlapsRange(week, "2026-07-01", "2026-07-31"), true);
    assert.equal(weekOverlapsRange(week, "2026-08-01", "2026-08-31"), false);
  });

  it("computes this-year bounds in Nairobi", () => {
    const range = dateRangeForPreset("this_year", new Date("2026-09-29T10:00:00+03:00"));
    assert.deepEqual(range, { from: "2026-01-01", to: "2026-12-31" });
  });
});

describe("soldLines", () => {
  it("omits zero-quantity products and sums sales", () => {
    const lines = soldLines([
      { itemName: "Beer", quantity: 4, lineTotal: 1600 },
      { name: "Water", quantity: 10, lineTotal: 2000 },
      { name: "Sodas", quantity: 12, lineTotal: 1200 },
      { name: "Wine", quantity: 0, lineTotal: 0 },
    ]);
    assert.deepEqual(lines.map((l) => l.name), ["Beer", "Water", "Sodas"]);
    assert.equal(salesTotal(lines), 4800);
    assert.equal(breakdownSummary(lines), "Beer 4 · Water 10 · Sodas 12");
  });
});
