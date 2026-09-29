import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizePaymentLink } from "./payment-link";
import {
  buildRevenueFieldsFromPayment,
  packageLabelForPayment,
  paymentCountsAsRevenue,
  periodMonthFromDate,
} from "./payment-revenue-pure";

describe("normalizePaymentLink", () => {
  it("fills tour reference from legacy bookingId", () => {
    assert.deepEqual(normalizePaymentLink({ bookingId: 12 }), {
      bookingId: 12,
      referenceType: "tour",
      referenceId: 12,
    });
  });

  it("fills bookingId from tour referenceId", () => {
    assert.deepEqual(
      normalizePaymentLink({ referenceType: "tour", referenceId: 9 }),
      {
        bookingId: 9,
        referenceType: "tour",
        referenceId: 9,
      }
    );
  });

  it("leaves hotel links unchanged", () => {
    assert.deepEqual(
      normalizePaymentLink({ referenceType: "hotel", referenceId: 4 }),
      {
        bookingId: null,
        referenceType: "hotel",
        referenceId: 4,
      }
    );
  });
});

describe("paymentCountsAsRevenue", () => {
  it("only completed payments count", () => {
    assert.equal(paymentCountsAsRevenue("completed"), true);
    assert.equal(paymentCountsAsRevenue("Completed"), true);
    assert.equal(paymentCountsAsRevenue("pending"), false);
    assert.equal(paymentCountsAsRevenue("cancelled"), false);
  });
});

describe("packageLabelForPayment", () => {
  it("labels linked sources", () => {
    assert.match(
      packageLabelForPayment({
        id: 3,
        currency: "KES",
        referenceType: "hotel",
        referenceId: 8,
      }),
      /Hotel stay #8/
    );
    assert.match(
      packageLabelForPayment({
        id: 3,
        currency: "KES",
        bookingId: 11,
      }),
      /Safari booking #11/
    );
  });
});

describe("buildRevenueFieldsFromPayment", () => {
  it("builds amount, period, and label for a completed payment", () => {
    const fields = buildRevenueFieldsFromPayment({
      id: 5,
      amount: 1500.4,
      bookingId: 2,
      referenceType: "tour",
      referenceId: 2,
      currency: "KES",
      recordedAt: new Date("2026-03-15T12:00:00.000Z"),
    });
    assert.equal(fields.amount, 1500);
    assert.equal(fields.periodMonth, "2026-03");
    assert.equal(fields.bookingId, 2);
    assert.match(fields.packageLabel, /Safari booking #2/);
  });
});

describe("periodMonthFromDate", () => {
  it("formats YYYY-MM", () => {
    assert.equal(periodMonthFromDate(new Date("2026-08-26T00:00:00.000Z")), "2026-08");
  });
});
