import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatInvoiceNumber,
  hotelInvoiceLines,
  invoiceBalance,
  invoicePaymentStatus,
  invoiceRecordStatus,
  invoiceSubtotal,
  safariInvoiceLines,
} from "./invoice-balance";

describe("invoiceBalance", () => {
  it("never goes below zero", () => {
    assert.equal(invoiceBalance(1000, 400), 600);
    assert.equal(invoiceBalance(1000, 1000), 0);
    assert.equal(invoiceBalance(1000, 1400), 0);
  });
});

describe("invoicePaymentStatus", () => {
  it("maps unpaid / partial / paid", () => {
    assert.equal(invoicePaymentStatus(1000, 0), "unpaid");
    assert.equal(invoicePaymentStatus(1000, 400), "partial");
    assert.equal(invoicePaymentStatus(1000, 1000), "paid");
    assert.equal(invoiceRecordStatus(1000, 400), "partial");
    assert.equal(invoiceRecordStatus(1000, 0), "issued");
  });
});

describe("safariInvoiceLines", () => {
  it("uses cost-stack quote lines when present", () => {
    const lines = safariInvoiceLines({
      safariPackage: "Mara",
      originalAmount: 9000,
      costStackLines: [
        { kind: "accommodation", amount: 5000, label: "Lodge" },
        { kind: "transport", amount: 2000 },
      ],
    });
    assert.equal(lines.length, 2);
    assert.equal(invoiceSubtotal(lines), 7000);
    assert.equal(lines[0].description, "Lodge");
  });

  it("prefers booking component lines", () => {
    const lines = safariInvoiceLines({
      safariPackage: "Mara",
      originalAmount: 9000,
      componentLines: [
        { type: "accommodation", cost: 4000, label: "Mara lodge" },
        { type: "park_fee", cost: 1500 },
      ],
    });
    assert.equal(lines.length, 2);
    assert.equal(lines[0].description, "Mara lodge");
    assert.equal(invoiceSubtotal(lines), 5500);
  });

  it("falls back to a single package line", () => {
    const lines = safariInvoiceLines({
      safariPackage: "Amboseli 3D2N",
      originalAmount: 1470,
    });
    assert.equal(lines.length, 1);
    assert.equal(lines[0].unitAmount, 1470);
  });
});

describe("hotelInvoiceLines", () => {
  it("describes nights and uses the stay total", () => {
    const lines = hotelInvoiceLines({
      roomLabel: "SUPERIOR TENTS",
      nights: 2,
      totalAmount: 28000,
    });
    assert.match(lines[0].description, /2 nights/);
    assert.equal(lines[0].unitAmount, 28000);
  });
});

describe("formatInvoiceNumber", () => {
  it("pads invoice ids", () => {
    assert.equal(formatInvoiceNumber(15), "INV-0015");
  });
});
