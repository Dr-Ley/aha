"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { NotificationEntity } from "@/lib/notify";

export type EntityPreviewKind = NotificationEntity;

type Field = { label: string; value: unknown };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function displayValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.map(displayValue).join(", ");
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function humanLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
}

function flattenFields(value: unknown, prefix = ""): Field[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenFields(item, `${prefix}${index + 1}.`));
  }
  if (typeof value !== "object") return [{ label: prefix.replace(/\.$/, "") || "Value", value }];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => {
    const label = `${prefix}${humanLabel(key)}`;
    if (entry && typeof entry === "object" && !Array.isArray(entry)) return flattenFields(entry, `${label}.`);
    return [{ label, value: entry }];
  });
}

function titleForKind(kind: EntityPreviewKind): string {
  switch (kind) {
    case "booking":
      return "Tour booking";
    case "hotel":
      return "Hotel booking";
    case "payment":
      return "Payment";
    case "expense":
      return "Expense";
    case "restaurant":
      return "Restaurant order";
    case "bar":
      return "Bar order";
    case "enquiry":
      return "Enquiry";
  }
}

function fullLinkText(kind: EntityPreviewKind): string {
  switch (kind) {
    case "booking":
      return "view full booking";
    case "payment":
      return "view full payment";
    default:
      return "view full details";
  }
}

function summaryFields(kind: EntityPreviewKind, payload: unknown): Field[] {
  const row = asRecord(payload);
  const order = asRecord(row.order);
  const base = Object.keys(order).length ? order : row;
  switch (kind) {
    case "booking":
      return [
        { label: "Guest", value: [base.firstName, base.lastName].filter(Boolean).join(" ") },
        { label: "Email", value: base.email },
        { label: "Safari", value: base.safariPackage ?? asRecord(base.tour).title },
        { label: "Travel date", value: base.startDate ?? base.travelDate },
        { label: "Payment status", value: base.paymentStatus },
      ];
    case "hotel":
      return [
        { label: "Room", value: asRecord(base.room).code ?? base.roomId },
        { label: "Check in", value: base.checkInDate },
        { label: "Check out", value: base.checkOutDate },
        { label: "Payment status", value: base.paymentStatus },
        { label: "Reservation", value: base.status },
      ];
    case "payment":
      return [
        { label: "Amount", value: `${base.currency ?? ""} ${base.amount ?? ""}`.trim() },
        { label: "Method", value: base.method },
        { label: "Status", value: base.status },
        { label: "Reference", value: base.referenceType ? `${base.referenceType} #${base.referenceId}` : base.bookingId },
      ];
    case "expense":
      return [
        { label: "Category", value: base.category },
        { label: "Amount", value: `${base.currency ?? ""} ${base.amount ?? ""}`.trim() },
        { label: "Date", value: base.expenseDate ?? base.createdAt },
        { label: "Notes", value: base.notes },
      ];
    case "restaurant":
    case "bar":
      return [
        { label: "Table / ref", value: base.tableLabel ?? base.customerName },
        { label: "Status", value: base.status },
        { label: "Created", value: base.createdAt },
        { label: "Line items", value: Array.isArray(row.lineItems) ? row.lineItems.length : 0 },
      ];
    case "enquiry":
      return [
        { label: "Name", value: [base.firstName, base.lastName].filter(Boolean).join(" ") },
        { label: "Email", value: base.email },
        { label: "Phone", value: base.phone },
        { label: "Subject", value: base.subject },
        { label: "Status", value: base.status },
      ];
  }
}

type EntityViewModalProps = {
  open: boolean;
  onClose: () => void;
  companyId: string;
  kind: EntityPreviewKind | null;
  entityId: number | null;
};

export function EntityViewModal({ open, onClose, companyId, kind, entityId }: EntityViewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open || !kind || entityId == null) {
      setPayload(null);
      setError(null);
      setExpanded(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setExpanded(false);
    const qs = new URLSearchParams({
      type: kind,
      id: String(entityId),
      companyId,
    });
    fetch(`/api/dashboard/entity-preview?${qs}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Failed to load");
        if (!cancelled) setPayload(j.data ?? j);
      })
      .catch((e) => {
        if (!cancelled) {
          setPayload(null);
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, kind, entityId, companyId]);

  if (!open || !kind || entityId == null) return null;

  const title = titleForKind(kind);
  const summaries = summaryFields(kind, payload);
  const fullFields = flattenFields(payload);

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold">
            {title} #{entityId}
          </h3>
          <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {loading && <p className="mt-4 text-sm text-base-content/60">Loading…</p>}
        {error && (
          <p className="mt-4 text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && payload !== null && (
          <div className="mt-4 space-y-4">
            <dl className="grid gap-3 rounded-lg bg-base-200/50 p-3 sm:grid-cols-2">
              {summaries.map((field) => (
                <div key={field.label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-base-content/50">{field.label}</dt>
                  <dd className="mt-1 break-words text-sm text-base-content">{displayValue(field.value)}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              className="text-sm font-medium text-blue-600 underline underline-offset-2"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "hide full details" : fullLinkText(kind)}
            </button>
            {expanded ? (
              <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-base-content/10">
                <dl className="divide-y divide-base-content/10">
                  {fullFields.map((field, index) => (
                    <div key={`${field.label}-${index}`} className="grid gap-1 px-3 py-2 sm:grid-cols-3">
                      <dt className="text-xs font-medium text-base-content/50">{field.label}</dt>
                      <dd className="break-words text-sm text-base-content sm:col-span-2">{displayValue(field.value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        )}
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <button type="button" className="modal-backdrop bg-black/40" aria-label="Close dialog" onClick={onClose} />
    </dialog>
  );
}
