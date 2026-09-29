import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildStoredCostStack,
  bookingComponentTypeLabel,
  costStackKindLabel,
  priceLineLabel,
  quoteBookingComponents,
  quoteCostStack,
  quoteAllocatedStay,
  quoteHotelStay,
  quoteHotelStayRooms,
  quoteSafariPackage,
  quoteTourSafariPackage,
  resolveBookingKind,
  resolvePackageRatesUsd,
  roundUpToNearestTen,
} from "./pricing";
import { PricingService } from "./pricing-service";

describe("roundUpToNearestTen", () => {
  it("rounds a raw selling price upward", () => {
    assert.equal(roundUpToNearestTen(1843), 1850);
    assert.equal(roundUpToNearestTen(2211), 2220);
  });

  it("leaves an exact ten unchanged", () => {
    assert.equal(roundUpToNearestTen(1850), 1850);
  });

  it("treats empty amounts as zero", () => {
    assert.equal(roundUpToNearestTen(0), 0);
    assert.equal(roundUpToNearestTen(-4), 0);
  });
});

describe("resolvePackageRatesUsd", () => {
  it("uses the adult catalog price for children when no child rate exists", () => {
    assert.deepEqual(resolvePackageRatesUsd({ price: 450 }), {
      adult: 450,
      child: 450,
      infant: 0,
    });
  });

  it("keeps explicit child and infant rates", () => {
    assert.deepEqual(resolvePackageRatesUsd({ price: 450, childPrice: 225, infantPrice: 50 }), {
      adult: 450,
      child: 225,
      infant: 50,
    });
  });
});

describe("quoteSafariPackage", () => {
  it("quotes adults and children at distinct rates then rounds in USD", () => {
    const quote = quoteSafariPackage({
      adultRateUsd: 450,
      childRateUsd: 225,
      infantRateUsd: 0,
      adults: 2,
      children: 1,
      infants: 1,
      currency: "USD",
    });
    assert.equal(quote.subtotal, 1125);
    assert.equal(quote.sellingPrice, 1130);
    assert.equal(quote.roundedUpBy, 5);
    assert.deepEqual(
      quote.lines.map((line) => ({ kind: line.kind, quantity: line.quantity, amount: line.amount })),
      [
        { kind: "adult", quantity: 2, amount: 900 },
        { kind: "child", quantity: 1, amount: 225 },
        { kind: "infant", quantity: 1, amount: 0 },
      ]
    );
  });

  it("rounds in the customer currency after converting from USD", () => {
    const quote = quoteSafariPackage({
      adultRateUsd: 11,
      childRateUsd: 11,
      infantRateUsd: 0,
      adults: 1,
      currency: "KES",
    });
    assert.equal(quote.subtotal, 1425);
    assert.equal(quote.sellingPrice, 1430);
  });
});

describe("quoteTourSafariPackage", () => {
  it("builds a package quote from catalog rates", () => {
    const quote = quoteTourSafariPackage(
      { price: 400, childPrice: 200 },
      { adults: 1, children: 1, infants: 0 },
      "USD"
    );
    assert.equal(quote.sellingPrice, 600);
    assert.equal(priceLineLabel(quote.lines[0]), "1 adult");
    assert.equal(priceLineLabel(quote.lines[1]), "1 child");
  });
});

describe("quoteCostStack", () => {
  it("sums costs, applies markup, then rounds upward to the nearest 10", () => {
    const quote = quoteCostStack({
      currency: "USD",
      markupPercent: 20,
      lines: [
        { kind: "accommodation", amount: 900 },
        { kind: "transport", amount: 500 },
        { kind: "park_fees", amount: 300 },
        { kind: "other", amount: 143 },
      ],
    });
    assert.equal(quote.costTotal, 1843);
    assert.equal(quote.markupAmount, 369);
    assert.equal(quote.baseSellingPrice, 2212);
    assert.equal(quote.sellingPrice, 2220);
    assert.equal(quote.roundedUpBy, 8);
    assert.equal(costStackKindLabel("park_fees"), "Park fees");
  });

  it("ignores empty lines and supports zero markup", () => {
    const quote = quoteCostStack({
      currency: "KES",
      markupPercent: 0,
      lines: [
        { kind: "transport", amount: 0 },
        { kind: "transfers", amount: 1295 },
      ],
    });
    assert.equal(quote.costTotal, 1295);
    assert.equal(quote.markupAmount, 0);
    assert.equal(quote.sellingPrice, 1300);
  });

  it("quotes individual booking components via PricingService", () => {
    const quote = PricingService.quoteComponents({
      currency: "USD",
      markupPercent: 20,
      travellerCounts: { adults: 2, children: 1, infants: 0 },
      components: [
        { type: "accommodation", cost: 900, sequence: 0 },
        { type: "transport", cost: 500, sequence: 1 },
        { type: "park_fee", cost: 300, sequence: 2 },
        { type: "other", cost: 143, sequence: 3 },
      ],
    });
    assert.equal(quote.costTotal, 1843);
    assert.equal(quote.sellingPrice, 2220);
    assert.equal(quote.components.length, 4);
    assert.equal(quote.travellerCounts.adults, 2);
    assert.equal(bookingComponentTypeLabel("park_fee"), "Park fees");
  });

  it("defaults markup to 20% when omitted", () => {
    const quote = quoteBookingComponents({
      currency: "KES",
      components: [{ type: "activity", cost: 1000 }],
    });
    assert.equal(quote.markupPercent, 20);
    assert.equal(quote.markupAmount, 200);
    assert.equal(quote.sellingPrice, 1200);
  });

  it("builds a stored snapshot for persistence", () => {
    const stack = {
      markupPercent: 20,
      accommodation: 900,
      transport: 500,
      parkFees: 300,
      transfers: null,
      activities: null,
      other: 143,
    };
    const quote = quoteCostStack({
      currency: "USD",
      markupPercent: stack.markupPercent,
      lines: [
        { kind: "accommodation", amount: stack.accommodation },
        { kind: "transport", amount: stack.transport },
        { kind: "park_fees", amount: stack.parkFees },
        { kind: "other", amount: stack.other },
      ],
    });
    const stored = buildStoredCostStack(stack, quote);
    assert.equal(stored.quote.sellingPrice, 2220);
    assert.equal(stored.accommodation, 900);
    assert.equal(stored.quote.lines.length, 4);
  });
});

describe("quoteHotelStay", () => {
  it("multiplies nights by nightly rate then rounds up to nearest 10", () => {
    const quote = quoteHotelStay({ nightlyRate: 8500, nights: 3 });
    assert.equal(quote.subtotal, 25500);
    assert.equal(quote.sellingPrice, 25500);
    assert.equal(quote.roundedUpBy, 0);
  });

  it("rounds a non-ten subtotal upward", () => {
    const quote = quoteHotelStay({ nightlyRate: 1234, nights: 2 });
    assert.equal(quote.subtotal, 2468);
    assert.equal(quote.sellingPrice, 2470);
  });

  it("sums multiple rooms before rounding", () => {
    const quote = quoteHotelStayRooms({
      nights: 2,
      rooms: [
        { nightlyRate: 70, quantity: 2 },
        { nightlyRate: 105, quantity: 1 },
      ],
    });
    assert.equal(quote.nightlyRate, 245);
    assert.equal(quote.subtotal, 490);
    assert.equal(quote.sellingPrice, 490);
  });
});

describe("quoteAllocatedStay Enchoro 2026 STO", () => {
  it("quotes resident low-season double tent in KES", () => {
    const quote = quoteAllocatedStay({
      companyId: "ewc",
      checkInDate: "2026-04-10",
      checkOutDate: "2026-04-12",
      guestCategory: "resident",
      adults: 2,
      children: 0,
      rooms: [{ roomTypeName: "Standard Tent - Double", maxOccupancy: 2, quantity: 1 }],
    });
    assert.ok(quote);
    assert.equal(quote.currency, "KES");
    assert.equal(quote.nights, 2);
    assert.equal(quote.nightlyRate, 14000);
    assert.equal(quote.sellingPrice, 28000);
  });

  it("quotes non-resident high-season single tent in USD", () => {
    const quote = quoteAllocatedStay({
      companyId: "ewc",
      checkInDate: "2026-08-01",
      checkOutDate: "2026-08-02",
      guestCategory: "non_resident",
      adults: 1,
      rooms: [{ roomTypeName: "Standard Tent - Single", maxOccupancy: 1, quantity: 1 }],
    });
    assert.ok(quote);
    assert.equal(quote.currency, "USD");
    assert.equal(quote.sellingPrice, 120);
  });

  it("adds extra adult bed and child 75 percent", () => {
    const quote = quoteAllocatedStay({
      companyId: "ewc",
      checkInDate: "2026-05-01",
      checkOutDate: "2026-05-02",
      guestCategory: "resident",
      adults: 3,
      children: 1,
      rooms: [{ roomTypeName: "Standard Tent - Double", maxOccupancy: 2, quantity: 1 }],
    });
    assert.ok(quote);
    assert.equal(quote.subtotal, 14000 + 6000 + 4500);
  });
});

describe("resolveBookingKind", () => {
  it("honours an explicit kind", () => {
    assert.equal(
      resolveBookingKind({ bookingKind: "airport_transfer", pricingSource: "package" }),
      "airport_transfer"
    );
  });

  it("infers predefined safari from package or tour", () => {
    assert.equal(resolveBookingKind({ pricingSource: "package" }), "predefined_safari");
    assert.equal(resolveBookingKind({ tourId: 12 }), "predefined_safari");
  });

  it("infers customized safari from cost stack or defaults", () => {
    assert.equal(resolveBookingKind({ pricingSource: "cost_stack" }), "customized_safari");
    assert.equal(resolveBookingKind({}), "customized_safari");
  });
});
