import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countConfirmedBookings,
  guestCount,
  openBalance,
  paymentCountsTowardRevenue,
  recognizedRevenue,
  sumAmountsInPeriod,
  upcomingArrivals,
  type HotelStayFact,
} from "./overview-metrics";

const today = "2026-10-23";

describe("recognizedRevenue", () => {
  it("counts paid and partial payments once, even when a revenue entry mirrors them", () => {
    const total = recognizedRevenue(
      [
        { id: 1, date: "2026-10-04", amount: 1000, status: "completed", referenceType: "tour", referenceId: 9 },
        { id: 2, date: "2026-10-05", amount: 400, status: "partial", referenceType: "tour", referenceId: 10 },
        { id: 3, date: "2026-10-06", amount: 50, status: "pending", referenceType: "tour", referenceId: 11 },
        { id: 4, date: "2026-09-01", amount: 700, status: "paid" },
      ],
      [
        { date: "2026-10-04", amount: 1000, paymentId: 1, referenceType: "payment", referenceId: 1 },
        { date: "2026-10-04", amount: 1000, paymentId: null, referenceType: "tour", referenceId: 9 },
        { date: "2026-10-08", amount: 250, paymentId: null, referenceType: "tour", referenceId: 12 },
      ],
      "month",
      today
    );
    assert.equal(total, 1650);
    assert.equal(paymentCountsTowardRevenue("partially paid"), true);
    assert.equal(paymentCountsTowardRevenue("cancelled"), false);
  });
});

describe("company overview metrics", () => {
  const stays: HotelStayFact[] = [
    {
      checkIn: "2026-10-20",
      checkOut: "2026-10-28",
      amount: 800,
      guests: 3,
      status: "confirmed",
      balance: 200,
    },
    {
      checkIn: "2026-10-30",
      checkOut: "2026-11-02",
      amount: 500,
      guests: 2,
      status: "pending",
      balance: 500,
    },
    {
      checkIn: "2026-10-10",
      checkOut: "2026-10-12",
      amount: 100,
      guests: 4,
      status: "cancelled",
      balance: 0,
    },
    {
      checkIn: "2026-10-22",
      checkOut: "2026-10-23",
      amount: 90,
      guests: 1,
      status: "checked_out",
      balance: 0,
    },
  ];

  it("counts confirmed safari bookings and enquiries inside the window", () => {
    assert.equal(
      countConfirmedBookings(
        [
          { date: "2026-10-02", status: "confirmed" },
          { date: "2026-10-02", status: "pending" },
          { date: "2026-11-01", status: "confirmed" },
        ],
        "month",
        today
      ),
      1
    );
  });

  it("sums hotel, bar, and restaurant activity for the window and keeps open balances whole", () => {
    assert.equal(
      sumAmountsInPeriod(
        [
          { date: "2026-10-02", amount: 80 },
          { date: "2026-10-24", amount: 20 },
        ],
        "month",
        today
      ),
      80
    );
    assert.equal(guestCount(stays, "month", today), 4);
    assert.equal(upcomingArrivals(stays, "month", today), 1);
    assert.equal(openBalance(stays), 700);
  });
});
