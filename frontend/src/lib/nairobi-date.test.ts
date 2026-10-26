import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lastNairobiMonthKeys, nairobiYearMonth, nairobiYmd, yearMonthPrefix } from "./nairobi-date";

const NAIROBI_SEPTEMBER = new Date("2026-08-31T22:00:00.000Z");
const NAIROBI_STILL_AUGUST = new Date("2026-08-31T20:59:00.000Z");

describe("Nairobi calendar months", () => {
  it("keeps a YYYY-MM-DD prefix and does not treat it as an instant", () => {
    assert.equal(yearMonthPrefix("2026-08-31"), "2026-08");
    assert.equal(yearMonthPrefix("2026-08-31T22:00:00.000Z"), "2026-08");
    assert.equal(nairobiYmd(NAIROBI_SEPTEMBER), "2026-09-01");
  });

  it("places the Nairobi month boundary on the next calendar month", () => {
    assert.equal(nairobiYearMonth(new Date("2026-08-26T00:00:00.000Z")), "2026-08");
    assert.equal(nairobiYearMonth(NAIROBI_STILL_AUGUST), "2026-08");
    assert.equal(nairobiYearMonth(NAIROBI_SEPTEMBER), "2026-09");
  });

  it("builds the trailing month keys from the Nairobi calendar", () => {
    assert.deepEqual(lastNairobiMonthKeys(6, NAIROBI_STILL_AUGUST), [
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
    assert.deepEqual(lastNairobiMonthKeys(6, NAIROBI_SEPTEMBER), [
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
    assert.deepEqual(lastNairobiMonthKeys(3, new Date("2026-01-01T00:00:00.000Z")), [
      "2025-11",
      "2025-12",
      "2026-01",
    ]);
  });
});
