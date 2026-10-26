import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  inOverviewPeriod,
  overviewPeriodBounds,
  overviewRangeCaption,
  overviewScopeLabel,
  overviewWindow,
  shiftOverviewAnchor,
  upcomingArrivalBounds,
} from "./overview-period";
import { amountSeriesWindow } from "./chart-period";

const today = "2026-10-23";

describe("overviewPeriodBounds", () => {
  it("uses the Nairobi calendar day, Monday week, month-to-date, and year-to-date", () => {
    assert.deepEqual(overviewPeriodBounds("today", today), { start: today, end: today });
    assert.deepEqual(overviewPeriodBounds("week", today), { start: "2026-10-19", end: "2026-10-25" });
    assert.deepEqual(overviewPeriodBounds("month", today), { start: "2026-10-01", end: today });
    assert.deepEqual(overviewPeriodBounds("year", today), { start: "2026-01-01", end: today });
    assert.equal(overviewPeriodBounds("all", today), null);
  });

  it("keeps a Sunday inside the same Monday–Sunday week", () => {
    assert.deepEqual(overviewPeriodBounds("week", "2026-10-25"), { start: "2026-10-19", end: "2026-10-25" });
  });

  it("uses the full previous and next period when the anchor leaves the current one", () => {
    const previousMonth = shiftOverviewAnchor("month", today, -1);
    assert.equal(previousMonth, "2026-09-23");
    assert.deepEqual(overviewPeriodBounds("month", today, previousMonth), {
      start: "2026-09-01",
      end: "2026-09-30",
    });
    const nextWeek = shiftOverviewAnchor("week", today, 1);
    assert.deepEqual(overviewPeriodBounds("week", today, nextWeek), {
      start: "2026-10-26",
      end: "2026-11-01",
    });
    assert.equal(shiftOverviewAnchor("today", today, -1), "2026-10-22");
    assert.equal(shiftOverviewAnchor("year", today, 1), "2027-10-23");
    assert.equal(shiftOverviewAnchor("all", today, 1), today);
    assert.equal(overviewScopeLabel("month", today, previousMonth), "Sep 2026");
    assert.equal(inOverviewPeriod("2026-09-30", "month", today, previousMonth), true);
    assert.equal(inOverviewPeriod("2026-10-01", "month", today, previousMonth), false);
  });
});

describe("overview labels", () => {
  it("names partial presets as to-date while the chip label stays on the preset", () => {
    assert.equal(overviewScopeLabel("week"), "Week to date");
    assert.equal(overviewScopeLabel("month"), "Month to date");
    assert.equal(overviewScopeLabel("year"), "Year to date");
    assert.match(overviewRangeCaption("month", today), /^Month to date · 1 Oct 2026 – 23 Oct 2026$/);
  });
});

describe("upcomingArrivalBounds", () => {
  it("looks forward from today through the end of the preset", () => {
    assert.deepEqual(upcomingArrivalBounds("today", today), { start: today, end: today });
    assert.deepEqual(upcomingArrivalBounds("week", today), { start: today, end: "2026-10-25" });
    assert.deepEqual(upcomingArrivalBounds("month", today), { start: today, end: "2026-10-31" });
    assert.deepEqual(upcomingArrivalBounds("year", today), { start: today, end: "2026-12-31" });
    assert.equal(upcomingArrivalBounds("all", today).start, today);
  });
});

describe("overview charts", () => {
  it("draws this month only through today and this year only through the current month", () => {
    const month = amountSeriesWindow(
      [
        { date: "2026-10-02", amount: 10 },
        { date: "2026-10-24", amount: 99 },
      ],
      overviewWindow("month", today),
      today
    );
    assert.equal(month.length, 23);
    assert.equal(month[0].label, "1 Oct");
    assert.equal(month[1].amount, 10);
    assert.equal(month.at(-1)?.label, "23 Oct");
    assert.equal(
      month.reduce((sum, point) => sum + point.amount, 0),
      10
    );

    const year = amountSeriesWindow(
      [
        { date: "2026-01-04", amount: 5 },
        { date: "2026-11-01", amount: 80 },
      ],
      overviewWindow("year", today),
      today
    );
    assert.equal(year.length, 10);
    assert.equal(year[0].label, "Jan");
    assert.equal(year[0].amount, 5);
    assert.equal(year.at(-1)?.label, "Oct");
    assert.equal(inOverviewPeriod("2026-10-23", "month", today), true);
    assert.equal(inOverviewPeriod("2026-10-24", "month", today), false);
    assert.equal(inOverviewPeriod("2026-10-25", "week", today), true);
    assert.equal(inOverviewPeriod("2026-10-18", "week", today), false);
  });
});
