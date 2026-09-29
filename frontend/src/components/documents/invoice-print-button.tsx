"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

export function InvoicePrintButton({
  companyId,
  referenceType,
  referenceId,
}: {
  companyId: string;
  referenceType: "tour" | "hotel";
  referenceId: number;
}) {
  const [busy, setBusy] = useState(false);

  async function openInvoice(e: React.MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, referenceType, referenceId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.invoice?.id) {
        throw new Error(typeof data.error === "string" ? data.error : "Invoice failed");
      }
      window.open(
        `/print/invoice/${data.invoice.id}?companyId=${encodeURIComponent(companyId)}`,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-ghost btn-xs btn-square"
      onClick={openInvoice}
      disabled={busy}
      aria-label="Print invoice"
      title="Print invoice"
    >
      <FileText className="h-3.5 w-3.5" />
    </button>
  );
}
