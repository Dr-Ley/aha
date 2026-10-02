"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Wine, CheckCircle, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useCompany } from "@/store/company-context";
import { companyUsesBar } from "@/types/company";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { TypeaheadCreateSelect } from "@/components/dashboard/typeahead-create-select";
import {
  DashboardPagination,
  DashboardTableExport,
  type ExportColumn,
  useDashboardPagination,
} from "@/components/dashboard/dashboard-table-tools";
import { formatKesForDisplay } from "@/lib/data";
import { orderPayLabel, orderPaySelectAccentClass } from "@/lib/dashboard-status-badges";
import { nairobiYmd } from "@/lib/nairobi-date";
import { cn } from "@/lib/utils";
import {
  breakdownSummary,
  dateRangeForPreset,
  dayInRange,
  dayPeriodLabel,
  defaultSaturdayFridayWeek,
  formatDayFromLabel,
  formatWeekFromLabel,
  itemsSoldTotal,
  parseDayLabel,
  parseWeekPeriod,
  salesTotal,
  soldLines,
  weekOverlapsRange,
  weekPeriodLabel,
  type WeeklyDatePreset,
} from "@/lib/weekly-bar";

const ORDER_PAY_STATUS = ["unpaid", "partially_paid", "paid"] as const;
const DATE_PRESETS: { id: WeeklyDatePreset; label: string }[] = [
  { id: "this_week", label: "This week" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "last_3_months", label: "Last 3 months" },
  { id: "this_year", label: "This year" },
  { id: "custom", label: "Custom range" },
];

type ItemRow = { id: number; name: string; price: number; categoryName: string | null };
type LineItem = {
  itemName: string;
  quantity: number;
  unitPrice?: number;
  lineTotal: number;
};
type OrderRow = {
  id: number;
  status: (typeof ORDER_PAY_STATUS)[number] | string;
  tableLabel: string | null;
  customerName: string | null;
  notes?: string | null;
  total: number;
  itemsSold?: number;
  lineItems?: LineItem[];
  createdAt: string | null;
};

type LineForm = { itemId: string; quantity: string };

function periodText(o: OrderRow, isWeekly: boolean) {
  return isWeekly ? formatWeekFromLabel(o.tableLabel) : formatDayFromLabel(o.tableLabel);
}

function salesExportColumns(isWeekly: boolean): ExportColumn<OrderRow>[] {
  return [
    { key: "period", header: isWeekly ? "Week" : "Day", value: (o) => periodText(o, isWeekly) },
    { key: "sales", header: "Sales", value: (o) => recordSales(o) },
    { key: "itemsSold", header: "Items sold", value: (o) => recordItemsSold(o) },
    { key: "breakdown", header: "Breakdown", value: (o) => recordBreakdown(o) },
    { key: "status", header: "Status", value: (o) => orderPayLabel(o.status) },
    { key: "notes", header: "Notes", value: (o) => o.notes },
  ];
}

function recordLines(o: OrderRow) {
  return soldLines(o.lineItems ?? []);
}

function recordSales(o: OrderRow) {
  const lines = recordLines(o);
  return lines.length ? salesTotal(lines) : Number(o.total) || 0;
}

function recordItemsSold(o: OrderRow) {
  const lines = recordLines(o);
  return lines.length ? itemsSoldTotal(lines) : Number(o.itemsSold) || 0;
}

function recordBreakdown(o: OrderRow) {
  return breakdownSummary(recordLines(o));
}

export function BarPanel() {
  const { selectedCompanyId } = useCompany();
  const ok = companyUsesBar(selectedCompanyId);
  const isWeekly = selectedCompanyId === "ewc";

  const [items, setItems] = useState<ItemRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusF, setStatusF] = useState("");
  const [search, setSearch] = useState("");
  const [preset, setPreset] = useState<WeeklyDatePreset>("this_year");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [form, setForm] = useState({
    weekStart: "",
    weekEnd: "",
    saleDate: "",
    notes: "",
    status: "unpaid",
    lines: [{ itemId: "", quantity: "1" }] as LineForm[],
  });
  const [editing, setEditing] = useState<OrderRow | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    weekStart: "",
    weekEnd: "",
    saleDate: "",
    notes: "",
    status: "unpaid",
  });
  const [detail, setDetail] = useState<OrderRow | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    if (!ok) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ companyId: selectedCompanyId });
      const [iRes, oRes] = await Promise.all([
        fetch(`/api/bar-items?${qs}`),
        fetch(`/api/bar-orders?${qs}`),
      ]);
      const iJson = await iRes.json();
      const oJson = await oRes.json();
      if (!iRes.ok) throw new Error(iJson.error ?? "Bar items");
      if (!oRes.ok) throw new Error(oJson.error ?? "Bar records");
      setItems(iJson.items ?? []);
      setOrders(oJson.orders ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [ok, selectedCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRecords = useMemo(() => {
    const range = dateRangeForPreset(preset, new Date(), { from: customFrom, to: customTo });
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) => {
        if (statusF && o.status !== statusF) return false;
        if (range) {
          if (isWeekly) {
            const period = parseWeekPeriod(o.tableLabel);
            if (!period || !weekOverlapsRange(period, range.from, range.to)) return false;
          } else {
            const day = parseDayLabel(o.tableLabel);
            if (!dayInRange(day, range.from, range.to)) return false;
          }
        }
        if (!q) return true;
        const hay = [
          periodText(o, isWeekly),
          o.tableLabel,
          o.notes,
          o.customerName,
          orderPayLabel(o.status),
          recordBreakdown(o),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        const pa = isWeekly ? parseWeekPeriod(a.tableLabel)?.start ?? "" : parseDayLabel(a.tableLabel) ?? "";
        const pb = isWeekly ? parseWeekPeriod(b.tableLabel)?.start ?? "" : parseDayLabel(b.tableLabel) ?? "";
        if (pa && pb && pa !== pb) return pb.localeCompare(pa);
        return String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
      });
  }, [orders, statusF, isWeekly, preset, customFrom, customTo, search]);

  const displayedOrders = filteredRecords;
  const { page, pageCount, setPage, pagedRows } = useDashboardPagination(displayedOrders, 10);

  const weeklyKpis = useMemo(() => {
    const sales = displayedOrders.reduce((sum, o) => sum + recordSales(o), 0);
    const itemsSold = displayedOrders.reduce((sum, o) => sum + recordItemsSold(o), 0);
    const count = displayedOrders.length;
    return {
      sales,
      records: count,
      itemsSold,
      average: count ? Math.round(sales / count) : 0,
    };
  }, [displayedOrders]);

  const itemOptions = useMemo(
    () =>
      items.map((i) => ({
        id: String(i.id),
        label: i.name,
        description: `${formatKesForDisplay(i.price)}${i.categoryName ? ` · ${i.categoryName}` : ""}`,
      })),
    [items]
  );

  async function patchStatus(orderId: number, status: string) {
    const res = await fetch("/api/bar-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, companyId: selectedCompanyId, status }),
    });
    const d = await res.json();
    if (!res.ok) {
      showToast(d.error ?? "Update failed", "error");
      return;
    }
    await load();
    showToast("Status updated", "success");
  }

  function openNew() {
    const week = defaultSaturdayFridayWeek();
    setForm({
      weekStart: isWeekly ? week.start : "",
      weekEnd: isWeekly ? week.end : "",
      saleDate: isWeekly ? "" : nairobiYmd(),
      notes: "",
      status: "unpaid",
      lines: [{ itemId: "", quantity: "1" }],
    });
    setModal(true);
  }

  async function createBarItem(name: string) {
    const existing = items.find((i) => i.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      return {
        id: String(existing.id),
        label: existing.name,
        description: `${formatKesForDisplay(existing.price)}${
          existing.categoryName ? ` · ${existing.categoryName}` : ""
        }`,
      };
    }

    const rawPrice = window.prompt(`Price in KES for "${name}"`, "0");
    if (rawPrice === null) return null;
    const price = Math.max(0, Math.round(Number(rawPrice)));
    if (!Number.isFinite(price)) {
      showToast("Enter a valid price", "error");
      return null;
    }

    const res = await fetch("/api/bar-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: selectedCompanyId,
        name,
        price,
        isAvailable: true,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.item) {
      showToast(typeof data.error === "string" ? data.error : "Could not create item", "error");
      return null;
    }
    const item = data.item as ItemRow;
    setItems((current) => {
      const withoutDuplicate = current.filter((i) => i.id !== item.id);
      return [item, ...withoutDuplicate];
    });
    showToast(data.existing ? "Existing item selected" : "Item created", "success");
    return {
      id: String(item.id),
      label: item.name,
      description: `${formatKesForDisplay(item.price)}${item.categoryName ? ` · ${item.categoryName}` : ""}`,
    };
  }

  function weekLabelFromForm(start: string, end: string): string | null {
    if (!start || !end) return null;
    return weekPeriodLabel(start, end);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const linePayload = form.lines
      .map((l) => ({
        itemId: parseInt(l.itemId, 10),
        quantity: parseInt(l.quantity, 10),
      }))
      .filter((l) => !Number.isNaN(l.itemId) && l.itemId > 0 && l.quantity > 0);
    if (linePayload.length === 0) {
      showToast("Add at least one product", "error");
      return;
    }
    const tableLabel = isWeekly
      ? weekLabelFromForm(form.weekStart, form.weekEnd)
      : form.saleDate
        ? dayPeriodLabel(form.saleDate)
        : null;
    if (!tableLabel) {
      showToast(isWeekly ? "Enter the week start and end dates" : "Enter the sales date", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/bar-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          tableLabel,
          customerName: null,
          notes: form.notes || null,
          status: form.status || "unpaid",
          items: linePayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
      setModal(false);
      await load();
      showToast(isWeekly ? "Weekly record saved" : "Daily record saved", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const tableLabel = isWeekly
      ? weekLabelFromForm(editForm.weekStart, editForm.weekEnd)
      : editForm.saleDate
        ? dayPeriodLabel(editForm.saleDate)
        : null;
    if (!tableLabel) {
      showToast(isWeekly ? "Enter the week start and end dates" : "Enter the sales date", "error");
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch("/api/bar-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          companyId: selectedCompanyId,
          tableLabel,
          customerName: null,
          notes: editForm.notes.trim() || null,
          status: editForm.status,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(typeof d.error === "string" ? d.error : "Update failed");
      setEditing(null);
      await load();
      showToast(isWeekly ? "Weekly record updated" : "Daily record updated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setEditSaving(false);
    }
  }

  function openEdit(o: OrderRow) {
    const period = parseWeekPeriod(o.tableLabel);
    setEditForm({
      weekStart: period?.start ?? "",
      weekEnd: period?.end ?? "",
      saleDate: parseDayLabel(o.tableLabel) ?? "",
      notes: o.notes ?? "",
      status: ORDER_PAY_STATUS.includes(o.status as (typeof ORDER_PAY_STATUS)[number])
        ? o.status
        : "unpaid",
    });
    setEditing(o);
  }

  async function removeOrder(id: number) {
    if (
      !window.confirm(
        isWeekly
          ? "Delete this weekly bar record? This cannot be undone."
          : "Delete this daily bar record? This cannot be undone."
      )
    ) {
      return;
    }
    const qs = new URLSearchParams({ id: String(id), companyId: selectedCompanyId });
    const res = await fetch(`/api/bar-orders?${qs}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) {
      showToast(typeof d.error === "string" ? d.error : "Delete failed", "error");
      return;
    }
    await load();
    showToast(isWeekly ? "Weekly record deleted" : "Daily record deleted", "success");
  }

  if (!ok) {
    return (
      <div className="space-y-2">
        <h1 className="font-serif text-2xl font-bold text-base-content">Bar</h1>
        <p className="text-sm text-base-content/60 max-w-md">
          Switch to Enchoro Wildlife Camp or Bondo Travellers Hotel to manage the bar.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = { outline: "1px solid gray" };
  const detailLines = detail ? recordLines(detail) : [];
  const detailNotes = detail?.notes?.trim() ?? "";

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
          <h1 className="font-serif text-2xl font-bold text-base-content flex items-center gap-2">
            <Wine className="h-7 w-7" />
            Bar
          </h1>
          <p className="text-sm text-base-content/60">
            {isWeekly
              ? "Weekly bar sales records for management. Each row is one week, not a single drink order."
              : "Daily bar sales records for management. Each row is one day, not a single drink order."}
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" />
          {isWeekly ? "New weekly record" : "New daily record"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-base-content/60">Total sales</p>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{formatKesForDisplay(weeklyKpis.sales)}</p>
        </div>
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-base-content/60">
            {isWeekly ? "Weekly records" : "Daily records"}
          </p>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{weeklyKpis.records}</p>
        </div>
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-base-content/60">Items sold</p>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{weeklyKpis.itemsSold}</p>
        </div>
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-base-content/60">
            {isWeekly ? "Average weekly sales" : "Average daily sales"}
          </p>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{formatKesForDisplay(weeklyKpis.average)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
        <label className="form-control w-full max-w-md">
          <span className="label-text text-xs font-medium uppercase tracking-wide text-base-content/60">Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
            <input
              className="input input-bordered input-sm w-full rounded-md pl-9"
              style={inputStyle}
              placeholder={isWeekly ? "Week, product, or notes" : "Day, product, or notes"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>
      </div>

      {items.length === 0 && !loading && (
        <p className="text-sm text-warning">No bar items yet. Search in a line item to create the first one.</p>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-base-content/10 bg-base-100 shadow-sm">
          <table className="table table-sm">
            <thead className="sticky top-0 z-10 bg-base-200/95 text-xs uppercase text-base-content/70 backdrop-blur">
              <tr>
                <th className="align-top normal-case font-normal">
                  <label className="flex min-w-44 flex-col gap-1 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                    <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                      {isWeekly ? "Week" : "Day"}
                      <select
                        className="select select-bordered select-xs max-w-40 rounded-md font-normal normal-case"
                        style={inputStyle}
                        value={preset}
                        onChange={(e) => setPreset(e.target.value as WeeklyDatePreset)}
                        title={isWeekly ? "Filter by week" : "Filter by day"}
                      >
                        {DATE_PRESETS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </span>
                    {preset === "custom" && (
                      <span className="inline-flex flex-wrap items-center gap-1 font-normal normal-case">
                        <input
                          type="date"
                          className="input input-bordered input-xs rounded-md"
                          style={inputStyle}
                          value={customFrom}
                          onChange={(e) => setCustomFrom(e.target.value)}
                          aria-label="From"
                        />
                        <input
                          type="date"
                          className="input input-bordered input-xs rounded-md"
                          style={inputStyle}
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                          aria-label="To"
                        />
                      </span>
                    )}
                  </label>
                </th>
                <th className="text-right align-top">Sales</th>
                <th className="text-right align-top">Items sold</th>
                <th className="align-top">Breakdown</th>
                <th className="align-top normal-case font-normal">
                  <label className="flex min-w-36 flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                    <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                      Status
                      <select
                        className="select select-bordered select-xs max-w-36 rounded-md font-normal normal-case"
                        style={inputStyle}
                        value={statusF}
                        onChange={(e) => setStatusF(e.target.value)}
                        title="Filter by status"
                      >
                        <option value="">All</option>
                        {ORDER_PAY_STATUS.map((s) => (
                          <option key={s} value={s}>
                            {orderPayLabel(s)}
                          </option>
                        ))}
                      </select>
                    </span>
                  </label>
                </th>
                <th className="w-[1%] align-top">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <span className="loading loading-spinner loading-md" />
                  </td>
                </tr>
              ) : displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-base-content/50">
                    {orders.length === 0
                      ? isWeekly
                        ? "No weekly bar records."
                        : "No daily bar records."
                      : "No records match the selected filters."}
                  </td>
                </tr>
              ) : (
                pagedRows.map((o) => (
                  <tr
                    key={o.id}
                    className="cursor-pointer transition-colors hover:bg-primary/5 active:bg-primary/10"
                    onClick={() => setDetail(o)}
                  >
                    <td className="font-medium">{periodText(o, isWeekly)}</td>
                    <td className="text-right tabular-nums font-medium">{formatKesForDisplay(recordSales(o))}</td>
                    <td className="text-right tabular-nums">{recordItemsSold(o)}</td>
                    <td className="max-w-64 text-sm text-base-content/80">{recordBreakdown(o) || "—"}</td>
                    <td>
                      <select
                        className={cn(
                          "select select-bordered select-xs rounded-md",
                          orderPaySelectAccentClass(o.status)
                        )}
                        style={inputStyle}
                        value={
                          ORDER_PAY_STATUS.includes(o.status as (typeof ORDER_PAY_STATUS)[number])
                            ? o.status
                            : "unpaid"
                        }
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => void patchStatus(o.id, e.target.value)}
                      >
                        {ORDER_PAY_STATUS.map((s) => (
                          <option key={s} value={s}>
                            {orderPayLabel(s)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetail(o);
                        }}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(o);
                        }}
                        title="Edit record"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={(e) => {
                          e.stopPropagation();
                          void removeOrder(o.id);
                        }}
                        title="Delete record"
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

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 max-md:flex-col max-md:items-stretch">
        <DashboardPagination page={page} pageCount={pageCount} setPage={setPage} />
        <DashboardTableExport
          title={isWeekly ? "Weekly bar records" : "Daily bar records"}
          rows={displayedOrders}
          columns={salesExportColumns(isWeekly)}
        />
      </div>

      <DashboardModal
        open={modal}
        onClose={() => setModal(false)}
        title={isWeekly ? "New weekly bar record" : "New daily bar record"}
        wide
      >
        <form onSubmit={submit} className="space-y-3 max-w-2xl">
          {isWeekly ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="form-control w-full">
                <span className="label-text text-sm">Week start</span>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  style={inputStyle}
                  required
                  value={form.weekStart}
                  onChange={(e) => setForm((f) => ({ ...f, weekStart: e.target.value }))}
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Week end</span>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  style={inputStyle}
                  required
                  value={form.weekEnd}
                  onChange={(e) => setForm((f) => ({ ...f, weekEnd: e.target.value }))}
                />
              </label>
            </div>
          ) : (
            <label className="form-control w-full">
              <span className="label-text text-sm">Sales date</span>
              <input
                type="date"
                className="input input-bordered input-sm w-full"
                style={inputStyle}
                required
                value={form.saleDate}
                onChange={(e) => setForm((f) => ({ ...f, saleDate: e.target.value }))}
              />
            </label>
          )}
          {form.lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <label className="form-control w-full col-span-8">
                <span className="label-text text-sm">Product</span>
                <TypeaheadCreateSelect
                  value={line.itemId}
                  options={itemOptions}
                  inputStyle={inputStyle}
                  placeholder="Search or create product..."
                  createLabel="Create bar item"
                  onCreate={createBarItem}
                  onSelect={(itemId) => {
                    const next = [...form.lines];
                    next[idx] = { ...line, itemId };
                    setForm((f) => ({ ...f, lines: next }));
                  }}
                />
              </label>
              <label className="form-control w-full col-span-3">
                <span className="label-text text-sm">Qty</span>
                <input
                  className="input input-bordered input-sm w-full"
                  style={inputStyle}
                  value={line.quantity}
                  onChange={(e) => {
                    const next = [...form.lines];
                    next[idx] = { ...line, quantity: e.target.value };
                    setForm((f) => ({ ...f, lines: next }));
                  }}
                />
              </label>
              <div className="col-span-1">
                {form.lines.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() =>
                      setForm((f) => ({ ...f, lines: f.lines.filter((_, j) => j !== idx) }))
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, { itemId: "", quantity: "1" }] }))}
          >
            + Product
          </button>
          <label className="form-control w-full">
            <span className="label-text text-sm">Record status</span>
            <select
              className={cn(
                "select select-bordered select-sm w-full rounded-md",
                orderPaySelectAccentClass(form.status)
              )}
              style={inputStyle}
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {ORDER_PAY_STATUS.map((s) => (
                <option key={s} value={s}>
                  {orderPayLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control w-full">
            <span className="label-text text-sm">Notes</span>
            <textarea
              className="textarea textarea-bordered textarea-sm w-full min-h-16"
              style={inputStyle}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? (
                <span className="loading loading-spinner loading-xs" />
              ) : isWeekly ? (
                "Save weekly record"
              ) : (
                "Save daily record"
              )}
            </button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal
        open={editing != null}
        onClose={() => setEditing(null)}
        title={isWeekly ? "Edit weekly bar record" : "Edit daily bar record"}
      >
        <form onSubmit={saveEdit} className="space-y-3 max-w-lg">
          <label className="form-control w-full">
            <span className="label-text text-sm">Record status</span>
            <select
              className={cn(
                "select select-bordered select-sm w-full rounded-md",
                orderPaySelectAccentClass(editForm.status)
              )}
              style={inputStyle}
              value={
                ORDER_PAY_STATUS.includes(editForm.status as (typeof ORDER_PAY_STATUS)[number])
                  ? editForm.status
                  : "unpaid"
              }
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
            >
              {ORDER_PAY_STATUS.map((s) => (
                <option key={s} value={s}>
                  {orderPayLabel(s)}
                </option>
              ))}
            </select>
          </label>
          {isWeekly ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="form-control w-full">
                <span className="label-text text-sm">Week start</span>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  style={inputStyle}
                  required
                  value={editForm.weekStart}
                  onChange={(e) => setEditForm((f) => ({ ...f, weekStart: e.target.value }))}
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text text-sm">Week end</span>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  style={inputStyle}
                  required
                  value={editForm.weekEnd}
                  onChange={(e) => setEditForm((f) => ({ ...f, weekEnd: e.target.value }))}
                />
              </label>
            </div>
          ) : (
            <label className="form-control w-full">
              <span className="label-text text-sm">Sales date</span>
              <input
                type="date"
                className="input input-bordered input-sm w-full"
                style={inputStyle}
                required
                value={editForm.saleDate}
                onChange={(e) => setEditForm((f) => ({ ...f, saleDate: e.target.value }))}
              />
            </label>
          )}
          <label className="form-control w-full">
            <span className="label-text text-sm">Notes</span>
            <textarea
              className="textarea textarea-bordered textarea-sm w-full min-h-16"
              style={inputStyle}
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={editSaving}>
              {editSaving ? <span className="loading loading-spinner loading-xs" /> : "Save"}
            </button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal
        open={detail != null}
        onClose={() => setDetail(null)}
        title={isWeekly ? "Weekly bar record" : "Daily bar record"}
      >
        {detail && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                {isWeekly ? "Week" : "Day"}
              </p>
              <p className="mt-1 text-lg font-semibold">
                {isWeekly ? formatWeekFromLabel(detail.tableLabel, "long") : formatDayFromLabel(detail.tableLabel, "long")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-base-200/60 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">Total sales</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{formatKesForDisplay(recordSales(detail))}</p>
              </div>
              <div className="rounded-xl bg-base-200/60 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">Items sold</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{recordItemsSold(detail)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">Sales breakdown</p>
              <div className="mt-2 overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailLines.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-sm text-base-content/50">
                          {isWeekly ? "No products recorded for this week." : "No products recorded for this day."}
                        </td>
                      </tr>
                    ) : (
                      detailLines.map((line) => (
                        <tr key={line.name}>
                          <td>{line.name}</td>
                          <td className="text-right tabular-nums">{line.quantity}</td>
                          <td className="text-right tabular-nums">{formatKesForDisplay(line.sales)}</td>
                        </tr>
                      ))
                    )}
                    {detailLines.length > 0 && (
                      <tr className="font-semibold">
                        <td>Total</td>
                        <td className="text-right tabular-nums">{recordItemsSold(detail)}</td>
                        <td className="text-right tabular-nums">{formatKesForDisplay(recordSales(detail))}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">Record status</p>
              <p className="mt-1 text-sm">{orderPayLabel(detail.status)}</p>
            </div>
            {detailNotes ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{detailNotes}</p>
              </div>
            ) : null}
          </div>
        )}
      </DashboardModal>
    </div>
  );
}
