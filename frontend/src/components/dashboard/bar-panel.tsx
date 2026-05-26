"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Wine, CheckCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { useCompany } from "@/store/company-context";
import { companyUsesBar } from "@/types/company";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { TypeaheadCreateSelect } from "@/components/dashboard/typeahead-create-select";
import { EntityViewModal } from "@/components/dashboard/entity-view-modal";
import {
  DashboardPagination,
  DashboardTableExport,
  type ExportColumn,
  useDashboardPagination,
} from "@/components/dashboard/dashboard-table-tools";
import { formatKesForDisplay } from "@/lib/data";
import { orderPayLabel, orderPaySelectAccentClass } from "@/lib/dashboard-status-badges";
import { cn } from "@/lib/utils";

const ORDER_PAY_STATUS = ["unpaid", "partially_paid", "paid"] as const;

type ItemRow = { id: number; name: string; price: number; categoryName: string | null };
type OrderRow = {
  id: number;
  status: (typeof ORDER_PAY_STATUS)[number] | string;
  tableLabel: string | null;
  customerName: string | null;
  notes?: string | null;
  total: number;
  createdAt: string | null;
};

type LineForm = { itemId: string; quantity: string };

const exportColumns: ExportColumn<OrderRow>[] = [
  { key: "id", header: "ID", value: (o) => o.id },
  { key: "status", header: "Payment status", value: (o) => o.status },
  { key: "table", header: "Table / ref", value: (o) => o.tableLabel ?? o.customerName },
  { key: "customer", header: "Customer", value: (o) => o.customerName },
  { key: "total", header: "Total", value: (o) => o.total },
  { key: "notes", header: "Notes", value: (o) => o.notes },
  { key: "createdAt", header: "Created", value: (o) => o.createdAt },
];

export function BarPanel() {
  const { selectedCompanyId } = useCompany();
  const ok = companyUsesBar(selectedCompanyId);

  const [items, setItems] = useState<ItemRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusF, setStatusF] = useState("");
  const [form, setForm] = useState({
    tableLabel: "",
    customerName: "",
    lines: [{ itemId: "", quantity: "1" }] as LineForm[],
  });
  const [editing, setEditing] = useState<OrderRow | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    tableLabel: "",
    customerName: "",
    notes: "",
    status: "unpaid",
  });
  const [viewId, setViewId] = useState<number | null>(null);

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
      if (!oRes.ok) throw new Error(oJson.error ?? "Bar orders");
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

  const displayedOrders = useMemo(() => {
    if (!statusF) return orders;
    return orders.filter((o) => o.status === statusF);
  }, [orders, statusF]);
  const { page, pageCount, setPage, pagedRows } = useDashboardPagination(displayedOrders, 10);

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
    setForm({
      tableLabel: "",
      customerName: "",
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const linePayload = form.lines
      .map((l) => ({
        itemId: parseInt(l.itemId, 10),
        quantity: parseInt(l.quantity, 10),
      }))
      .filter((l) => !Number.isNaN(l.itemId) && l.itemId > 0 && l.quantity > 0);
    if (linePayload.length === 0) {
      showToast("Add at least one line", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/bar-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          tableLabel: form.tableLabel || null,
          customerName: form.customerName || null,
          status: "unpaid",
          items: linePayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
      setModal(false);
      await load();
      showToast("Order created", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/bar-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          companyId: selectedCompanyId,
          tableLabel: editForm.tableLabel.trim() || null,
          customerName: editForm.customerName.trim() || null,
          notes: editForm.notes.trim() || null,
          status: editForm.status,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(typeof d.error === "string" ? d.error : "Update failed");
      setEditing(null);
      await load();
      showToast("Order updated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setEditSaving(false);
    }
  }

  function openEdit(o: OrderRow) {
    setEditForm({
      tableLabel: o.tableLabel ?? "",
      customerName: o.customerName ?? "",
      notes: o.notes ?? "",
      status: ORDER_PAY_STATUS.includes(o.status as (typeof ORDER_PAY_STATUS)[number])
        ? o.status
        : "unpaid",
    });
    setEditing(o);
  }

  async function removeOrder(id: number) {
    if (!window.confirm("Delete this bar order? This cannot be undone.")) return;
    const qs = new URLSearchParams({ id: String(id), companyId: selectedCompanyId });
    const res = await fetch(`/api/bar-orders?${qs}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) {
      showToast(typeof d.error === "string" ? d.error : "Delete failed", "error");
      return;
    }
    await load();
    showToast("Order deleted", "success");
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
          <p className="text-sm text-base-content/60">Drink orders and payment status.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm gap-2"
          onClick={openNew}
        >
          <Plus className="h-4 w-4" />
          New order
        </button>
      </div>

      {items.length === 0 && !loading && (
        <p className="text-sm text-warning">No bar items yet. Search in a line item to create the first one.</p>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-base-content/10 bg-base-100 shadow-sm">
        <table className="table table-sm">
          <thead className="sticky top-0 z-10 bg-base-200/95 text-xs uppercase text-base-content/70 backdrop-blur">
            <tr>
              <th className="align-top">ID</th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-32 flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Payment
                    <select
                      className="select select-bordered select-xs max-w-36 rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={statusF}
                      onChange={(e) => setStatusF(e.target.value)}
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
              <th className="align-top">Table / ref</th>
              <th className="align-top">Total</th>
              <th className="align-top">Time</th>
              <th className="align-top w-[1%]">Actions</th>
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
                  {orders.length === 0 ? "No bar orders." : "No orders match status filter."}
                </td>
              </tr>
            ) : (
              pagedRows.map((o) => (
                <tr
                  key={o.id}
                  className="cursor-pointer transition-colors hover:bg-primary/5 active:bg-primary/10"
                  onClick={() => setViewId(o.id)}
                >
                  <td className="font-mono text-xs">#{o.id}</td>
                  <td>
                    <select
                      className={cn(
                        "select select-bordered select-xs rounded-md",
                        orderPaySelectAccentClass(o.status)
                      )}
                      style={inputStyle}
                      value={ORDER_PAY_STATUS.includes(o.status as (typeof ORDER_PAY_STATUS)[number]) ? o.status : "unpaid"}
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
                  <td className="text-sm">
                    {o.tableLabel || o.customerName || "—"}
                  </td>
                  <td className="tabular-nums font-medium">{formatKesForDisplay(Number(o.total) || 0)}</td>
                  <td className="text-xs text-base-content/60">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="whitespace-nowrap">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(o);
                      }}
                      title="Edit order"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        void removeOrder(o.id);
                      }}
                      title="Delete order"
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
        <DashboardTableExport title="Bar orders" rows={displayedOrders} columns={exportColumns} />
      </div>

      <DashboardModal open={modal} onClose={() => setModal(false)} title="New bar order" wide>
        <form onSubmit={submit} className="space-y-3 max-w-2xl">
          <div className="grid grid-cols-2 gap-2">
            <label className="form-control w-full">
              <span className="label-text text-sm">Table / tab</span>
              <input
                className="input input-bordered input-sm w-full"
                style={inputStyle}
                value={form.tableLabel}
                onChange={(e) => setForm((f) => ({ ...f, tableLabel: e.target.value }))}
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text text-sm">Guest / ref</span>
              <input
                className="input input-bordered input-sm w-full"
                style={inputStyle}
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              />
            </label>
          </div>
          {form.lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <label className="form-control w-full col-span-8">
                <span className="label-text text-sm">Item</span>
                <TypeaheadCreateSelect
                  value={line.itemId}
                  options={itemOptions}
                  inputStyle={inputStyle}
                  placeholder="Search or create item..."
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
            + Line
          </button>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-xs" /> : "Create order"}
            </button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal
        open={editing != null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit bar order #${editing.id}` : "Edit order"}
      >
        <form onSubmit={saveEdit} className="space-y-3 max-w-lg">
          <label className="form-control w-full">
            <span className="label-text text-sm">Payment status</span>
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
          <div className="grid grid-cols-2 gap-2">
            <label className="form-control w-full">
              <span className="label-text text-sm">Table / tab</span>
              <input
                className="input input-bordered input-sm w-full"
                style={inputStyle}
                value={editForm.tableLabel}
                onChange={(e) => setEditForm((f) => ({ ...f, tableLabel: e.target.value }))}
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text text-sm">Guest / ref</span>
              <input
                className="input input-bordered input-sm w-full"
                style={inputStyle}
                value={editForm.customerName}
                onChange={(e) => setEditForm((f) => ({ ...f, customerName: e.target.value }))}
              />
            </label>
          </div>
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
      <EntityViewModal
        open={viewId !== null}
        onClose={() => setViewId(null)}
        companyId={selectedCompanyId}
        kind="bar"
        entityId={viewId}
      />
    </div>
  );
}
