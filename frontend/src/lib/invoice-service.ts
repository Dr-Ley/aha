import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookings,
  hotelBookings,
  invoiceItems,
  invoices,
  payments,
  rooms,
} from "@/lib/schema";
import { ensureInvoiceTables } from "@/lib/ensure-finance-documents";
import {
  formatInvoiceNumber,
  hotelInvoiceLines,
  invoiceBalance,
  invoiceLineTotal,
  invoicePaymentStatus,
  invoiceRecordStatus,
  invoiceSubtotal,
  safariInvoiceLines,
  type InvoiceLineDraft,
} from "@/lib/invoice-balance";

export type InvoiceSourceType = "tour" | "hotel";

export type InvoiceWithItems = typeof invoices.$inferSelect & {
  items: (typeof invoiceItems.$inferSelect)[];
};

function isSourceType(value: string | null | undefined): value is InvoiceSourceType {
  return value === "tour" || value === "hotel";
}

async function loadSourceLines(
  companyId: string,
  referenceType: InvoiceSourceType,
  referenceId: number
): Promise<{ lines: InvoiceLineDraft[]; currency: string; notes: string | null } | null> {
  if (referenceType === "tour") {
    const [row] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, referenceId), eq(bookings.companyId, companyId)))
      .limit(1);
    if (!row) return null;
    const { listComponentsForBooking } = await import("@/lib/booking-components");
    const components = await listComponentsForBooking(row.id);
    return {
      lines: safariInvoiceLines({
        safariPackage: row.safariPackage,
        originalAmount: row.originalAmount,
        totalPrice: row.totalPrice,
        costStackLines: row.costStack?.quote?.lines ?? null,
        componentLines: components.map((row) => ({
          type: row.type,
          cost: row.cost,
          config: row.config,
        })),
      }),
      currency: (row.originalCurrency || "KES").toUpperCase(),
      notes: row.specialRequests ?? null,
    };
  }

  const [row] = await db
    .select({
      stay: hotelBookings,
      roomCode: rooms.code,
      roomName: rooms.name,
    })
    .from(hotelBookings)
    .leftJoin(rooms, eq(hotelBookings.roomId, rooms.id))
    .where(and(eq(hotelBookings.id, referenceId), eq(hotelBookings.companyId, companyId)))
    .limit(1);
  if (!row) return null;
  const roomLabel = row.roomCode
    ? `${row.roomCode}${row.roomName ? ` — ${row.roomName}` : ""}`
    : `Room #${row.stay.roomId}`;
  return {
    lines: hotelInvoiceLines({
      roomLabel,
      nights: row.stay.nights,
      totalAmount: row.stay.totalAmount,
    }),
    currency: "KES",
    notes: row.stay.notes ?? null,
  };
}

async function sumCompletedPayments(
  companyId: string,
  referenceType: InvoiceSourceType,
  referenceId: number
): Promise<number> {
  const rows = await db
    .select({ amount: payments.amount, status: payments.status })
    .from(payments)
    .where(
      and(
        eq(payments.companyId, companyId),
        eq(payments.referenceType, referenceType),
        eq(payments.referenceId, referenceId)
      )
    );
  return rows
    .filter((row) => String(row.status).toLowerCase() === "completed")
    .reduce((sum, row) => sum + Math.round(Number(row.amount) || 0), 0);
}

async function replaceItems(invoiceId: number, lines: InvoiceLineDraft[]): Promise<void> {
  await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  if (lines.length === 0) return;
  await db.insert(invoiceItems).values(
    lines.map((line, index) => ({
      invoiceId,
      description: line.description.slice(0, 512),
      quantity: Math.max(1, Math.round(line.quantity || 1)),
      unitAmount: Math.round(line.unitAmount || 0),
      lineTotal: invoiceLineTotal(line.quantity, line.unitAmount),
      sequence: index,
    }))
  );
}

async function applyBalances(
  invoice: typeof invoices.$inferSelect,
  amountPaid: number
): Promise<typeof invoices.$inferSelect> {
  const balance = invoiceBalance(invoice.total, amountPaid);
  const status = invoiceRecordStatus(invoice.total, amountPaid);
  const [updated] = await db
    .update(invoices)
    .set({
      amountPaid,
      balance,
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.id, invoice.id), eq(invoices.companyId, invoice.companyId)))
    .returning();
  return updated ?? { ...invoice, amountPaid, balance, status };
}

async function syncSourcePaymentStatus(
  companyId: string,
  referenceType: InvoiceSourceType,
  referenceId: number,
  total: number,
  amountPaid: number
): Promise<void> {
  const paymentStatus = invoicePaymentStatus(total, amountPaid);
  if (referenceType === "tour") {
    await db
      .update(bookings)
      .set({ paymentStatus, updatedAt: new Date() })
      .where(and(eq(bookings.id, referenceId), eq(bookings.companyId, companyId)));
    return;
  }
  await db
    .update(hotelBookings)
    .set({ paymentStatus, amountPaid, updatedAt: new Date() })
    .where(and(eq(hotelBookings.id, referenceId), eq(hotelBookings.companyId, companyId)));
}

async function loadWithItems(
  companyId: string,
  invoiceId: number
): Promise<InvoiceWithItems | null> {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.companyId, companyId)))
    .limit(1);
  if (!invoice) return null;
  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoice.id))
    .orderBy(asc(invoiceItems.sequence));
  return { ...invoice, items };
}

export async function getInvoiceById(
  companyId: string,
  invoiceId: number
): Promise<InvoiceWithItems | null> {
  await ensureInvoiceTables();
  return loadWithItems(companyId, invoiceId);
}

export async function getInvoiceForSource(
  companyId: string,
  referenceType: InvoiceSourceType,
  referenceId: number
): Promise<InvoiceWithItems | null> {
  await ensureInvoiceTables();
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        eq(invoices.referenceType, referenceType),
        eq(invoices.referenceId, referenceId)
      )
    )
    .limit(1);
  if (!invoice) return null;
  return loadWithItems(companyId, invoice.id);
}

/** Create or refresh an invoice from the live booking/stay, then apply payment balances. */
export async function ensureInvoiceForSource(
  companyId: string,
  referenceType: InvoiceSourceType,
  referenceId: number
): Promise<InvoiceWithItems | null> {
  await ensureInvoiceTables();
  const source = await loadSourceLines(companyId, referenceType, referenceId);
  if (!source) return null;

  const subtotal = invoiceSubtotal(source.lines);
  const existing = await getInvoiceForSource(companyId, referenceType, referenceId);
  let invoice = existing;

  if (!invoice) {
    const [created] = await db
      .insert(invoices)
      .values({
        companyId,
        referenceType,
        referenceId,
        invoiceNumber: `TMP-${companyId}-${referenceType}-${referenceId}`,
        status: "issued",
        currency: source.currency,
        subtotal,
        total: subtotal,
        amountPaid: 0,
        balance: subtotal,
        notes: source.notes,
      })
      .returning();
    const number = formatInvoiceNumber(created.id);
    const [numbered] = await db
      .update(invoices)
      .set({ invoiceNumber: number, updatedAt: new Date() })
      .where(eq(invoices.id, created.id))
      .returning();
    invoice = { ...(numbered ?? { ...created, invoiceNumber: number }), items: [] };
  } else if (invoice.status !== "void") {
    const [updated] = await db
      .update(invoices)
      .set({
        currency: source.currency,
        subtotal,
        total: subtotal,
        notes: source.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(invoices.id, invoice.id), eq(invoices.companyId, companyId)))
      .returning();
    invoice = { ...(updated ?? invoice), items: invoice.items };
  }

  if (invoice.status !== "void") {
    await replaceItems(invoice.id, source.lines);
  }

  const amountPaid = await sumCompletedPayments(companyId, referenceType, referenceId);
  const balanced = await applyBalances(invoice, amountPaid);
  await syncSourcePaymentStatus(companyId, referenceType, referenceId, balanced.total, amountPaid);
  return loadWithItems(companyId, balanced.id);
}

export async function syncInvoiceForPaymentLink(input: {
  companyId: string;
  referenceType?: string | null;
  referenceId?: number | null;
  bookingId?: number | null;
}): Promise<void> {
  const referenceType = isSourceType(input.referenceType)
    ? input.referenceType
    : input.bookingId != null
      ? "tour"
      : null;
  const referenceId = input.referenceId ?? input.bookingId ?? null;
  if (!referenceType || referenceId == null) return;
  await ensureInvoiceForSource(input.companyId, referenceType, referenceId);
}
