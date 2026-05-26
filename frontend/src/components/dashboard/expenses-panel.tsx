"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Link2, CheckCircle } from "lucide-react";
import { useCompany } from "@/store/company-context";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { EntityViewModal } from "@/components/dashboard/entity-view-modal";
import {
  DashboardPagination,
  DashboardTableExport,
  type ExportColumn,
  useDashboardPagination,
} from "@/components/dashboard/dashboard-table-tools";
import type { CurrencyCode } from "@/lib/data";
import { formatKesForDisplay } from "@/lib/data";

type ExpenseRow = {
  id: number;
  bookingId: number | null;
  category: string;
  amount: number;
  description: string | null;
  incurredAt: string | null;
};

type BookingOpt = { id: number; label: string };

const exportColumns: ExportColumn<ExpenseRow>[] = [
  { key: "id", header: "ID", value: (x) => x.id },
  { key: "category", header: "Category", value: (x) => x.category },
  { key: "bookingId", header: "Booking ID", value: (x) => x.bookingId },
  { key: "amount", header: "Amount", value: (x) => x.amount },
  { key: "description", header: "Description", value: (x) => x.description },
  { key: "incurredAt", header: "Date", value: (x) => x.incurredAt },
];

export function ExpensesPanel() {
  const { selectedCompanyId } = useCompany();
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [bookings, setBookings] = useState<BookingOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catF, setCatF] = useState("");
  const [bookingF, setBookingF] = useState<"" | "linked" | "none">("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
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
      const [eRes, bRes] = await Promise.all([fetch(`/api/expenses?${qs}`), fetch(`/api/bookings?${qs}`)]);
      const eJson = await eRes.json();
      const bJson = await bRes.json();
      if (!eRes.ok) throw new Error(eJson.error ?? "Failed");
      setRows(eJson.expenses ?? []);
      setBookings(
        (bJson.bookings ?? []).map((b: { id: number; firstName: string; lastName: string | null; email: string }) => ({
          id: b.id,
          label: `#${b.id} — ${[b.firstName, b.lastName].filter(Boolean).join(" ") || b.email}`,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => s.add(r.category));
    return [...s].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (catF && r.category !== catF) return false;
      if (bookingF === "linked" && r.bookingId == null) return false;
      if (bookingF === "none" && r.bookingId != null) return false;
      return true;
    });
  }, [rows, catF, bookingF]);
  const { page, pageCount, setPage, pagedRows } = useDashboardPagination(filtered, 10);

  function openCreate() {
    setEditId(null);
    setForm({
      category: "",
      amount: "",
      amountCurrency: "KES",
      description: "",
      bookingId: "",
      incurredAt: "",
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
      incurredAt: x.incurredAt ? x.incurredAt.slice(0, 10) : "",
    });
    setModal("edit");
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
      if (form.incurredAt) body.incurredAt = new Date(form.incurredAt + "T12:00:00").toISOString();
      const res = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
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
      showToast(d.error ?? "Delete failed", "error");
      return;
    }
    await load();
    showToast("Expense deleted successfully", "success");
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
          <h1 className="font-serif text-2xl font-bold text-base-content mb-5">Expenses</h1>
          <p className="text-sm text-base-content/60">Log costs by category and optionally tie them to a booking.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add expense
        </button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="overflow-x-auto mt-5 rounded-2xl border border-base-content/10 bg-base-100 shadow-sm">
        <table className="table table-sm">
          <thead className="sticky top-0 z-10 bg-base-200/95 text-xs uppercase text-base-content/70 backdrop-blur">
            <tr>
              <th className="align-top">ID</th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-[9rem] flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Category
                    <select
                      className="select select-bordered select-xs max-w-[8rem] rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={catF}
                      onChange={(e) => setCatF(e.target.value)}
                    >
                      <option value="">All</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              </th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-[8rem] flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Booking
                    <select
                      className="select select-bordered select-xs max-w-[7.5rem] rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={bookingF}
                      onChange={(e) => setBookingF(e.target.value as "" | "linked" | "none")}
                    >
                      <option value="">All</option>
                      <option value="linked">Linked</option>
                      <option value="none">Not linked</option>
                    </select>
                  </span>
                </label>
              </th>
              <th className="align-top">Amount</th>
              <th className="align-top">Date</th>
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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-base-content/50">
                  {rows.length === 0 ? "No expenses." : "No expenses match filters."}
                </td>
              </tr>
            ) : (
              pagedRows.map((x) => (
                <tr
                  key={x.id}
                  className="cursor-pointer transition-colors hover:bg-primary/5 active:bg-primary/10"
                  onClick={() => setViewId(x.id)}
                >
                  <td className="font-mono text-xs">{x.id}</td>
                  <td>
                    <span className="badge badge-outline badge-sm">{x.category}</span>
                  </td>
                  <td>
                    {x.bookingId != null ? (
                      <a
                        href={`/dashboard/bookings#booking-${x.bookingId}`}
                        className="link link-primary inline-flex items-center gap-1 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link2 className="h-3 w-3" />#{x.bookingId}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="tabular-nums font-medium">{formatKesForDisplay(x.amount)}</td>
                  <td className="text-xs text-base-content/60">
                    {x.incurredAt ? new Date(x.incurredAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="flex items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(x);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square text-error"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(x.id);
                      }}
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
        <DashboardTableExport title="Expenses" rows={filtered} columns={exportColumns} />
      </div>

      {/* CREATE MODAL */}
      <DashboardModal open={modal === "create"} title="New expense" onClose={() => setModal(null)}>
        <form className="space-y-6" onSubmit={submitCreate}>
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
              <input
                className="input input-bordered input-sm w-full rounded-md"
                style={inputStyle}
                value="KES"
                readOnly
              />
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
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Link booking</span>
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
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Incurred date</span>
            <input
              type="date"
              className="input input-bordered input-sm w-full rounded-md"
              style={inputStyle}
              value={form.incurredAt}
              onChange={(e) => setForm({ ...form, incurredAt: e.target.value })}
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

      {/* EDIT MODAL */}
      <DashboardModal open={modal === "edit"} title="Edit expense" onClose={() => setModal(null)}>
        <form className="space-y-6" onSubmit={submitEdit}>
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
              <input
                className="input input-bordered input-sm w-full rounded-md"
                style={inputStyle}
                value="KES"
                readOnly
              />
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
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Booking</span>
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
        kind="expense"
        entityId={viewId}
      />
    </div>
  );
}