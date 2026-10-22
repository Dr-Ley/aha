import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { amountSeries, chartBuckets, chartPeriodBounds, inChartPeriod, stackedSeries } from "./chart-period";

const today = "2026-10-19";

describe("chartPeriodBounds", () => {
  it("covers the current month, week, day, last 3 months, and year", () => {
    assert.deepEqual(chartPeriodBounds("month", today), { start: "2026-10-01", end: "2026-10-31" });
    assert.deepEqual(chartPeriodBounds("week", today), { start: "2026-10-19", end: "2026-10-25" });
    assert.deepEqual(chartPeriodBounds("day", today), { start: today, end: today });
    assert.deepEqual(chartPeriodBounds("last3", today), { start: "2026-08-01", end: "2026-10-31" });
    assert.deepEqual(chartPeriodBounds("week", today, -1), { start: "2026-10-12", end: "2026-10-18" });
    assert.deepEqual(chartPeriodBounds("week", today, 1), { start: "2026-10-26", end: "2026-11-01" });
    assert.deepEqual(chartPeriodBounds("day", today, -1), { start: "2026-10-18", end: "2026-10-18" });
    assert.deepEqual(chartPeriodBounds("year", today), { start: "2026-01-01", end: "2026-12-31" });
    assert.equal(chartPeriodBounds("all", today), null);
  });
});

describe("amountSeries", () => {
  it("sums the selected month by day and leaves the other days empty", () => {
    const points = amountSeries(
      [
        { date: "2026-10-02", amount: 100 },
        { date: "2026-09-30", amount: 50 },
        { date: "2026-10-02", amount: 25 },
      ],
      "month",
      today
    );
    assert.equal(points.length, 31);
    assert.equal(points[0].label, "1 Oct");
    assert.equal(points[1].amount, 125);
    assert.equal(points[0].amount, 0);
  });

  it("groups every year from the earliest row through the current year", () => {
    const points = amountSeries(
      [
        { date: "2024-05-01", amount: 10 },
        { date: "2026-01-02", amount: 5 },
      ],
      "all",
      today
    );
    assert.deepEqual(
      points.map((point) => [point.label, point.amount]),
      [
        ["2024", 10],
        ["2025", 0],
        ["2026", 5],
      ]
    );
  });

  it("uses one point for the current day", () => {
    const points = amountSeries([{ date: "2026-10-18", amount: 40 }, { date: today, amount: 7 }], "day", today);
    assert.deepEqual(points, [{ label: "19 Oct 2026", amount: 7 }]);
  });
});

describe("chartBuckets", () => {
  it("uses the last three calendar months and the twelve months of the year", () => {
    assert.deepEqual(
      chartBuckets("last3", today).map((bucket) => bucket.label),
      ["Aug", "Sep", "Oct"]
    );
    assert.deepEqual(
      chartBuckets("last3", "2026-01-15").map((bucket) => bucket.label),
      ["Nov 2025", "Dec 2025", "Jan 2026"]
    );
    assert.equal(chartBuckets("year", today).length, 12);
    assert.equal(chartBuckets("year", today)[0].label, "Jan");
    assert.equal(inChartPeriod("2026-10-19", "week", today), true);
    assert.equal(inChartPeriod("2026-10-18", "week", today), false);
  });
});

describe("stackedSeries", () => {
  it("keeps each series inside the selected week", () => {
    const points = stackedSeries(
      [
        { date: "2026-10-19", safari: 10, hotel: 0, bar: 0 },
        { date: "2026-10-20", safari: 0, hotel: 4, bar: 1 },
        { date: "2026-10-18", safari: 99, hotel: 0, bar: 0 },
      ],
      ["safari", "hotel", "bar"] as const,
      "week",
      today
    );
    assert.equal(points.length, 7);
    assert.equal(points[0].safari, 10);
    assert.equal(points[1].hotel, 4);
    assert.equal(points[1].bar, 1);
    assert.equal(points.reduce((sum, point) => sum + point.safari, 0), 10);
  });
});
