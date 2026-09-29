import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookings,
  companies,
  hotelBookings,
  payments,
  rooms,
} from "@/lib/schema";
import { ensureCompanyLogoColumn } from "@/lib/ensure-company-logo";
import { ensureVoucherToCompanyColumn } from "@/lib/ensure-finance-documents";
import { getInvoiceById } from "@/lib/invoice-service";
import { amountInWordsKes } from "@/lib/documents/letterhead";
import {
  buildBookingVoucherModel,
  buildHotelServiceVoucherModel,
  buildInvoiceDocumentModel,
  buildPaymentReceiptModel,
  type DocumentKind,
  type DocumentModel,
} from "@/lib/documents/models";

async function loadCompanyLogo(companyId: string): Promise<string | null> {
  await ensureCompanyLogoColumn();
  const [row] = await db
    .select({ logo: companies.logo })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  const logo = row?.logo?.trim();
  return logo || null;
}

export async function loadDocumentModel(input: {
  kind: DocumentKind;
  id: number;
  companyId: string;
  preparedName?: string | null;
}): Promise<DocumentModel | null> {
  const { kind, id, companyId, preparedName } = input;
  const logo = await loadCompanyLogo(companyId);

  if (kind === "invoice") {
    const invoice = await getInvoiceById(companyId, id);
    if (!invoice) return null;
    let billTo = `Reference #${invoice.referenceId}`;
    if (invoice.referenceType === "tour") {
      const [b] = await db
        .select()
        .from(bookings)
        .where(and(eq(bookings.id, invoice.referenceId), eq(bookings.companyId, companyId)))
        .limit(1);
      if (b) {
        billTo = [b.firstName, b.lastName].filter(Boolean).join(" ").trim() || b.email;
      }
    } else if (invoice.referenceType === "hotel") {
      const [h] = await db
        .select()
        .from(hotelBookings)
        .where(and(eq(hotelBookings.id, invoice.referenceId), eq(hotelBookings.companyId, companyId)))
        .limit(1);
      if (h) {
        billTo =
          h.externalCompany?.trim() ||
          h.primaryGuestName?.trim() ||
          `Hotel stay #${h.id}`;
      }
    }
    return buildInvoiceDocumentModel({
      companyId,
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      billTo,
      status: invoice.status,
      currency: invoice.currency,
      lines: invoice.items,
      subtotal: invoice.subtotal,
      amountPaid: invoice.amountPaid,
      balance: invoice.balance,
      notes: invoice.notes,
      logo,
    });
  }

  if (kind === "booking-voucher") {
    await ensureVoucherToCompanyColumn();
    const [row] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.companyId, companyId)))
      .limit(1);
    if (!row) return null;
    return buildBookingVoucherModel({
      companyId,
      bookingId: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      adults: row.adults,
      children: row.children,
      infants: row.infants,
      guests: row.guests,
      safariPackage: row.safariPackage,
      tripCountry: row.tripCountry,
      travelDate: row.travelDate,
      startDate: row.startDate,
      endDate: row.endDate,
      specialRequests: row.specialRequests,
      paymentStatus: row.paymentStatus,
      originalAmount: row.originalAmount,
      originalCurrency: row.originalCurrency,
      totalPrice: row.totalPrice,
      country: row.country,
      preparedName,
      createdAt: row.createdAt,
      logo,
      toCompanyName: row.voucherToCompany,
    });
  }

  if (kind === "hotel-service-voucher") {
    const [row] = await db
      .select({
        stay: hotelBookings,
        roomCode: rooms.code,
        roomName: rooms.name,
      })
      .from(hotelBookings)
      .leftJoin(rooms, eq(hotelBookings.roomId, rooms.id))
      .where(and(eq(hotelBookings.id, id), eq(hotelBookings.companyId, companyId)))
      .limit(1);
    if (!row) return null;
    const roomLabel = row.roomCode
      ? `${row.roomCode}${row.roomName ? ` — ${row.roomName}` : ""}`
      : `Room #${row.stay.roomId}`;
    return buildHotelServiceVoucherModel({
      companyId,
      stayId: row.stay.id,
      primaryGuestName: row.stay.primaryGuestName,
      adults: row.stay.adults,
      children: row.stay.children,
      infants: row.stay.infants,
      externalCompany: row.stay.externalCompany,
      status: row.stay.status,
      notes: row.stay.notes,
      checkInDate: String(row.stay.checkInDate),
      checkOutDate: String(row.stay.checkOutDate),
      nights: row.stay.nights,
      roomLabel,
      mealType: row.stay.mealType,
      totalAmount: row.stay.totalAmount,
      preparedBy: preparedName,
      createdAt: row.stay.createdAt,
      logo,
    });
  }

  const [pay] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, id), eq(payments.companyId, companyId)))
    .limit(1);
  if (!pay) return null;

  let receivedFrom = `Payment #${pay.id}`;
  let checkInDate: string | null = null;
  let checkOutDate: string | null = null;
  let safariStartDate: string | null = null;
  let safariEndDate: string | null = null;
  let mealType: string | null = null;

  const refType = String(pay.referenceType ?? "").toLowerCase();
  const refId = pay.referenceId ?? pay.bookingId;

  if ((refType === "tour" || refType === "") && refId != null) {
    const [b] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, refId), eq(bookings.companyId, companyId)))
      .limit(1);
    if (b) {
      receivedFrom = [b.firstName, b.lastName].filter(Boolean).join(" ").trim() || b.email;
      safariStartDate = String(b.startDate ?? b.travelDate ?? "").slice(0, 10) || null;
      safariEndDate = b.endDate ? String(b.endDate).slice(0, 10) : null;
    }
  } else if (refType === "hotel" && refId != null) {
    const [h] = await db
      .select()
      .from(hotelBookings)
      .where(and(eq(hotelBookings.id, refId), eq(hotelBookings.companyId, companyId)))
      .limit(1);
    if (h) {
      receivedFrom =
        h.externalCompany?.trim() ||
        h.primaryGuestName?.trim() ||
        `Hotel stay #${h.id}`;
      checkInDate = String(h.checkInDate).slice(0, 10);
      checkOutDate = String(h.checkOutDate).slice(0, 10);
      mealType = h.mealType;
    }
  }

  const amountWords =
    (pay.currency || "KES").toUpperCase() === "KES"
      ? amountInWordsKes(pay.amount)
      : `${Math.round(pay.amount)} ${(pay.currency || "").toUpperCase()} only`;

  return buildPaymentReceiptModel({
    companyId,
    paymentId: pay.id,
    amount: pay.amount,
    currency: pay.currency,
    method: pay.method,
    status: pay.status,
    receivedFrom,
    checkInDate,
    checkOutDate,
    safariStartDate,
    safariEndDate,
    referenceType: pay.referenceType,
    mealType,
    amountWords,
    officialName: preparedName,
    recordedAt: pay.recordedAt,
    logo,
  });
}
