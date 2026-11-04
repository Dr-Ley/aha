import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { amountSeriesWindow } from "./chart-period";
import { chartsFromPoints } from "./overview-aggregate";
import { overviewWindow } from "./overview-period";

describe("overview charts from aggregated points", () => {
  it("uses the same month buckets as the existing chart window", () => {
    const today = "2026-10-27";
    const rows = [
      { date: "2026-10-02", amount: 100 },
      { date: "2026-10-02", amount: 50 },
      { date: "2026-09-30", amount: 999 },
    ];
    const charts = chartsFromPoints(
      {
        revenue: rows,
        safariPaid: [],
        safariAll: [],
        hotelPaid: [],
        hotelAll: [],
        barChart: [],
        barLedger: [],
        barPaid: [],
        restaurantAll: [],
        restaurantPaid: [],
        countries: [{ name: "Kenya", amount: 0 }],
        durations: [],
        barProducts: [],
        restaurantProducts: [],
        expenses: [],
      },
      "month",
      today,
      today,
      { safari: true, hotel: false, bar: false, restaurant: false }
    );
    const expected = amountSeriesWindow(rows, overviewWindow("month", today, today), today);
    assert.deepEqual(charts.revenueLine, expected);
    assert.equal(charts.revenueLine[0]?.label, "1 Oct");
    assert.equal(charts.revenueLine[1]?.amount, 150);
    assert.equal(charts.revenueLine.at(-1)?.amount, 0);
    assert.deepEqual(charts.countries, [{ country: "No bookings", amount: 0 }]);
    assert.deepEqual(charts.safariSlices, [{ name: "No bookings", value: 1 }]);
    assert.equal(charts.finance[1]?.revenue, 0);
    assert.equal(charts.finance[1]?.profit, 0);
  });

  it("adds only the modules the company uses, then subtracts expenses", () => {
    const today = "2026-10-27";
    const charts = chartsFromPoints(
      {
        revenue: [],
        safariPaid: [],
        safariAll: [{ date: "2026-10-02", amount: 1000 }],
        hotelPaid: [],
        hotelAll: [{ date: "2026-10-02", amount: 400 }],
        barChart: [],
        barLedger: [{ date: "2026-10-03", amount: 50 }],
        barPaid: [],
        restaurantAll: [{ date: "2026-10-03", amount: 25 }],
        restaurantPaid: [],
        countries: [],
        durations: [],
        barProducts: [],
        restaurantProducts: [],
        expenses: [
          { date: "2026-10-02", amount: 200 },
          { date: "2026-10-03", amount: 80 },
        ],
      },
      "month",
      today,
      today,
      { safari: true, hotel: true, bar: true, restaurant: false }
    );
    const oct2 = charts.finance.find((row) => row.label === "2 Oct");
    const oct3 = charts.finance.find((row) => row.label === "3 Oct");
    assert.equal(oct2?.revenue, 1400);
    assert.equal(oct2?.expenses, 200);
    assert.equal(oct2?.profit, 1200);
    assert.equal(oct3?.revenue, 50);
    assert.equal(oct3?.expenses, 80);
    assert.equal(oct3?.profit, -30);
  });
});

describe("overview query boundaries", () => {
  it("keeps company filters parameterized and drops the unused invoice read", () => {
    const aggregate = readFileSync(new URL("./overview-aggregate.ts", import.meta.url), "utf8");
    const route = readFileSync(new URL("../app/api/dashboard/overview/route.ts", import.meta.url), "utf8");
    assert.equal(aggregate.includes("company_id = '"), false);
    assert.equal(aggregate.includes("b.company_id = ${companyId}"), true);
    assert.equal(aggregate.includes("p.company_id = ${companyId}"), true);
    assert.equal(aggregate.includes("hb.company_id = ${companyId}"), true);
    assert.equal(route.includes("invoices"), false);
    assert.equal(route.includes("requireTenantContext"), true);
    assert.equal(route.includes('module: "overview"'), true);
  });
});
