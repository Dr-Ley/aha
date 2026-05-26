"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Link2, CheckCircle } from "lucide-react";
import { useCompany } from "@/store/company-context";
import { useCurrency } from "@/lib/currency-context";
import type { CurrencyCode } from "@/lib/data";
import { CURRENCIES, amountInCurrencyToUsdFloat, usdToWholeInCurrency } from "@/lib/data";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { EntityViewModal } from "@/components/dashboard/entity-view-modal";
import {
  DashboardPagination,
  DashboardTableExport,
  type ExportColumn,
  useDashboardPagination,
} from "@/components/dashboard/dashboard-table-tools";
import { paymentRecordBadgeClass } from "@/lib/dashboard-status-badges";
import {
  companyUsesBar,
  companyUsesHotelStays,
  companyUsesRestaurant,
  companyUsesSafariTours,
} from "@/types/company";

type PaymentRow = {
  id: number;
  bookingId: number | null;
  referenceType: string | null;
  referenceId: number | null;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  notes: string | null;
  recordedAt: string | null;
};

type LinkOption = {
  value: string;
  label: string;
  group: string;
};

const METHODS = ["M-Pesa", "Cash", "Card", "Bank"];
const STATUSES = ["pending", "completed", "cancelled"] as const;
const BASE_PAYMENT_CURRENCY = "KES" satisfies CurrencyCode;

const exportColumns: ExportColumn<PaymentRow>[] = [
  { key: "id", header: "ID", value: (p) => p.id },
  { key: "referenceType", header: "Reference type", value: (p) => p.referenceType },
  { key: "referenceId", header: "Reference ID", value: (p) => p.referenceId ?? p.bookingId },
  { key: "amount", header: "Amount", value: (p) => p.amount },
  { key: "currency", header: "Currency", value: (p) => p.currency },
  { key: "method", header: "Method", value: (p) => p.method },
  { key: "status", header: "Status", value: (p) => normalizePaymentRecordStatus(p.status) },
  { key: "notes", header: "Notes", value: (p) => p.notes },
  { key: "recordedAt", header: "Recorded", value: (p) => p.recordedAt },
];

/** Map legacy payment row statuses into the canonical dashboard set. */
function normalizePaymentRecordStatus(raw: string): (typeof STATUSES)[number] {
  const s = String(raw).toLowerCase();
  if (s === "pending") return "pending";
  if (s === "cancelled") return "cancelled";
  if (s === "completed") return "completed";
  if (s === "confirmed" || s === "paid" || s === "success" || s === "succeeded") return "completed";
  if (s === "refunded") return "cancelled";
  return "pending";
}

function primaryGuestName(guests: { fullName: string; isPrimary?: boolean | null }[]): string {
  const primary = guests.find((g) => g.isPrimary);
  const g = primary ?? guests[0];
  return g?.fullName?.trim() ?? "";
}

function linkKeyFromPaymentRow(p: PaymentRow): string {
  if (p.referenceType === "hotel" && p.referenceId != null) return `hotel:${p.referenceId}`;
  if (p.referenceType === "bar" && p.referenceId != null) return `bar:${p.referenceId}`;
  if (p.referenceType === "restaurant" && p.referenceId != null) return `restaurant:${p.referenceId}`;
  if (p.referenceType === "tour" && p.referenceId != null) return `tour:${p.referenceId}`;
  if (p.bookingId != null) return `tour:${p.bookingId}`;
  return "";
}

function linkPayloadFromPaymentKey(key: string): {
  bookingId: number | null;
  referenceType: string | null;
  referenceId: number | null;
} {
  if (!key) return { bookingId: null, referenceType: null, referenceId: null };
  const i = key.indexOf(":");
  if (i < 0) return { bookingId: null, referenceType: null, referenceId: null };
  const kind = key.slice(0, i);
  const id = parseInt(key.slice(i + 1), 10);
  if (Number.isNaN(id)) return { bookingId: null, referenceType: null, referenceId: null };
  if (kind === "tour") return { bookingId: id, referenceType: "tour", referenceId: id };
  if (kind === "hotel") return { bookingId: null, referenceType: "hotel", referenceId: id };
  if (kind === "bar") return { bookingId: null, referenceType: "bar", referenceId: id };
  if (kind === "restaurant") return { bookingId: null, referenceType: "restaurant", referenceId: id };
  return { bookingId: null, referenceType: null, referenceId: null };
}

function PaymentLinkedCell({ p }: { p: PaymentRow }) {
  if (p.referenceType === "hotel" && p.referenceId != null) {
    return (
      <a href="/dashboard/hotel-stays" className="link link-primary inline-flex items-center gap-1 text-sm">
        <Link2 className="h-3 w-3" />
        Hotel #{p.referenceId}
      </a>
    );
  }
  if (p.referenceType === "bar" && p.referenceId != null) {
    return (
      <a href="/dashboard/bar" className="link link-primary inline-flex items-center gap-1 text-sm">
        <Link2 className="h-3 w-3" />
        Bar #{p.referenceId}
      </a>
    );
  }
  if (p.referenceType === "restaurant" && p.referenceId != null) {
    return (
      <a href="/dashboard/restaurant" className="link link-primary inline-flex items-center gap-1 text-sm">
        <Link2 className="h-3 w-3" />
        Restaurant #{p.referenceId}
      </a>
    );
  }
  if (p.bookingId != null || (p.referenceType === "tour" && p.referenceId != null)) {
    const bid = p.bookingId ?? p.referenceId;
    return (
      <a
        href={`/dashboard/bookings#booking-${bid}`}
        className="link link-primary inline-flex items-center gap-1 text-sm"
      >
        <Link2 className="h-3 w-3" />
        Safari #{bid}
      </a>
    );
  }
  return <span className="text-base-content/40">—</span>;
}

export function PaymentsPanel() {
  const { selectedCompanyId } = useCompany();
  const { formatMoney } = useCurrency();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [linkOptions, setLinkOptions] = useState<LinkOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [statusPF, setStatusPF] = useState("");
  const [methodPF, setMethodPF] = useState("");
  const [currencyPF, setCurrencyPF] = useState("");
  const [linkAmountHintsKes, setLinkAmountHintsKes] = useState<Record<string, number>>({});
  const [viewId, setViewId] = useState<number | null>(null);
  const [form, setForm] = useState({
    amount: "",
    linkKey: "",
    method: "",
    status: "pending",
    notes: "",
    currency: "KES" as CurrencyCode,
  });

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ companyId: selectedCompanyId });
      const parts: Promise<Response>[] = [fetch(`/api/payments?${qs}`)];
      if (companyUsesSafariTours(selectedCompanyId)) parts.push(fetch(`/api/bookings?${qs}`));
      if (companyUsesHotelStays(selectedCompanyId)) parts.push(fetch(`/api/hotel-bookings?${qs}`));
      if (companyUsesBar(selectedCompanyId)) parts.push(fetch(`/api/bar-orders?${qs}`));
      if (companyUsesRestaurant(selectedCompanyId)) parts.push(fetch(`/api/restaurant-orders?${qs}`));

      const results = await Promise.all(parts);
      const pRes = results[0];
      const pJson = await pRes.json();
      if (!pRes.ok) throw new Error(typeof pJson.error === "string" ? pJson.error : "Failed to load payments");
      setRows(pJson.payments ?? []);

      const opts: LinkOption[] = [];
      const hints: Record<string, number> = {};
      let idx = 1;

      if (companyUsesSafariTours(selectedCompanyId)) {
        const res = results[idx++];
        if (res?.ok) {
          const j = await res.json();
          for (const b of j.bookings ?? []) {
            const tourTitle = b.tour?.shortTitle ?? b.tour?.title ?? "Safari";
            const who = [b.firstName, b.lastName].filter(Boolean).join(" ") || b.email;
            hints[`tour:${b.id}`] = Math.max(0, Number(b.totalPrice ?? 0));
            opts.push({
              value: `tour:${b.id}`,
              label: `Safari #${b.id} — ${tourTitle} — ${who}`,
              group: "Safari tour bookings",
            });
          }
        }
      }

      if (companyUsesHotelStays(selectedCompanyId)) {
        const res = results[idx++];
        if (res?.ok) {
          const j = await res.json();
          for (const h of j.hotelBookings ?? []) {
            const room = h.room?.code || h.room?.name || h.room?.roomTypeName || "Room";
            const guest = primaryGuestName(h.guests ?? []);
            const who = guest || "Guest";
            const ps = String(h.paymentStatus ?? "").toLowerCase();
            if (ps === "paid") {
              hints[`hotel:${h.id}`] = Math.max(1, Number(h.totalAmount ?? 0));
            } else if (ps === "partial") {
              hints[`hotel:${h.id}`] = Math.max(1, Number(h.amountPaid ?? 0));
            }
            opts.push({
              value: `hotel:${h.id}`,
              label: `Hotel #${h.id} — ${room} — ${h.checkInDate} → ${h.checkOutDate} — ${who}`,
              group: "Hotel stays",
            });
          }
        }
      }

      if (companyUsesBar(selectedCompanyId)) {
        const res = results[idx++];
        if (res?.ok) {
          const j = await res.json();
          for (const o of j.orders ?? []) {
            const tag = o.tableLabel || o.customerName || "Walk-in";
            const total = typeof o.total === "number" ? o.total : 0;
            hints[`bar:${o.id}`] = Math.max(1, total);
            opts.push({
              value: `bar:${o.id}`,
              label: `Bar #${o.id} — ${tag} (${o.status})`,
              group: "Bar orders",
            });
          }
        }
      }

      if (companyUsesRestaurant(selectedCompanyId)) {
        const res = results[idx++];
        if (res?.ok) {
          const j = await res.json();
          for (const o of j.orders ?? []) {
            const tag = o.tableLabel || o.customerName || "Walk-in";
            const total = typeof o.total === "number" ? o.total : 0;
            hints[`restaurant:${o.id}`] = Math.max(1, total);
            opts.push({
              value: `restaurant:${o.id}`,
              label: `Restaurant #${o.id} — ${tag} (${o.status})`,
              group: "Restaurant orders",
            });
          }
        }
      }

      setLinkAmountHintsKes(hints);
      setLinkOptions(opts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => String(b.recordedAt).localeCompare(String(a.recordedAt))),
    [rows]
  );

  const filteredPayments = useMemo(() => {
    return sorted.filter((p) => {
      if (statusPF && normalizePaymentRecordStatus(p.status) !== statusPF) return false;
      if (methodPF && (p.method ?? "") !== methodPF) return false;
      if (currencyPF && p.currency !== currencyPF) return false;
      return true;
    });
  }, [sorted, statusPF, methodPF, currencyPF]);
  const { page, pageCount, setPage, pagedRows } = useDashboardPagination(filteredPayments, 10);

  const linkGroups = useMemo(() => {
    const m = new Map<string, LinkOption[]>();
    for (const o of linkOptions) {
      const arr = m.get(o.group) ?? [];
      arr.push(o);
      m.set(o.group, arr);
    }
    return [...m.entries()];
  }, [linkOptions]);

  const linkHelpText = useMemo(() => {
    const parts: string[] = [];
    if (companyUsesSafariTours(selectedCompanyId)) parts.push("safari tour bookings");
    if (companyUsesHotelStays(selectedCompanyId)) parts.push("hotel stays");
    if (companyUsesBar(selectedCompanyId)) parts.push("bar orders");
    if (companyUsesRestaurant(selectedCompanyId)) parts.push("restaurant orders");
    if (parts.length === 0) return "No source links are configured for this company.";
    return `Link this receipt to ${parts.join(", ")} when applicable.`;
  }, [selectedCompanyId]);

  function openCreate() {
    setEditId(null);
    setForm({
      amount: "",
      linkKey: "",
      method: "",
      status: "pending",
      notes: "",
      currency: BASE_PAYMENT_CURRENCY,
    });
    setModal("create");
  }

  function openEdit(p: PaymentRow) {
    const amount =
      String(p.currency).toUpperCase() === BASE_PAYMENT_CURRENCY
        ? Math.round(p.amount)
        : usdToWholeInCurrency(amountInCurrencyToUsdFloat(p.amount, p.currency), BASE_PAYMENT_CURRENCY);
    setEditId(p.id);
    setForm({
      amount: String(amount),
      linkKey: linkKeyFromPaymentRow(p),
      method: p.method ?? "",
      status: normalizePaymentRecordStatus(p.status),
      notes: p.notes ?? "",
      currency: BASE_PAYMENT_CURRENCY,
    });
    setModal("edit");
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          amount: parseInt(form.amount, 10),
          ...linkPayloadFromPaymentKey(form.linkKey),
          method: form.method || null,
          status: form.status,
          notes: form.notes || null,
          currency: form.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
      setModal(null);
      await load();
      showToast("Payment logged successfully", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId == null) return;
    setSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          companyId: selectedCompanyId,
          amount: parseInt(form.amount, 10),
          ...linkPayloadFromPaymentKey(form.linkKey),
          method: form.method || null,
          status: form.status,
          notes: form.notes || null,
          currency: form.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to update payment");
      setModal(null);
      await load();
      showToast("Payment updated successfully", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this payment?")) return;
    const qs = new URLSearchParams({ id: String(id), companyId: selectedCompanyId });
    const res = await fetch(`/api/payments?${qs}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      showToast(d.error ?? "Delete failed", "error");
      return;
    }
    await load();
    showToast("Payment deleted successfully", "success");
  }

  const inputStyle = { outline: "1px solid gray" };

  const linkSelect = (opts: { showHelp?: boolean }) => (
    <div className="form-control gap-2">
      <span className="label-text text-sm font-medium">Link to source (optional)</span>
      {opts.showHelp !== false && <p className="mb-1 text-xs text-base-content/60">{linkHelpText}</p>}
      <select
        className="select select-bordered select-sm w-full rounded-md"
        style={inputStyle}
        value={form.linkKey}
        onChange={(e) => {
          const key = e.target.value;
          setForm((f) => {
            const next = { ...f, linkKey: key };
            if (modal === "create" && key) {
              const kes = linkAmountHintsKes[key];
              if (kes != null && Number.isFinite(kes) && kes > 0) {
                next.amount = String(Math.round(kes));
              }
            }
            return next;
          });
        }}
      >
        <option value="">None</option>
        {modal === "edit" &&
          form.linkKey &&
          !linkOptions.some((o) => o.value === form.linkKey) && (
            <option value={form.linkKey}>Current: {form.linkKey.replace(":", " #")}</option>
          )}
        {linkGroups.map(([group, items]) => (
          <optgroup key={group} label={group}>
            {items.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {linkOptions.length === 0 && (
        <p className="text-xs text-base-content/50">
          No sources loaded — check permissions or add bookings/orders in their modules.
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${
            toast.type === "success" ? "bg-success text-success-content" : "bg-error text-error-content"
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-base-content mb-5">Payments</h1>
          <p className="text-sm text-base-content/60">
            Track receipts and link them to safari bookings, hotel stays, bar, or restaurant based on the selected
            company. Set status to completed once confirmed; completed payments sync to Revenue.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Log payment
        </button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
        <label className="form-control gap-1">
          <span className="label-text text-xs font-medium uppercase tracking-wide text-base-content/60">
            Currency
          </span>
          <select
            className="select select-bordered select-sm rounded-md min-w-22"
            style={inputStyle}
            value={currencyPF}
            onChange={(e) => setCurrencyPF(e.target.value)}
          >
            <option value="">All</option>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-base-content/10 bg-base-100 shadow-sm">
        <table className="table table-sm">
          <thead className="sticky top-0 z-10 bg-base-200/95 text-xs uppercase text-base-content/70 backdrop-blur">
            <tr>
              <th className="align-top">ID</th>
              <th className="align-top normal-case font-normal">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  Linked source
                </span>
              </th>
              <th className="align-top normal-case font-normal">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  Amount
                </span>
              </th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-[7rem] flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Method
                    <select
                      className="select select-bordered select-xs max-w-[7rem] rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={methodPF}
                      onChange={(e) => setMethodPF(e.target.value)}
                    >
                      <option value="">All</option>
                      {METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              </th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-[7rem] flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Status
                    <select
                      className="select select-bordered select-xs max-w-30 rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={statusPF}
                      onChange={(e) => setStatusPF(e.target.value)}
                    >
                      <option value="">All</option>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              </th>
              <th className="align-top" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-base-content/50">
                  {rows.length === 0 ? "No payments for this company." : "No payments match filters."}
                </td>
              </tr>
            ) : (
              pagedRows.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer transition-colors hover:bg-primary/5 active:bg-primary/10"
                  onClick={() => setViewId(p.id)}
                >
                  <td className="font-mono text-xs">{p.id}</td>
                  <td className="max-w-56">
                    <PaymentLinkedCell p={p} />
                  </td>
                  <td className="tabular-nums font-medium">{formatMoney(p.amount, p.currency)}</td>
                  <td className="text-sm">{p.method ?? "—"}</td>
                  <td>
                    <span className={`badge badge-sm ${paymentRecordBadgeClass(normalizePaymentRecordStatus(p.status))}`}>
                      {normalizePaymentRecordStatus(p.status)}
                    </span>
                  </td>
                  <td className="flex gap-1">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(p);
                      }}
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square text-error"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(p.id);
                      }}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DashboardPagination page={page} pageCount={pageCount} setPage={setPage} />
        <DashboardTableExport title="Payments" rows={filteredPayments} columns={exportColumns} />
      </div>

      <DashboardModal open={modal === "create"} title="Log payment" onClose={() => setModal(null)}>
        <form className="space-y-5" onSubmit={submitCreate}>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Amount (integer)</span>
            <input
              type="number"
              min={1}
              className="input input-bordered input-sm w-full rounded-md"
              style={inputStyle}
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </label>

          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Currency</span>
            <input
              className="input input-bordered input-sm w-full rounded-md"
              style={inputStyle}
              value="KES"
              readOnly
            />
          </label>

          {linkSelect({ showHelp: true })}

          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Method</span>
            <select
              className="select select-bordered w-full select-sm rounded-md"
              style={inputStyle}
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
            >
              <option value="">Select method</option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Status</span>
            <select
              className="select select-bordered w-full select-sm rounded-md"
              style={inputStyle}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Notes</span>
            <textarea
              className="textarea textarea-bordered w-full textarea-sm rounded-md"
              style={inputStyle}
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-xs" /> : "Save"}
            </button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal open={modal === "edit"} title="Edit payment" onClose={() => setModal(null)}>
        <form className="space-y-5" onSubmit={submitEdit}>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Amount</span>
            <input
              type="number"
              min={1}
              className="input input-bordered input-sm w-full rounded-md"
              style={inputStyle}
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </label>

          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Currency</span>
            <input
              className="input input-bordered input-sm w-full rounded-md"
              style={inputStyle}
              value="KES"
              readOnly
            />
          </label>

          {linkSelect({ showHelp: true })}

          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Method</span>
            <select
              className="select select-bordered w-full select-sm rounded-md"
              style={inputStyle}
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
            >
              <option value="">Select method</option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Status</span>
            <select
              className="select select-bordered w-full select-sm rounded-md"
              style={inputStyle}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Notes</span>
            <textarea
              className="textarea textarea-bordered w-full textarea-sm rounded-md"
              style={inputStyle}
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-xs" /> : "Update"}
            </button>
          </div>
        </form>
      </DashboardModal>
      <EntityViewModal
        open={viewId !== null}
        onClose={() => setViewId(null)}
        companyId={selectedCompanyId}
        kind="payment"
        entityId={viewId}
      />
    </div>
  );
}
