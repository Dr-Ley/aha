import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { amountInWordsKes, getCompanyLetterhead } from "./letterhead";
import {
  buildBookingVoucherModel,
  buildHotelServiceVoucherModel,
  buildInvoiceDocumentModel,
  buildPaymentReceiptModel,
} from "./models";

describe("amountInWordsKes", () => {
  it("converts common amounts", () => {
    assert.match(amountInWordsKes(14000), /Fourteen thousand/i);
    assert.match(amountInWordsKes(42), /Forty-two/i);
  });
});

describe("getCompanyLetterhead", () => {
  it("returns AHA and EWC letterheads from paper forms", () => {
    assert.match(getCompanyLetterhead("aha").legalName, /African Home Adventure/i);
    assert.match(getCompanyLetterhead("ewc").legalName, /Enchoro/i);
    assert.match(getCompanyLetterhead("ewc").email, /enchorowildlifecamp/i);
    assert.equal(getCompanyLetterhead("aha").logo, null);
  });

  it("attaches companies.logo image link onto the letterhead", () => {
    const headed = getCompanyLetterhead("aha", { logo: " /AHA_logo.png " });
    assert.equal(headed.logo, "/AHA_logo.png");
    assert.equal(getCompanyLetterhead("ewc", { logo: "" }).logo, null);
  });
});

describe("buildBookingVoucherModel", () => {
  it("maps safari booking fields onto the AHA voucher shape", () => {
    const model = buildBookingVoucherModel({
      companyId: "aha",
      bookingId: 441,
      firstName: "Barend",
      lastName: "Lar Grange",
      adults: 35,
      safariPackage: "Carnivore dinner",
      travelDate: "2026-09-02",
      country: "Netherlands",
      paymentStatus: "unpaid",
      originalAmount: 1470,
      originalCurrency: "USD",
    });
    assert.equal(model.kind, "booking-voucher");
    assert.equal(model.documentNumber, "441");
    assert.match(model.clientName, /Barend/);
    assert.equal(model.clientCategory, "non_resident");
    assert.match(model.partySizeLabel ?? "", /35/);
    assert.match(model.instructions, /Carnivore/);
    assert.equal(model.letterhead.logo, null);
  });

  it("passes company logo through to the voucher letterhead", () => {
    const model = buildBookingVoucherModel({
      companyId: "aha",
      bookingId: 1,
      logo: "https://cdn.example.com/aha.png",
    });
    assert.equal(model.letterhead.logo, "https://cdn.example.com/aha.png");
  });

  it("uses the editable voucher supplier name", () => {
    const model = buildBookingVoucherModel({
      companyId: "aha",
      bookingId: 2,
      toCompanyName: "  Mara Explorer Camp  ",
    });
    assert.equal(model.toCompanyName, "Mara Explorer Camp");
  });
});

describe("buildHotelServiceVoucherModel", () => {
  it("maps hotel stay fields onto the EWC service voucher shape", () => {
    const model = buildHotelServiceVoucherModel({
      companyId: "ewc",
      stayId: 15,
      primaryGuestName: "FOUNTAIN GROUP OF SCHOOLS-MWEA",
      adults: 3,
      children: 31,
      externalCompany: "Denvin Tours and Safaris",
      status: "confirmed",
      notes: "Extras to be paid by the client",
      checkInDate: "2026-08-17",
      checkOutDate: "2026-08-18",
      nights: 1,
      roomLabel: "SUPERIOR TENTS",
      mealType: "full_board",
      totalAmount: 0,
    });
    assert.equal(model.reservationNumber, "0015");
    assert.equal(model.totalGuests, 34);
    assert.equal(model.agentName, "Denvin Tours and Safaris");
    assert.equal(model.lines[0].description, "SUPERIOR TENTS");
    assert.match(model.lines[1].description, /Check-in/);
  });
});

describe("buildPaymentReceiptModel", () => {
  it("maps payment fields onto the EWC receipt shape", () => {
    const model = buildPaymentReceiptModel({
      companyId: "ewc",
      paymentId: 3664,
      amount: 14000,
      currency: "KES",
      receivedFrom: "Solive Travel LTD",
      checkInDate: "2026-09-18",
      checkOutDate: "2026-09-20",
      referenceType: "hotel",
      mealType: "full_board",
      amountWords: "Fourteen thousand shillings only",
      status: "completed",
    });
    assert.equal(model.receiptNumber, "3664");
    assert.equal(model.receivedFrom, "Solive Travel LTD");
    assert.equal(model.beingPaymentOf.fullBoard, true);
    assert.equal(model.balanceLabel, "NIL");
  });
});

describe("buildInvoiceDocumentModel", () => {
  it("shows line items and remaining balance", () => {
    const model = buildInvoiceDocumentModel({
      companyId: "aha",
      invoiceNumber: "INV-0012",
      billTo: "Barend Lar Grange",
      status: "partial",
      currency: "KES",
      lines: [{ description: "Mara safari", quantity: 1, unitAmount: 50000, lineTotal: 50000 }],
      subtotal: 50000,
      amountPaid: 20000,
      balance: 30000,
    });
    assert.equal(model.kind, "invoice");
    assert.equal(model.invoiceNumber, "INV-0012");
    assert.match(model.amountPaidLabel, /20/);
    assert.match(model.balanceLabel, /30/);
  });
});
