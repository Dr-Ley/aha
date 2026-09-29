import {
  type CurrencyCode,
  usdToWholeInCurrency,
} from "@/lib/data";
import { quoteEnchoroStay } from "@/lib/enchoro-rates-2026";
import {
  normalizeTravellerCounts,
  type TravellerCounts,
} from "@/lib/travellers";

/** Selling prices round upward to the nearest ten in the customer-facing currency. */
export function roundUpToNearestTen(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.ceil(amount / 10) * 10;
}

export type PackageRatesUsd = {
  adult: number;
  child: number;
  infant: number;
};

/** Adult catalog price is required. Missing child rate uses the adult rate; missing infant rate is free. */
export function resolvePackageRatesUsd(tour: {
  price: number;
  childPrice?: number | null;
  infantPrice?: number | null;
}): PackageRatesUsd {
  const adult = Math.max(0, Math.round(Number(tour.price) || 0));
  const child =
    tour.childPrice != null && tour.childPrice !== undefined
      ? Math.max(0, Math.round(Number(tour.childPrice)))
      : adult;
  const infant =
    tour.infantPrice != null && tour.infantPrice !== undefined
      ? Math.max(0, Math.round(Number(tour.infantPrice)))
      : 0;
  return { adult, child, infant };
}

export type PriceLine = {
  kind: "adult" | "child" | "infant";
  quantity: number;
  unitAmount: number;
  amount: number;
};

export type SafariPackageQuote = {
  currency: CurrencyCode;
  ratesUsd: PackageRatesUsd;
  lines: PriceLine[];
  subtotal: number;
  sellingPrice: number;
  roundedUpBy: number;
};

export function quoteSafariPackage(input: {
  adultRateUsd: number;
  childRateUsd: number;
  infantRateUsd: number;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  guests?: number | null;
  currency: CurrencyCode;
}): SafariPackageQuote {
  const counts = normalizeTravellerCounts(input);
  const ratesUsd: PackageRatesUsd = {
    adult: Math.max(0, Math.round(Number(input.adultRateUsd) || 0)),
    child: Math.max(0, Math.round(Number(input.childRateUsd) || 0)),
    infant: Math.max(0, Math.round(Number(input.infantRateUsd) || 0)),
  };
  const adultUnit = usdToWholeInCurrency(ratesUsd.adult, input.currency);
  const childUnit = usdToWholeInCurrency(ratesUsd.child, input.currency);
  const infantUnit = usdToWholeInCurrency(ratesUsd.infant, input.currency);

  const lines: PriceLine[] = [];
  if (counts.adults) {
    lines.push({
      kind: "adult",
      quantity: counts.adults,
      unitAmount: adultUnit,
      amount: adultUnit * counts.adults,
    });
  }
  if (counts.children) {
    lines.push({
      kind: "child",
      quantity: counts.children,
      unitAmount: childUnit,
      amount: childUnit * counts.children,
    });
  }
  if (counts.infants) {
    lines.push({
      kind: "infant",
      quantity: counts.infants,
      unitAmount: infantUnit,
      amount: infantUnit * counts.infants,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const sellingPrice = roundUpToNearestTen(subtotal);
  return {
    currency: input.currency,
    ratesUsd,
    lines,
    subtotal,
    sellingPrice,
    roundedUpBy: sellingPrice - subtotal,
  };
}

export function quoteTourSafariPackage(
  tour: { price: number; childPrice?: number | null; infantPrice?: number | null },
  travellers: TravellerCounts,
  currency: CurrencyCode
): SafariPackageQuote {
  const rates = resolvePackageRatesUsd(tour);
  return quoteSafariPackage({
    adultRateUsd: rates.adult,
    childRateUsd: rates.child,
    infantRateUsd: rates.infant,
    adults: travellers.adults,
    children: travellers.children,
    infants: travellers.infants,
    currency,
  });
}

export function priceLineLabel(line: PriceLine): string {
  if (line.kind === "adult") return `${line.quantity} adult${line.quantity === 1 ? "" : "s"}`;
  if (line.kind === "child") return `${line.quantity} child${line.quantity === 1 ? "" : "ren"}`;
  return `${line.quantity} infant${line.quantity === 1 ? "" : "s"}`;
}

/** Canonical booking component types (Sprint 4 / S4.T1). */
export const BOOKING_COMPONENT_TYPES = [
  "accommodation",
  "transport",
  "park_fee",
  "activity",
  "transfer",
  "other",
] as const;

export type BookingComponentType = (typeof BOOKING_COMPONENT_TYPES)[number];

/** Default company markup when callers omit a percent (S4.T2). */
export const DEFAULT_COMPANY_MARKUP_PERCENT = 20;

/** Legacy aggregated cost-stack kinds (mapped onto BOOKING_COMPONENT_TYPES). */
export const COST_STACK_KINDS = [
  "accommodation",
  "transport",
  "park_fees",
  "transfers",
  "activities",
  "other",
] as const;

export type CostStackKind = (typeof COST_STACK_KINDS)[number];

export type CostStackLine = {
  kind: CostStackKind;
  /** Whole amount already in the quote currency. */
  amount: number;
  label?: string;
};

export type CostStackQuote = {
  currency: CurrencyCode;
  lines: CostStackLine[];
  costTotal: number;
  /** Whole percent, e.g. 20 = 20%. */
  markupPercent: number;
  markupAmount: number;
  baseSellingPrice: number;
  sellingPrice: number;
  roundedUpBy: number;
};

export function costStackKindLabel(kind: CostStackKind): string {
  switch (kind) {
    case "accommodation":
      return "Accommodation";
    case "transport":
      return "Transport";
    case "park_fees":
      return "Park fees";
    case "transfers":
      return "Transfers";
    case "activities":
      return "Activities";
    case "other":
      return "Other costs";
  }
}

export function bookingComponentTypeLabel(type: BookingComponentType): string {
  switch (type) {
    case "accommodation":
      return "Accommodation";
    case "transport":
      return "Transport";
    case "park_fee":
      return "Park fees";
    case "activity":
      return "Activities";
    case "transfer":
      return "Transfers";
    case "other":
      return "Other costs";
  }
}

const COST_STACK_TO_COMPONENT: Record<CostStackKind, BookingComponentType> = {
  accommodation: "accommodation",
  transport: "transport",
  park_fees: "park_fee",
  transfers: "transfer",
  activities: "activity",
  other: "other",
};

const COMPONENT_TO_COST_STACK: Record<BookingComponentType, CostStackKind> = {
  accommodation: "accommodation",
  transport: "transport",
  park_fee: "park_fees",
  activity: "activities",
  transfer: "transfers",
  other: "other",
};

export function costStackKindToComponentType(kind: string): BookingComponentType {
  if ((BOOKING_COMPONENT_TYPES as readonly string[]).includes(kind)) {
    return kind as BookingComponentType;
  }
  if (kind in COST_STACK_TO_COMPONENT) {
    return COST_STACK_TO_COMPONENT[kind as CostStackKind];
  }
  return "other";
}

export function componentTypeToCostStackKind(type: BookingComponentType): CostStackKind {
  return COMPONENT_TO_COST_STACK[type];
}

function wholeNonNegative(value: unknown): number {
  const n = Math.round(Number(value) || 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function applyMarkupAndRound(costTotal: number, markupPercent: number | null | undefined) {
  const pct = Math.max(0, Math.round(Number(markupPercent) || 0));
  const markupAmount = Math.round((costTotal * pct) / 100);
  const baseSellingPrice = costTotal + markupAmount;
  const sellingPrice = roundUpToNearestTen(baseSellingPrice);
  return {
    markupPercent: pct,
    markupAmount,
    baseSellingPrice,
    sellingPrice,
    roundedUpBy: sellingPrice - baseSellingPrice,
  };
}

export type PricingComponentInput = {
  type: BookingComponentType | string;
  cost?: number | null;
  config?: Record<string, unknown> | null;
  sequence?: number | null;
  label?: string | null;
};

export type PricingQuotedComponent = {
  type: BookingComponentType;
  cost: number;
  sequence: number;
  label?: string;
  config: Record<string, unknown>;
};

export type ComponentPricingQuote = {
  currency: CurrencyCode;
  components: PricingQuotedComponent[];
  travellerCounts: TravellerCounts;
  costTotal: number;
  markupPercent: number;
  markupAmount: number;
  baseSellingPrice: number;
  sellingPrice: number;
  roundedUpBy: number;
};

/**
 * Central pricing formula: sum(component costs) + markup, then ceil to nearest 10.
 * Pure — no DB. Markup defaults to 20% when omitted (company default).
 */
export function quoteBookingComponents(input: {
  components: PricingComponentInput[];
  currency: CurrencyCode;
  travellerCounts?: Partial<TravellerCounts> | null;
  /** Whole percent. Defaults to DEFAULT_COMPANY_MARKUP_PERCENT (20). */
  markupPercent?: number | null;
}): ComponentPricingQuote {
  const components: PricingQuotedComponent[] = [];
  input.components.forEach((row, index) => {
    const cost = wholeNonNegative(row.cost);
    if (!cost) return;
    const type = costStackKindToComponentType(String(row.type ?? "other"));
    const config = row.config && typeof row.config === "object" ? row.config : {};
    const label =
      (typeof row.label === "string" && row.label.trim()) ||
      (typeof config.label === "string" && config.label.trim()) ||
      undefined;
    components.push({
      type,
      cost,
      sequence: row.sequence != null ? Math.round(Number(row.sequence)) : index,
      ...(label ? { label } : {}),
      config,
    });
  });
  components.sort((a, b) => a.sequence - b.sequence || a.type.localeCompare(b.type));
  const costTotal = components.reduce((sum, row) => sum + row.cost, 0);
  const priced = applyMarkupAndRound(
    costTotal,
    input.markupPercent == null ? DEFAULT_COMPANY_MARKUP_PERCENT : input.markupPercent
  );
  return {
    currency: input.currency,
    components,
    travellerCounts: normalizeTravellerCounts(input.travellerCounts ?? {}),
    costTotal,
    ...priced,
  };
}

/**
 * Cost-stack pricing: sum components, apply profit markup, then round the selling
 * price upward to the nearest 10 in the customer-facing currency.
 * Amounts must already be in `currency` (convert USD catalog rates before calling).
 */
export function quoteCostStack(input: {
  currency: CurrencyCode;
  lines: Array<{ kind: CostStackKind; amount?: number | null; label?: string }>;
  /** Profit markup as a whole percent of cost total. Defaults to 0. */
  markupPercent?: number | null;
}): CostStackQuote {
  const quote = quoteBookingComponents({
    currency: input.currency,
    markupPercent: input.markupPercent ?? 0,
    components: input.lines.map((line, index) => ({
      type: costStackKindToComponentType(line.kind),
      cost: line.amount,
      label: line.label,
      sequence: index,
    })),
  });
  const lines: CostStackLine[] = [];
  for (const kind of COST_STACK_KINDS) {
    const matches = quote.components.filter(
      (row) => componentTypeToCostStackKind(row.type) === kind
    );
    const amount = matches.reduce((sum, row) => sum + row.cost, 0);
    if (!amount) continue;
    const label = matches.find((row) => row.label)?.label;
    lines.push(label ? { kind, amount, label } : { kind, amount });
  }
  return {
    currency: quote.currency,
    lines,
    costTotal: quote.costTotal,
    markupPercent: quote.markupPercent,
    markupAmount: quote.markupAmount,
    baseSellingPrice: quote.baseSellingPrice,
    sellingPrice: quote.sellingPrice,
    roundedUpBy: quote.roundedUpBy,
  };
}

/** Persistable cost-stack payload: staff inputs plus the engine quote snapshot. */
export type StoredCostStack = {
  markupPercent: number;
  accommodation?: number | null;
  transport?: number | null;
  parkFees?: number | null;
  transfers?: number | null;
  activities?: number | null;
  other?: number | null;
  quote: {
    currency: CurrencyCode;
    costTotal: number;
    markupPercent: number;
    markupAmount: number;
    baseSellingPrice: number;
    sellingPrice: number;
    roundedUpBy: number;
    lines: CostStackLine[];
  };
};

export function buildStoredCostStack(
  stack: {
    markupPercent: number;
    accommodation?: number | null;
    transport?: number | null;
    parkFees?: number | null;
    transfers?: number | null;
    activities?: number | null;
    other?: number | null;
  },
  quote: CostStackQuote
): StoredCostStack {
  return {
    markupPercent: stack.markupPercent,
    accommodation: stack.accommodation ?? null,
    transport: stack.transport ?? null,
    parkFees: stack.parkFees ?? null,
    transfers: stack.transfers ?? null,
    activities: stack.activities ?? null,
    other: stack.other ?? null,
    quote: {
      currency: quote.currency,
      costTotal: quote.costTotal,
      markupPercent: quote.markupPercent,
      markupAmount: quote.markupAmount,
      sellingPrice: quote.sellingPrice,
      baseSellingPrice: quote.baseSellingPrice,
      roundedUpBy: quote.roundedUpBy,
      lines: quote.lines,
    },
  };
}

/** Inclusive night count between YYYY-MM-DD check-in and check-out (noon UTC). */
export function calcStayNights(checkInDate: string, checkOutDate: string): number {
  const a = new Date(`${checkInDate}T12:00:00.000Z`);
  const b = new Date(`${checkOutDate}T12:00:00.000Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

export type HotelStayQuote = {
  currency: CurrencyCode;
  nights: number;
  nightlyRate: number;
  subtotal: number;
  sellingPrice: number;
  roundedUpBy: number;
};

/** Hotel stay selling price: nights × nightly rate, then round up to nearest 10. */
export function quoteHotelStay(input: {
  nightlyRate: number;
  nights: number;
  currency?: CurrencyCode;
}): HotelStayQuote {
  return quoteHotelStayRooms({
    nights: input.nights,
    currency: input.currency,
    rooms: [{ nightlyRate: input.nightlyRate, quantity: 1 }],
  });
}

/** Multi-room stay quote. Each room contributes nightlyRate × quantity × nights. */
export function quoteHotelStayRooms(input: {
  nights: number;
  rooms: Array<{ nightlyRate: number; quantity?: number }>;
  currency?: CurrencyCode;
}): HotelStayQuote {
  const nights = Math.max(0, Math.round(Number(input.nights) || 0));
  let nightlyRate = 0;
  for (const room of input.rooms) {
    const qty = Math.max(1, Math.round(Number(room.quantity) || 1));
    nightlyRate += Math.max(0, Math.round(Number(room.nightlyRate) || 0)) * qty;
  }
  const subtotal = nights * nightlyRate;
  const sellingPrice = roundUpToNearestTen(subtotal);
  return {
    currency: input.currency ?? "KES",
    nights,
    nightlyRate,
    subtotal,
    sellingPrice,
    roundedUpBy: sellingPrice - subtotal,
  };
}

export function quoteAllocatedStay(input: {
  companyId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCategory?: string | null;
  adults?: number;
  children?: number;
  rooms: Array<{
    nightlyRate?: number | null;
    roomTypeName?: string | null;
    maxOccupancy?: number | null;
    quantity?: number;
  }>;
}): HotelStayQuote | null {
  if (input.companyId === "ewc") {
    return quoteEnchoroStay({
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      guestCategory: input.guestCategory === "non_resident" ? "non_resident" : "resident",
      adults: input.adults,
      children: input.children,
      rooms: input.rooms,
    });
  }
  if (input.rooms.length === 0) return null;
  if (input.rooms.some((room) => room.nightlyRate == null || !Number.isFinite(Number(room.nightlyRate)))) {
    return null;
  }
  return quoteHotelStayRooms({
    nights: calcStayNights(input.checkInDate, input.checkOutDate),
    currency: "KES",
    rooms: input.rooms.map((room) => ({
      nightlyRate: Number(room.nightlyRate),
      quantity: room.quantity,
    })),
  });
}

/** Safari booking product kinds (E5.1) — light classifier, not a full component graph. */
export const BOOKING_KINDS = [
  "predefined_safari",
  "customized_safari",
  "accommodation_only",
  "airport_transfer",
  "vehicle_hire",
] as const;

export type BookingKind = (typeof BOOKING_KINDS)[number];

export function bookingKindLabel(kind: BookingKind): string {
  switch (kind) {
    case "predefined_safari":
      return "Predefined safari";
    case "customized_safari":
      return "Customized safari";
    case "accommodation_only":
      return "Accommodation only";
    case "airport_transfer":
      return "Airport transfer";
    case "vehicle_hire":
      return "Vehicle hire";
  }
}

export function resolveBookingKind(input: {
  bookingKind?: string | null;
  pricingSource?: string | null;
  tourId?: number | null;
}): BookingKind {
  if (input.bookingKind && (BOOKING_KINDS as readonly string[]).includes(input.bookingKind)) {
    return input.bookingKind as BookingKind;
  }
  if (input.pricingSource === "package" || input.tourId != null) return "predefined_safari";
  if (input.pricingSource === "cost_stack") return "customized_safari";
  return "customized_safari";
}


