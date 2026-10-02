"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle,
  CircleDollarSign,
  Eye,
  Hash,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
} from "lucide-react";
import { useCompany } from "@/store/company-context";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import {
  DashboardPagination,
  DashboardTableExport,
  type ExportColumn,
  useDashboardPagination,
} from "@/components/dashboard/dashboard-table-tools";
import type { CurrencyCode } from "@/lib/data";
import { formatKesForDisplay } from "@/lib/data";
import { nairobiYmd } from "@/lib/nairobi-date";
import { safariSourceLabel, staySourceLabel } from "@/lib/stay-labels";
import { dateRangeForPreset, formatDayFromLabel, formatWeekFromLabel, type WeeklyDatePreset } from "@/lib/weekly-bar";
import {
  companyUsesBar,
  companyUsesHotelStays,
  companyUsesRestaurant,
  companyUsesSafariTours,
} from "@/types/company";

type ReferenceType = "tour" | "hotel" | "restaurant" | "bar" | "payment";
type SortKey = "date" | "amount" | "category";
type SortDir = "asc" | "desc";

type ExpenseRow = {
  id: number;
  bookingId: number | null;
  referenceType: ReferenceType | null;
  referenceId: number | null;
  category: string;
  amount: number;
  description: string | null;
  incurredAt: string | null;
};

type BookingOpt = { id: number; label: string };

const DATE_PRESETS: { id: WeeklyDatePreset; label: string }[] = [
  { id: "this_week", label: "This week" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "last_3_months", label: "Last 3 months" },
  { id: "this_year", label: "This year" },
  { id: "custom", label: "Custom range" },
];

const REFERENCE_TYPE_LABEL: Record<ReferenceType, string> = {
  tour: "Tour",
  hotel: "Accommodation",
  restaurant: "Restaurant",
  bar: "Bar",
  payment: "Payment",
};

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function expenseYmd(value: string | null | undefined): string {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return nairobiYmd(parsed);
}

function formatExpenseDate(value: string | null | undefined): string {
  const ymd = expenseYmd(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return "—";
  const month = MONTHS_SHORT[Number(match[2]) - 1];
  if (!month) return "—";
  return `${Number(match[3])} ${month} ${match[1]}`;
}

function incurredMs(value: string | null | undefined): number {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : 0;
}

function chartCompactFromKes(kes: number): string {
  const v = Number.isFinite(kes) ? Math.round(kes) : 0;
  if (Math.abs(v) >= 1000) return `KSh${Math.round(v / 1000)}k`;
  return `KSh${v}`;
}

function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T12:00:00+03:00`);
  const b = Date.parse(`${to}T12:00:00+03:00`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000) + 1;
}

function addDaysYmd(value: string, days: number): string {
  const t = Date.parse(`${value}T12:00:00+03:00`);
  if (!Number.isFinite(t)) return value;
  return nairobiYmd(new Date(t + days * 86_400_000));
}

function mondayOf(ymd: string): string {
  const dow = new Date(`${ymd}T12:00:00+03:00`).getUTCDay();
  const mon0 = dow === 0 ? 6 : dow - 1;
  return addDaysYmd(ymd, -mon0);
}

function expenseRefKind(row: ExpenseRow): ReferenceType | "" {
  if (row.referenceType) return row.referenceType;
  if (row.bookingId != null) return "tour";
  return "";
}

function expenseLinkKey(row: ExpenseRow): string {
  if (row.bookingId != null) return `tour:${row.bookingId}`;
  if (row.referenceType && row.referenceId != null) return `${row.referenceType}:${row.referenceId}`;
  return "";
}

function descriptionText(value: string | null | undefined): string {
  const text = value?.trim() ?? "";
  return text || "No description";
}

function referenceLabel(row: ExpenseRow, labels: Record<string, string>): string {
  const key = expenseLinkKey(row);
  if (key && labels[key]) return labels[key];
  const kind = expenseRefKind(row);
  if (kind) return REFERENCE_TYPE_LABEL[kind];
  return "—";
}

function incurredIso(ymd: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined;
  return new Date(`${ymd}T12:00:00+03:00`).toISOString();
}

type DisplayRow = ExpenseRow & { dateLabel: string; descriptionLabel: string; referenceLabel: string };

const exportColumns: ExportColumn<DisplayRow>[] = [
  { key: "date", header: "Date", value: (x) => x.dateLabel },
  { key: "category", header: "Category", value: (x) => x.category },
  { key: "description", header: "Description", value: (x) => x.descriptionLabel },
  { key: "amount", header: "Amount", value: (x) => formatKesForDisplay(x.amount) },
  { key: "reference", header: "Reference", value: (x) => x.referenceLabel },
];

export function ExpensesPanel() {
  const { selectedCompanyId, canEditModule } = useCompany();
  const canEdit = canEditModule("expenses");
  const canDelete = canEdit;
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [bookings, setBookings] = useState<BookingOpt[]>([]);
  const [sourceLabels, setSourceLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<WeeklyDatePreset>("this_year");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [catF, setCatF] = useState("");
  const [refTypeF, setRefTypeF] = useState("");
  const [searchF, setSearchF] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [modal, setModal] = useState<"create" | "edit" | "view" | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [viewRow, setViewRow] = useState<DisplayRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [form, setForm] = useState({
    category: "",
    amount: "",
    amountCurrency: "KES" as CurrencyCode,
    description: "",
    bookingId: "",
    incurredAt: "",
  });

  const inputStyle = { outline: "1px solid gray" };

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ companyId: selectedCompanyId });
      const parts: Promise<Response>[] = [fetch(`/api/expenses?${qs}`)];
      if (companyUsesSafariTours(selectedCompanyId)) parts.push(fetch(`/api/bookings?${qs}`));
      if (companyUsesHotelStays(selectedCompanyId)) parts.push(fetch(`/api/hotel-bookings?${qs}`));
      if (companyUsesBar(selectedCompanyId)) parts.push(fetch(`/api/bar-orders?${qs}`));
      if (companyUsesRestaurant(selectedCompanyId)) parts.push(fetch(`/api/restaurant-orders?${qs}`));

      const results = await Promise.all(parts);
      const eRes = results[0];
      const eJson = await eRes.json();
      if (!eRes.ok) throw new Error(typeof eJson.error === "string" ? eJson.error : "Failed to load expenses");
      setRows(eJson.expenses ?? []);

      const labels: Record<string, string> = {};
      const bookingOpts: BookingOpt[] = [];
      let idx = 1;

      if (companyUsesSafariTours(selectedCompanyId)) {
        const res = results[idx++];
        if (res?.ok) {
          const j = await res.json();
          for (const b of j.bookings ?? []) {
            const label = safariSourceLabel(b);
            labels[`tour:${b.id}`] = label;
            bookingOpts.push({ id: b.id, label });
          }
        }
      }
      if (companyUsesHotelStays(selectedCompanyId)) {
        const res = results[idx++];
        if (res?.ok) {
          const j = await res.json();
          for (const h of j.hotelBookings ?? []) {
            labels[`hotel:${h.id}`] = staySourceLabel(h);
          }
        }
      }
      if (companyUsesBar(selectedCompanyId)) {
        const res = results[idx++];
        if (res?.ok) {
          const j = await res.json();
          for (const o of j.orders ?? []) {
            labels[`bar:${o.id}`] =
              selectedCompanyId === "ewc"
                ? formatWeekFromLabel(o.tableLabel)
                : selectedCompanyId === "bth"
                  ? formatDayFromLabel(o.tableLabel)
                  : o.tableLabel?.trim() || "Bar";
          }
        }
      }
      if (companyUsesRestaurant(selectedCompanyId)) {
        const res = results[idx++];
        if (res?.ok) {
          const j = await res.json();
          for (const o of j.orders ?? []) {
            labels[`restaurant:${o.id}`] = o.tableLabel?.trim() || o.customerName?.trim() || "Restaurant";
          }
        }
      }

      setBookings(bookingOpts);
      setSourceLabels(labels);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dateRange = useMemo(
    () => dateRangeForPreset(preset, new Date(), { from: customFrom, to: customTo }),
    [preset, customFrom, customTo]
  );

  const thisMonthRange = useMemo(() => dateRangeForPreset("this_month", new Date()), []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => {
      if (r.category?.trim()) s.add(r.category);
    });
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const referenceTypes = useMemo(() => {
    const s = new Set<ReferenceType>();
    rows.forEach((r) => {
      const kind = expenseRefKind(r);
      if (kind) s.add(kind);
    });
    return [...s].sort((a, b) => REFERENCE_TYPE_LABEL[a].localeCompare(REFERENCE_TYPE_LABEL[b]));
  }, [rows]);

  const displayRows = useMemo<DisplayRow[]>(() => {
    return rows.map((row) => ({
      ...row,
      dateLabel: formatExpenseDate(row.incurredAt),
      descriptionLabel: descriptionText(row.description),
      referenceLabel: referenceLabel(row, sourceLabels),
    }));
  }, [rows, sourceLabels]);

  const filtered = useMemo(() => {
    const needle = searchF.trim().toLowerCase();
    const next = displayRows.filter((r) => {
      const ymd = expenseYmd(r.incurredAt);
      if (dateRange) {
        if (!ymd || ymd < dateRange.from || ymd > dateRange.to) return false;
      }
      if (catF && r.category !== catF) return false;
      const kind = expenseRefKind(r);
      if (refTypeF === "none" && kind) return false;
      if (refTypeF && refTypeF !== "none" && kind !== refTypeF) return false;
      if (needle) {
        const hay = `${r.category} ${r.descriptionLabel} ${r.referenceLabel}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    next.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "amount") cmp = a.amount - b.amount;
      else if (sortKey === "category") cmp = a.category.localeCompare(b.category);
      else cmp = incurredMs(a.incurredAt) - incurredMs(b.incurredAt);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return next;
  }, [displayRows, dateRange, catF, refTypeF, searchF, sortKey, sortDir]);

  const { page, pageCount, setPage, pagedRows } = useDashboardPagination(filtered, 10);

  const kpis = useMemo(() => {
    const total = filtered.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const count = filtered.length;
    const average = count === 0 ? 0 : Math.round(total / count);
    const thisMonth = displayRows.reduce((sum, r) => {
      const ymd = expenseYmd(r.incurredAt);
      if (!thisMonthRange || !ymd || ymd < thisMonthRange.from || ymd > thisMonthRange.to) return sum;
      return sum + (Number(r.amount) || 0);
    }, 0);
    return { total, count, average, thisMonth };
  }, [filtered, displayRows, thisMonthRange]);

  const trendPoints = useMemo(() => {
    if (filtered.length === 0) return [];
    const range =
      dateRange ??
      (() => {
        const dates = filtered.map((r) => expenseYmd(r.incurredAt)).filter(Boolean).sort();
        if (dates.length === 0) return null;
        return { from: dates[0], to: dates[dates.length - 1] };
      })();
    if (!range) return [];
    const span = daysBetween(range.from, range.to);
    const buckets = new Map<string, { label: string; amount: number; order: string }>();

    for (const row of filtered) {
      const ymd = expenseYmd(row.incurredAt);
      if (!ymd) continue;
      let key = ymd;
      let label = formatExpenseDate(ymd);
      if (span > 92) {
        key = ymd.slice(0, 7);
        const [y, m] = key.split("-");
        label = `${MONTHS_SHORT[Number(m) - 1] ?? m} ${y}`;
      } else if (span > 21) {
        key = mondayOf(ymd);
        label = formatExpenseDate(key);
      }
      const current = buckets.get(key) ?? { label, amount: 0, order: key };
      current.amount += Number(row.amount) || 0;
      buckets.set(key, current);
    }

    return [...buckets.values()]
      .sort((a, b) => a.order.localeCompare(b.order))
      .filter((row) => row.amount > 0);
  }, [filtered, dateRange]);

  const categoryBreakdown = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const row of filtered) {
      const name = row.category?.trim();
      if (!name) continue;
      buckets.set(name, (buckets.get(name) ?? 0) + (Number(row.amount) || 0));
    }
    return [...buckets.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "date" ? "desc" : "asc");
  }

  function sortMark(key: SortKey): string {
    if (sortKey !== key) return "";
    return sortDir === "desc" ? " ↓" : " ↑";
  }

  function openCreate() {
    setEditId(null);
    setForm({
      category: "",
      amount: "",
      amountCurrency: "KES",
      description: "",
      bookingId: "",
      incurredAt: nairobiYmd(),
    });
    setModal("create");
  }

  function openEdit(x: ExpenseRow) {
    setEditId(x.id);
    setForm({
      category: x.category,
      amount: String(x.amount),
      amountCurrency: "KES",
      description: x.description ?? "",
      bookingId: x.bookingId != null ? String(x.bookingId) : "",
      incurredAt: expenseYmd(x.incurredAt),
    });
    setModal("edit");
  }

  function openView(x: DisplayRow) {
    setViewRow(x);
    setModal("view");
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        companyId: selectedCompanyId,
        category: form.category,
        amount: parseInt(form.amount, 10),
        description: form.description || null,
        bookingId: form.bookingId ? parseInt(form.bookingId, 10) : null,
      };
      if (form.bookingId) body.referenceType = "tour";
      const incurred = incurredIso(form.incurredAt);
      if (incurred) body.incurredAt = incurred;
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
      setModal(null);
      await load();
      showToast("Expense added successfully", "success");
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
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          companyId: selectedCompanyId,
          category: form.category,
          amount: parseInt(form.amount, 10),
          description: form.description || null,
          bookingId: form.bookingId ? parseInt(form.bookingId, 10) : null,
          ...(form.bookingId ? { referenceType: "tour" } : {}),
          incurredAt: incurredIso(form.incurredAt) ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
      setModal(null);
      await load();
      showToast("Expense updated successfully", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this expense?")) return;
    const qs = new URLSearchParams({ id: String(id), companyId: selectedCompanyId });
    const res = await fetch(`/api/expenses?${qs}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      showToast(typeof d.error === "string" ? d.error : "Delete failed", "error");
      return;
    }
    setModal(null);
    await load();
    showToast("Expense deleted successfully", "success");
  }

  const expenseForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form className="space-y-6" onSubmit={onSubmit}>
      <label className="form-control gap-2">
        <span className="label-text text-sm font-medium">Category</span>
        <input
          className="input input-bordered input-sm w-full rounded-md"
          style={inputStyle}
          required
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
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
        <label className="form-control gap-2 w-full sm:w-[110px]">
          <span className="label-text text-sm font-medium">Currency</span>
          <input className="input input-bordered input-sm w-full rounded-md" style={inputStyle} value="KES" readOnly />
        </label>
      </div>
      <label className="form-control gap-2">
        <span className="label-text text-sm font-medium">Description</span>
        <textarea
          className="textarea textarea-bordered w-full textarea-sm rounded-md"
          style={inputStyle}
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>
      {companyUsesSafariTours(selectedCompanyId) ? (
        <label className="form-control gap-2">
          <span className="label-text text-sm font-medium">Linked tour booking</span>
          <select
            className="select select-bordered select-sm w-full rounded-md"
            style={inputStyle}
            value={form.bookingId}
            onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
          >
            <option value="">None</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="form-control gap-2">
        <span className="label-text text-sm font-medium">Date incurred</span>
        <input
          type="date"
          className="input input-bordered input-sm w-full rounded-md"
          style={inputStyle}
          required
          value={form.incurredAt}
          onChange={(e) => setForm({ ...form, incurredAt: e.target.value })}
        />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? <span className="loading loading-spinner loading-xs" /> : submitLabel}
        </button>
      </div>
    </form>
  );

  const actionButtons = (x: DisplayRow, compact = false) => (
    <div className={`flex items-center gap-1 ${compact ? "justify-end" : ""}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-square"
        aria-label="View expense"
        onClick={() => openView(x)}
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      {canEdit ? (
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-square"
          aria-label="Edit expense"
          onClick={() => openEdit(x)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-square text-error"
          aria-label="Delete expense"
          onClick={() => void remove(x.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
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
          <h1 className="font-serif text-2xl font-bold text-base-content mb-1">Expenses</h1>
          <p className="text-sm text-base-content/60">What the company spent, what it was spent on, and when.</p>
        </div>
        {canEdit ? (
          <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add expense
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-base-content/10 bg-base-200/60" />
          ))
        ) : (
          <>
            <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-base-content/60">Total expenses</p>
                <CircleDollarSign className="h-4 w-4 text-primary opacity-80" aria-hidden />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums">{formatKesForDisplay(kpis.total)}</p>
            </div>
            <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-base-content/60">Number of expenses</p>
                <Hash className="h-4 w-4 text-primary opacity-80" aria-hidden />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums">{kpis.count}</p>
            </div>
            <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-base-content/60">Average expense</p>
                <Receipt className="h-4 w-4 text-primary opacity-80" aria-hidden />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums">{formatKesForDisplay(kpis.average)}</p>
            </div>
            <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-base-content/60">Expenses this month</p>
                <CircleDollarSign className="h-4 w-4 text-primary opacity-80" aria-hidden />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums">{formatKesForDisplay(kpis.thisMonth)}</p>
              <p className="mt-1 text-xs text-base-content/50">Current calendar month</p>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end">
        <label className="form-control min-w-44">
          <span className="label-text text-xs font-medium uppercase tracking-wide text-base-content/60">Date range</span>
          <select
            className="select select-bordered select-sm rounded-md"
            style={inputStyle}
            value={preset}
            onChange={(e) => setPreset(e.target.value as WeeklyDatePreset)}
          >
            {DATE_PRESETS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {preset === "custom" ? (
          <>
            <label className="form-control min-w-40">
              <span className="label-text text-xs font-medium uppercase tracking-wide text-base-content/60">From</span>
              <input
                type="date"
                className="input input-bordered input-sm rounded-md"
                style={inputStyle}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </label>
            <label className="form-control min-w-40">
              <span className="label-text text-xs font-medium uppercase tracking-wide text-base-content/60">To</span>
              <input
                type="date"
                className="input input-bordered input-sm rounded-md"
                style={inputStyle}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </label>
          </>
        ) : null}
        <label className="form-control min-w-40">
          <span className="label-text text-xs font-medium uppercase tracking-wide text-base-content/60">Category</span>
          <select
            className="select select-bordered select-sm rounded-md"
            style={inputStyle}
            value={catF}
            onChange={(e) => setCatF(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {referenceTypes.length > 0 ? (
          <label className="form-control min-w-40">
            <span className="label-text text-xs font-medium uppercase tracking-wide text-base-content/60">
              Reference type
            </span>
            <select
              className="select select-bordered select-sm rounded-md"
              style={inputStyle}
              value={refTypeF}
              onChange={(e) => setRefTypeF(e.target.value)}
            >
              <option value="">All references</option>
              <option value="none">No reference</option>
              {referenceTypes.map((type) => (
                <option key={type} value={type}>
                  {REFERENCE_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="form-control min-w-52 flex-1">
          <span className="label-text text-xs font-medium uppercase tracking-wide text-base-content/60">Search</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-base-content/40" />
            <input
              className="input input-bordered input-sm w-full rounded-md pl-9"
              style={inputStyle}
              placeholder="Description, category, or reference"
              value={searchF}
              onChange={(e) => setSearchF(e.target.value)}
            />
          </span>
        </label>
      </div>

      {error ? (
        <div className="rounded-2xl border border-error/20 bg-error/5 p-6">
          <p className="text-sm text-error">{error}</p>
          <button type="button" className="btn btn-outline btn-sm mt-3" onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="hidden overflow-x-auto rounded-2xl border border-base-content/10 bg-base-100 shadow-sm md:block">
        <table className="table table-sm">
          <thead className="sticky top-0 z-10 bg-base-200/95 text-xs uppercase text-base-content/70 backdrop-blur">
            <tr>
              <th>
                <button type="button" className="font-semibold uppercase tracking-wide" onClick={() => toggleSort("date")}>
                  Date{sortMark("date")}
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="font-semibold uppercase tracking-wide"
                  onClick={() => toggleSort("category")}
                >
                  Category{sortMark("category")}
                </button>
              </th>
              <th>Description</th>
              <th>
                <button
                  type="button"
                  className="font-semibold uppercase tracking-wide"
                  onClick={() => toggleSort("amount")}
                >
                  Amount{sortMark("amount")}
                </button>
              </th>
              <th>Reference</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <p className="font-medium text-base-content">No expenses recorded</p>
                  <p className="mt-1 text-sm text-base-content/50">
                    There are no expenses matching the current filters.
                  </p>
                  {canEdit ? (
                    <button type="button" className="btn btn-primary btn-sm mt-4 gap-2" onClick={openCreate}>
                      <Plus className="h-4 w-4" />
                      Add expense
                    </button>
                  ) : null}
                </td>
              </tr>
            ) : (
              pagedRows.map((x) => (
                <tr
                  key={x.id}
                  className="cursor-pointer transition-colors hover:bg-primary/5 active:bg-primary/10"
                  onClick={() => openView(x)}
                >
                  <td className="whitespace-nowrap text-sm">{x.dateLabel}</td>
                  <td>
                    <span className="badge badge-outline badge-sm">{x.category}</span>
                  </td>
                  <td className="max-w-[16rem] truncate text-sm text-base-content/70" title={x.description?.trim() || undefined}>
                    {x.descriptionLabel}
                  </td>
                  <td className="whitespace-nowrap tabular-nums font-medium">{formatKesForDisplay(x.amount)}</td>
                  <td className="max-w-[14rem] truncate text-sm">{x.referenceLabel}</td>
                  <td>{actionButtons(x)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-base-content/10 bg-base-100 py-12 text-center shadow-sm">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-base-content/10 bg-base-100 p-8 text-center shadow-sm">
            <p className="font-medium text-base-content">No expenses recorded</p>
            <p className="mt-1 text-sm text-base-content/50">There are no expenses matching the current filters.</p>
            {canEdit ? (
              <button type="button" className="btn btn-primary btn-sm mt-4 gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add expense
              </button>
            ) : null}
          </div>
        ) : (
          pagedRows.map((x) => (
            <div
              key={x.id}
              className="w-full cursor-pointer rounded-2xl border border-base-content/10 bg-base-100 p-4 text-left shadow-sm"
              onClick={() => openView(x)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openView(x);
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="badge badge-outline badge-sm">{x.category}</span>
                <span className="tabular-nums font-semibold">{formatKesForDisplay(x.amount)}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-base-content/70">{x.descriptionLabel}</p>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-base-content/60">
                <span>{x.dateLabel}</span>
                <span className="truncate">{x.referenceLabel}</span>
              </div>
              <div className="mt-2">{actionButtons(x, true)}</div>
            </div>
          ))
        )}
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 max-md:flex-col max-md:items-stretch">
        <DashboardPagination page={page} pageCount={pageCount} setPage={setPage} />
        <DashboardTableExport title="Expenses" rows={filtered} columns={exportColumns} />
      </div>

      {!loading && trendPoints.length > 0 ? (
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Expense trend</h2>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendPoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => chartCompactFromKes(typeof v === "number" ? v : Number(v) || 0)}
                />
                <Tooltip
                  formatter={(value) => [
                    formatKesForDisplay(typeof value === "number" ? value : Number(value) || 0),
                    "Expenses",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#2d5a3d"
                  strokeWidth={2}
                  dot={{ fill: "#d4a84b", strokeWidth: 0, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {!loading && categoryBreakdown.length > 0 ? (
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Expense categories</h2>
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryBreakdown}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => chartCompactFromKes(typeof v === "number" ? v : Number(v) || 0)}
                />
                <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [
                    formatKesForDisplay(typeof value === "number" ? value : Number(value) || 0),
                    "Total",
                  ]}
                />
                <Bar dataKey="amount" fill="#2d5a3d" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <DashboardModal open={modal === "create"} title="New expense" onClose={() => setModal(null)}>
        {expenseForm(submitCreate, "Save")}
      </DashboardModal>
      <DashboardModal open={modal === "edit"} title="Edit expense" onClose={() => setModal(null)}>
        {expenseForm(submitEdit, "Update")}
      </DashboardModal>
      <DashboardModal open={modal === "view"} title="Expense details" onClose={() => setModal(null)}>
        {viewRow ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-base-content/50">Date</dt>
                <dd className="mt-1 text-sm">{viewRow.dateLabel}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-base-content/50">Category</dt>
                <dd className="mt-1 text-sm">{viewRow.category}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-base-content/50">Amount</dt>
                <dd className="mt-1 text-sm font-semibold tabular-nums">{formatKesForDisplay(viewRow.amount)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-base-content/50">Reference</dt>
                <dd className="mt-1 text-sm">{viewRow.referenceLabel}</dd>
              </div>
              {viewRow.bookingId != null ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-base-content/50">Booking</dt>
                  <dd className="mt-1 text-sm">{sourceLabels[`tour:${viewRow.bookingId}`] || "Tour"}</dd>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-base-content/50">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm">{viewRow.description?.trim() || "No description"}</dd>
              </div>
            </dl>
            <div className="flex justify-end gap-2 pt-2">
              {canEdit ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    openEdit(viewRow);
                  }}
                >
                  Edit
                </button>
              ) : null}
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setModal(null)}>
                Close
              </button>
            </div>
          </div>
        ) : null}
      </DashboardModal>
    </div>
  );
}
