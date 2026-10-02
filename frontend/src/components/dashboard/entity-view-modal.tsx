"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { NotificationEntity } from "@/lib/notify";
import {
  bookingComponentTypeLabel,
  bookingKindLabel,
  costStackKindLabel,
  costStackKindToComponentType,
  resolveBookingKind,
  type CostStackKind,
} from "@/lib/pricing";
import {
  occupantGuestLabel,
  parseOccupantGuests,
  normalizeTravellerCounts,
  travellerCountsLabel,
} from "@/lib/travellers";
import { formatKesForDisplay } from "@/lib/data";
import {
  breakdownSummary,
  formatDayFromLabel,
  formatWeekFromLabel,
  itemsSoldTotal,
  parseDayLabel,
  parseWeekPeriod,
  salesTotal,
  soldLines,
} from "@/lib/weekly-bar";
import { orderPayLabel } from "@/lib/dashboard-status-badges";
import { safariSourceLabel, stayRoomCount, stayRoomsLabel, staySourceLabel } from "@/lib/stay-labels";

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

function isIdFieldKey(key: string): boolean {
  const last = key.split(".").pop()?.replace(/\s+/g, "") ?? key;
  return /^(id|.+id)$/i.test(last);
}

function flattenFields(value: unknown, prefix = ""): Field[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenFields(item, `${prefix}${index + 1}.`));
  }
  if (typeof value !== "object") return [{ label: prefix.replace(/\.$/, "") || "Value", value }];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => {
    if (isIdFieldKey(key)) return [];
    const label = `${prefix}${humanLabel(key)}`;
    if (entry && typeof entry === "object" && !Array.isArray(entry)) return flattenFields(entry, `${label}.`);
    return [{ label, value: entry }];
  });
}

function titleFromPayload(kind: EntityPreviewKind, payload: unknown): string {
  if (payload == null) return titleForKind(kind);
  const row = asRecord(payload);
  const order = asRecord(row.order);
  const base = Object.keys(order).length ? order : row;
  if (kind === "hotel") return staySourceLabel(base);
  if (kind === "booking") return safariSourceLabel(base);
  if (kind === "bar") {
    const label = typeof base.tableLabel === "string" ? base.tableLabel : null;
    if (parseWeekPeriod(label)) return formatWeekFromLabel(label, "long");
    if (parseDayLabel(label)) return formatDayFromLabel(label, "long");
  }
  return titleForKind(kind);
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
      return "Bar record";
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

function componentPreviewFields(raw: unknown): Field[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw
    .filter((row) => row && typeof row === "object")
    .map((row, index) => {
      const item = asRecord(row);
      const type = String(item.type ?? "other");
      const config = asRecord(item.config);
      const label =
        (typeof config.label === "string" && config.label.trim()) ||
        bookingComponentTypeLabel(costStackKindToComponentType(type));
      return { label: `Component ${index + 1} · ${label}`, value: item.cost };
    });
}

function costStackPreviewFields(raw: unknown): Field[] {
  const stack = asRecord(raw);
  if (!Object.keys(stack).length) return [];
  const quote = asRecord(stack.quote);
  const lines = Array.isArray(quote.lines) ? quote.lines : [];
  const fields: Field[] = [];
  for (const line of lines) {
    const row = asRecord(line);
    const kind = String(row.kind ?? "");
    const label =
      typeof row.label === "string" && row.label.trim()
        ? row.label
        : costStackKindLabel(kind as CostStackKind) || kind || "Cost";
    fields.push({ label: `Cost · ${label}`, value: row.amount });
  }
  if (quote.markupAmount != null) {
    fields.push({ label: `Markup (${quote.markupPercent ?? stack.markupPercent ?? 0}%)`, value: quote.markupAmount });
  }
  if (quote.sellingPrice != null) {
    fields.push({ label: "Cost-stack selling price", value: quote.sellingPrice });
  }
  return fields;
}

function summaryFields(kind: EntityPreviewKind, payload: unknown, companyId?: string): Field[] {
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
        {
          label: "Travellers",
          value: travellerCountsLabel(
            normalizeTravellerCounts({
              adults: Number(base.adults ?? 0),
              children: Number(base.children ?? 0),
              infants: Number(base.infants ?? 0),
              guests: Number(base.guests ?? 0),
            })
          ),
        },
        { label: "Pricing source", value: base.pricingSource ?? "manual" },
        {
          label: "Booking kind",
          value: base.bookingKind
            ? bookingKindLabel(
                resolveBookingKind({ bookingKind: String(base.bookingKind) })
              )
            : "—",
        },
        {
          label: "Total",
          value:
            base.originalAmount != null
              ? `${base.originalCurrency ?? "KES"} ${base.originalAmount}`
              : base.totalPrice,
        },
        ...componentPreviewFields(base.components),
        ...costStackPreviewFields(base.costStack),
        { label: "Version", value: base.currentVersion },
        { label: "Payment status", value: base.paymentStatus },
      ];
    case "hotel": {
      const occupants = parseOccupantGuests(base.additionalOccupants);
      return [
        { label: "Primary guest", value: base.primaryGuestName },
        {
          label: "Additional guests",
          value: occupants.length ? occupants.map(occupantGuestLabel).join(", ") : "—",
        },
        {
          label: "Travellers",
          value: travellerCountsLabel(
            normalizeTravellerCounts({
              adults: Number(base.adults ?? 0),
              children: Number(base.children ?? 0),
              infants: Number(base.infants ?? 0),
            })
          ),
        },
        { label: "Rooms", value: stayRoomsLabel(base) },
        { label: "Number of rooms", value: stayRoomCount(base) || "—" },
        { label: "Check in", value: base.checkInDate },
        { label: "Check out", value: base.checkOutDate },
        { label: "Nights", value: base.nights },
        { label: "Pricing source", value: base.pricingSource ?? "manual" },
        { label: "Guest category", value: base.guestCategory ?? "resident" },
        {
          label: "Total",
          value: `${base.currency ?? "KES"} ${base.totalAmount ?? ""}`.trim(),
        },
        { label: "Payment status", value: base.paymentStatus },
        { label: "Reservation", value: base.status },
      ];
    }
    case "payment":
      return [
        { label: "Amount", value: `${base.currency ?? ""} ${base.amount ?? ""}`.trim() },
        { label: "Date", value: base.recordedAt ?? base.createdAt },
        { label: "Method", value: base.method },
        { label: "Status", value: base.status },
        { label: "Reference", value: base.referenceType ?? (base.bookingId != null ? "Safari booking" : "—") },
      ];
    case "expense":
      return [
        { label: "Date", value: base.incurredAt },
        { label: "Category", value: base.category },
        { label: "Amount", value: formatKesForDisplay(Number(base.amount ?? 0)) },
        { label: "Description", value: base.description || "No description" },
        {
          label: "Reference",
          value:
            base.referenceType === "bar"
              ? "Bar"
              : base.referenceType === "hotel"
                ? "Accommodation"
                : base.referenceType === "restaurant"
                  ? "Restaurant"
                  : base.referenceType === "tour"
                    ? "Tour"
                    : base.referenceType === "payment"
                      ? "Payment"
                      : base.bookingId != null
                        ? "Tour"
                        : "—",
        },
      ];
    case "restaurant":
      return [
        { label: "Table / ref", value: base.tableLabel ?? base.customerName },
        { label: "Status", value: orderPayLabel(String(base.status ?? "")) },
        { label: "Created", value: base.createdAt },
        { label: "Line items", value: Array.isArray(row.lineItems) ? row.lineItems.length : 0 },
      ];
    case "bar": {
      const rawLines = Array.isArray(row.lineItems) ? row.lineItems : [];
      const lines = soldLines(
        rawLines.map((item) => {
          const line = asRecord(item);
          return {
            name: typeof line.itemName === "string" ? line.itemName : typeof line.name === "string" ? line.name : "Product",
            quantity: Number(line.quantity) || 0,
            lineTotal: Number(line.lineTotal) || 0,
          };
        })
      );
      const notes = typeof base.notes === "string" ? base.notes.trim() : "";
      if (companyId === "ewc" || companyId === "bth") {
        const daily = companyId === "bth";
        const label = typeof base.tableLabel === "string" ? base.tableLabel : null;
        return [
          {
            label: daily ? "Day" : "Week",
            value: daily ? formatDayFromLabel(label, "long") : formatWeekFromLabel(label, "long"),
          },
          { label: "Total sales", value: formatKesForDisplay(salesTotal(lines)) },
          { label: "Items sold", value: itemsSoldTotal(lines) },
          { label: "Sales breakdown", value: breakdownSummary(lines) || "—" },
          { label: "Record status", value: orderPayLabel(String(base.status ?? "")) },
          ...(notes ? [{ label: "Notes", value: notes }] : []),
        ];
      }
      return [
        { label: "Table / ref", value: base.tableLabel ?? base.customerName },
        { label: "Status", value: orderPayLabel(String(base.status ?? "")) },
        { label: "Created", value: base.createdAt },
        { label: "Items sold", value: itemsSoldTotal(lines) },
        { label: "Sales", value: formatKesForDisplay(salesTotal(lines)) },
        { label: "Breakdown", value: breakdownSummary(lines) || "—" },
        ...(notes ? [{ label: "Notes", value: notes }] : []),
      ];
    }
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

  const title = titleFromPayload(kind, payload);
  const summaries = summaryFields(kind, payload, companyId);
  const fullFields = flattenFields(payload);

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold">
            {title}
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
