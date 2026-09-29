import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DuplicateIdempotencyError,
  financialEffectAfterPayment,
  normalizeIdempotencyKey,
  rejectDuplicateIdempotency,
} from "./record-payment-pure";
import { getPaymentProvider, providerFromMethod } from "./providers";

describe("financialEffectAfterPayment", () => {
  it("partial payment updates invoice balance and booking status", () => {
    const effect = financialEffectAfterPayment({ total: 10000, completedPaid: 4000 });
    assert.equal(effect.amountPaid, 4000);
    assert.equal(effect.balance, 6000);
    assert.equal(effect.invoiceStatus, "partial");
    assert.equal(effect.bookingPaymentStatus, "partial");
  });

  it("full payment zeroes the balance", () => {
    const effect = financialEffectAfterPayment({ total: 10000, completedPaid: 10000 });
    assert.equal(effect.balance, 0);
    assert.equal(effect.bookingPaymentStatus, "paid");
    assert.equal(effect.invoiceStatus, "paid");
  });

  it("zero collected stays unpaid / issued", () => {
    const effect = financialEffectAfterPayment({ total: 10000, completedPaid: 0 });
    assert.equal(effect.balance, 10000);
    assert.equal(effect.bookingPaymentStatus, "unpaid");
    assert.equal(effect.invoiceStatus, "issued");
  });
});

describe("idempotency", () => {
  it("duplicate idempotency key is rejected", () => {
    assert.throws(() => rejectDuplicateIdempotency(12), DuplicateIdempotencyError);
    assert.doesNotThrow(() => rejectDuplicateIdempotency(null));
    assert.doesNotThrow(() => rejectDuplicateIdempotency(undefined));
  });

  it("blank keys are treated as absent", () => {
    assert.equal(normalizeIdempotencyKey("  "), null);
    assert.equal(normalizeIdempotencyKey("pay-1"), "pay-1");
  });
});

describe("payment providers", () => {
  it("maps display methods to adapter ids", () => {
    assert.equal(providerFromMethod("M-Pesa"), "m-pesa");
    assert.equal(providerFromMethod("Cash"), "cash");
    assert.equal(providerFromMethod("Card"), "card");
    assert.equal(providerFromMethod("Bank"), "bank");
    assert.equal(providerFromMethod("Other"), "manual");
  });

  it("m-pesa adapter is architecture-only (stamps method, no live capture)", () => {
    const prepared = getPaymentProvider("m-pesa").prepare({
      companyId: "aha",
      amount: 500,
    });
    assert.equal(prepared.provider, "m-pesa");
    assert.equal(prepared.method, "M-Pesa");
  });
});
