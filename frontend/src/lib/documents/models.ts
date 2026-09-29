import { getCompanyLetterhead, type CompanyLetterhead } from "@/lib/documents/letterhead";

export const DOCUMENT_KINDS = [
  "booking-voucher",
  "hotel-service-voucher",
  "payment-receipt",
  "invoice",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export function isDocumentKind(value: string): value is DocumentKind {
  return (DOCUMENT_KINDS as readonly string[]).includes(value);
}

export type BookingVoucherModel = {
  kind: "booking-voucher";
  letterhead: CompanyLetterhead;
  documentTitle: string;
  documentNumber: string;
  clientName: string;
  clientCategory: "resident" | "non_resident" | "unknown";
  partySizeLabel: string | null;
  toCompanyName: string | null;
  reserveFlags: {
    hotel: boolean;
    lodge: boolean;
    camping: boolean;
    lunch: boolean;
    dinner: boolean;
    transport: boolean;
  };
  instructions: string;
  formOfPayment: string | null;
  totalEnclosedLabel: string | null;
  remark: string | null;
  preparedName: string | null;
  createdOn: string;
};

export type HotelServiceVoucherModel = {
  kind: "hotel-service-voucher";
  letterhead: CompanyLetterhead;
  documentTitle: string;
  reservationNumber: string;
  preparedBy: string | null;
  createdOn: string;
  guestName: string;
  adults: number;
  children: number;
  totalGuests: number;
  agentName: string | null;
  status: string;
  specialRequests: string | null;
  lines: {
    description: string;
    nightsPeriod: string;
    pax: number | null;
    units: number | null;
    paxPerUnit: number | null;
  }[];
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  roomLabel: string;
  totalAmountLabel: string;
};

export type InvoiceDocumentModel = {
  kind: "invoice";
  letterhead: CompanyLetterhead;
  documentTitle: string;
  invoiceNumber: string;
  date: string;
  billTo: string;
  status: string;
  currency: string;
  lines: {
    description: string;
    quantity: number;
    unitAmountLabel: string;
    lineTotalLabel: string;
  }[];
  subtotalLabel: string;
  amountPaidLabel: string;
  balanceLabel: string;
  notes: string | null;
};

export type PaymentReceiptModel = {
  kind: "payment-receipt";
  letterhead: CompanyLetterhead;
  documentTitle: string;
  receiptNumber: string;
  date: string;
  receivedFrom: string;
  amountWords: string;
  amountFigures: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  safariStartDate: string | null;
  safariEndDate: string | null;
  beingPaymentOf: {
    accommodation: boolean;
    fullBoard: boolean;
    halfBoard: boolean;
    tours: boolean;
    food: boolean;
    others: boolean;
  };
  depositPaidLabel: string;
  balanceLabel: string;
  method: string | null;
  officialName: string | null;
};

export type DocumentModel =
  | BookingVoucherModel
  | HotelServiceVoucherModel
  | PaymentReceiptModel
  | InvoiceDocumentModel;

export function buildBookingVoucherModel(input: {
  companyId: string;
  bookingId: number;
  firstName?: string | null;
  lastName?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  guests?: number | null;
  safariPackage?: string | null;
  tripCountry?: string | null;
  travelDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  specialRequests?: string | null;
  paymentStatus?: string | null;
  originalAmount?: number | null;
  originalCurrency?: string | null;
  totalPrice?: number | null;
  country?: string | null;
  preparedName?: string | null;
  createdAt?: Date | string | null;
  logo?: string | null;
  toCompanyName?: string | null;
}): BookingVoucherModel {
  const letterhead = getCompanyLetterhead(input.companyId, { logo: input.logo });
  const clientName =
    [input.firstName, input.lastName].filter(Boolean).join(" ").trim() || "Guest";
  const adults = Number(input.adults ?? 0) || 0;
  const children = Number(input.children ?? 0) || 0;
  const infants = Number(input.infants ?? 0) || 0;
  const legacy = Number(input.guests ?? 0) || 0;
  const pax = Math.max(adults + children + infants, legacy, 1);
  const start = String(input.startDate ?? input.travelDate ?? "").slice(0, 10);
  const end = String(input.endDate ?? "").slice(0, 10);
  const amount =
    input.originalAmount != null
      ? `${(input.originalCurrency ?? "KES").toUpperCase()} ${Math.round(input.originalAmount)}`
      : input.totalPrice != null
        ? `KES ${Math.round(input.totalPrice)}`
        : null;

  const instructions = [
    input.safariPackage ? `Package: ${input.safariPackage}.` : null,
    start ? `Travel / start date: ${start}.` : null,
    end ? `End date: ${end}.` : null,
    input.specialRequests?.trim() || null,
  ]
    .filter(Boolean)
    .join(" ");

  const category: BookingVoucherModel["clientCategory"] =
    input.country && /kenya/i.test(input.country) ? "resident" : input.country ? "non_resident" : "unknown";

  return {
    kind: "booking-voucher",
    letterhead,
    documentTitle: "BOOKING VOUCHER",
    documentNumber: String(input.bookingId),
    clientName,
    clientCategory: category,
    partySizeLabel: `× ${pax} pax`,
    toCompanyName: input.toCompanyName?.trim() || null,
    reserveFlags: {
      hotel: false,
      lodge: false,
      camping: false,
      lunch: false,
      dinner: false,
      transport: true,
    },
    instructions: instructions || "Kindly confirm this booking.",
    formOfPayment: input.paymentStatus === "paid" ? "Cash / transfer (paid)" : null,
    totalEnclosedLabel: amount,
    remark: input.paymentStatus ? `Payment status: ${input.paymentStatus}` : null,
    preparedName: input.preparedName ?? null,
    createdOn: formatDocDate(input.createdAt),
  };
}

export function buildHotelServiceVoucherModel(input: {
  companyId: string;
  stayId: number;
  primaryGuestName?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  externalCompany?: string | null;
  status?: string | null;
  notes?: string | null;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  roomLabel: string;
  mealType?: string | null;
  totalAmount: number;
  preparedBy?: string | null;
  createdAt?: Date | string | null;
  logo?: string | null;
}): HotelServiceVoucherModel {
  const letterhead = getCompanyLetterhead(input.companyId, { logo: input.logo });
  const adults = Math.max(0, Number(input.adults ?? 0) || 0);
  const children = Math.max(0, Number(input.children ?? 0) || 0);
  const infants = Math.max(0, Number(input.infants ?? 0) || 0);
  const totalGuests = Math.max(1, adults + children + infants || 1);
  const checkIn = String(input.checkInDate).slice(0, 10);
  const checkOut = String(input.checkOutDate).slice(0, 10);
  const meal =
    input.mealType === "full_board"
      ? "Full board"
      : input.mealType === "half_board"
        ? "Half board"
        : input.mealType === "bed_only"
          ? "Bed only"
          : null;

  const lines: HotelServiceVoucherModel["lines"] = [
    {
      description: input.roomLabel || "Accommodation",
      nightsPeriod: String(input.nights),
      pax: totalGuests,
      units: 1,
      paxPerUnit: totalGuests,
    },
    {
      description: `Check-in: ${checkIn} — Check-out: ${checkOut}${meal ? ` (${meal})` : ""}`,
      nightsPeriod: "",
      pax: null,
      units: null,
      paxPerUnit: null,
    },
  ];

  return {
    kind: "hotel-service-voucher",
    letterhead,
    documentTitle: "Service Voucher",
    reservationNumber: String(input.stayId).padStart(4, "0"),
    preparedBy: input.preparedBy ?? null,
    createdOn: formatDocDate(input.createdAt),
    guestName: input.primaryGuestName?.trim() || "Guest",
    adults,
    children,
    totalGuests,
    agentName: input.externalCompany?.trim() || null,
    status: input.status ?? "pending",
    specialRequests: input.notes?.trim() || null,
    lines,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    nights: input.nights,
    roomLabel: input.roomLabel,
    totalAmountLabel: `KSh ${Math.round(input.totalAmount).toLocaleString("en-KE")}`,
  };
}

export function buildPaymentReceiptModel(input: {
  companyId: string;
  paymentId: number;
  amount: number;
  currency: string;
  method?: string | null;
  status?: string | null;
  receivedFrom: string;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  safariStartDate?: string | null;
  safariEndDate?: string | null;
  referenceType?: string | null;
  mealType?: string | null;
  amountWords: string;
  balanceLabel?: string | null;
  officialName?: string | null;
  recordedAt?: Date | string | null;
  logo?: string | null;
}): PaymentReceiptModel {
  const letterhead = getCompanyLetterhead(input.companyId, { logo: input.logo });
  const ref = String(input.referenceType ?? "").toLowerCase();
  const meal = input.mealType;
  const cur = (input.currency || "KES").toUpperCase();
  const figures =
    cur === "KES"
      ? Math.round(input.amount).toLocaleString("en-KE")
      : `${cur} ${Math.round(input.amount).toLocaleString("en-US")}`;

  return {
    kind: "payment-receipt",
    letterhead,
    documentTitle: "RECEIPT",
    receiptNumber: String(input.paymentId),
    date: formatDocDate(input.recordedAt),
    receivedFrom: input.receivedFrom.trim() || "Guest",
    amountWords: input.amountWords,
    amountFigures: figures,
    checkInDate: input.checkInDate ? String(input.checkInDate).slice(0, 10) : null,
    checkOutDate: input.checkOutDate ? String(input.checkOutDate).slice(0, 10) : null,
    safariStartDate: input.safariStartDate ? String(input.safariStartDate).slice(0, 10) : null,
    safariEndDate: input.safariEndDate ? String(input.safariEndDate).slice(0, 10) : null,
    beingPaymentOf: {
      accommodation: ref === "hotel" || meal === "bed_only",
      fullBoard: meal === "full_board",
      halfBoard: meal === "half_board",
      tours: ref === "tour" || ref === "",
      food: meal === "full_board" || meal === "half_board",
      others: ref === "bar" || ref === "restaurant",
    },
    depositPaidLabel: figures,
    balanceLabel: input.balanceLabel ?? (input.status === "completed" ? "NIL" : "—"),
    method: input.method ?? null,
    officialName: input.officialName ?? null,
  };
}

function moneyLabel(currency: string, amount: number): string {
  const cur = (currency || "KES").toUpperCase();
  const n = Math.round(Number(amount) || 0);
  return cur === "KES"
    ? `KSh ${n.toLocaleString("en-KE")}`
    : `${cur} ${n.toLocaleString("en-US")}`;
}

export function buildInvoiceDocumentModel(input: {
  companyId: string;
  invoiceNumber: string;
  issuedAt?: Date | string | null;
  billTo: string;
  status: string;
  currency: string;
  lines: { description: string; quantity: number; unitAmount: number; lineTotal: number }[];
  subtotal: number;
  amountPaid: number;
  balance: number;
  notes?: string | null;
  logo?: string | null;
}): InvoiceDocumentModel {
  const letterhead = getCompanyLetterhead(input.companyId, { logo: input.logo });
  const cur = (input.currency || "KES").toUpperCase();
  return {
    kind: "invoice",
    letterhead,
    documentTitle: "INVOICE",
    invoiceNumber: input.invoiceNumber,
    date: formatDocDate(input.issuedAt),
    billTo: input.billTo.trim() || "Guest",
    status: input.status,
    currency: cur,
    lines: input.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitAmountLabel: moneyLabel(cur, line.unitAmount),
      lineTotalLabel: moneyLabel(cur, line.lineTotal),
    })),
    subtotalLabel: moneyLabel(cur, input.subtotal),
    amountPaidLabel: moneyLabel(cur, input.amountPaid),
    balanceLabel: moneyLabel(cur, input.balance),
    notes: input.notes?.trim() || null,
  };
}

function formatDocDate(value?: Date | string | null): string {
  if (!value) {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
