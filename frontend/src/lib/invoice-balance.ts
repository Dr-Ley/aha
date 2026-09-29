export type InvoicePayStatus = "unpaid" | "partial" | "paid";
export type InvoiceRecordStatus = "issued" | "partial" | "paid";

export type InvoiceLineDraft = {
  description: string;
  quantity: number;
  unitAmount: number;
};

export function formatInvoiceNumber(id: number): string {
  return `INV-${String(id).padStart(4, "0")}`;
}

export function invoiceLineTotal(quantity: number, unitAmount: number): number {
  const q = Math.max(1, Math.round(Number(quantity) || 1));
  const unit = Math.round(Number(unitAmount) || 0);
  return q * unit;
}

export function invoiceSubtotal(lines: InvoiceLineDraft[]): number {
  return lines.reduce((sum, line) => sum + invoiceLineTotal(line.quantity, line.unitAmount), 0);
}

export function invoiceBalance(total: number, amountPaid: number): number {
  return Math.max(0, Math.round(Number(total) || 0) - Math.max(0, Math.round(Number(amountPaid) || 0)));
}

export function invoicePaymentStatus(total: number, amountPaid: number): InvoicePayStatus {
  const t = Math.max(0, Math.round(Number(total) || 0));
  const paid = Math.max(0, Math.round(Number(amountPaid) || 0));
  if (paid <= 0) return "unpaid";
  if (t > 0 && paid >= t) return "paid";
  if (t === 0 && paid > 0) return "paid";
  return "partial";
}

export function invoiceRecordStatus(total: number, amountPaid: number): InvoiceRecordStatus {
  const pay = invoicePaymentStatus(total, amountPaid);
  if (pay === "paid") return "paid";
  if (pay === "partial") return "partial";
  return "issued";
}

export function safariInvoiceLines(input: {
  safariPackage?: string | null;
  originalAmount?: number | null;
  totalPrice?: number | null;
  costStackLines?: { kind?: string; amount?: number; label?: string }[] | null;
  componentLines?: { type?: string; cost?: number; label?: string; config?: Record<string, unknown> | null }[] | null;
}): InvoiceLineDraft[] {
  const componentLines = (input.componentLines ?? []).filter((line) => Number(line.cost) > 0);
  if (componentLines.length > 0) {
    return componentLines.map((line) => {
      const configLabel =
        line.config && typeof line.config.label === "string" ? line.config.label : null;
      return {
        description: (line.label || configLabel || line.type || "Item").trim() || "Item",
        quantity: 1,
        unitAmount: Math.round(Number(line.cost) || 0),
      };
    });
  }
  const quoteLines = (input.costStackLines ?? []).filter((line) => Number(line.amount) > 0);
  if (quoteLines.length > 0) {
    return quoteLines.map((line) => ({
      description: (line.label || line.kind || "Item").trim() || "Item",
      quantity: 1,
      unitAmount: Math.round(Number(line.amount) || 0),
    }));
  }
  const amount = Math.round(Number(input.originalAmount ?? input.totalPrice ?? 0) || 0);
  return [
    {
      description: input.safariPackage?.trim() || "Safari booking",
      quantity: 1,
      unitAmount: amount,
    },
  ];
}

export function hotelInvoiceLines(input: {
  roomLabel?: string | null;
  nights?: number | null;
  totalAmount?: number | null;
}): InvoiceLineDraft[] {
  const nights = Math.max(1, Math.round(Number(input.nights) || 1));
  const total = Math.round(Number(input.totalAmount) || 0);
  const room = input.roomLabel?.trim() || "Accommodation";
  return [
    {
      description: `${room} · ${nights} night${nights === 1 ? "" : "s"}`,
      quantity: 1,
      unitAmount: total,
    },
  ];
}
