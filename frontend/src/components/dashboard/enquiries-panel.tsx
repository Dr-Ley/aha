"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, Mail } from "lucide-react";
import { useCompany } from "@/store/company-context";
import { EntityViewModal } from "@/components/dashboard/entity-view-modal";
import {
  DashboardPagination,
  DashboardTableExport,
  type ExportColumn,
  useDashboardPagination,
} from "@/components/dashboard/dashboard-table-tools";

type EnquiryRow = {
  id: number;
  userId: number | null;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string | null;
  createdAt: string | null;
};

function fullName(row: EnquiryRow): string {
  return [row.firstName, row.lastName].filter(Boolean).join(" ").trim() || row.email;
}

const exportColumns: ExportColumn<EnquiryRow>[] = [
  { key: "id", header: "ID", value: (row) => row.id },
  { key: "name", header: "Name", value: fullName },
  { key: "email", header: "Email", value: (row) => row.email },
  { key: "phone", header: "Phone", value: (row) => row.phone },
  { key: "subject", header: "Subject", value: (row) => row.subject },
  { key: "status", header: "Status", value: (row) => row.status ?? "new" },
  { key: "message", header: "Message", value: (row) => row.message },
  { key: "createdAt", header: "Created", value: (row) => row.createdAt },
];

export function EnquiriesPanel() {
  const { selectedCompanyId } = useCompany();
  const [rows, setRows] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [modalId, setModalId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contact");
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to load enquiries");
      setRows(data.enquiries ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && (row.status ?? "new") !== statusFilter) return false;
      if (!needle) return true;
      return `${fullName(row)} ${row.email} ${row.phone ?? ""} ${row.subject} ${row.message}`
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, query, statusFilter]);

  const { page, pageCount, setPage, pagedRows } = useDashboardPagination(filtered, 10);

  async function markReplied(id: number) {
    const res = await fetch("/api/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "replied" }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(typeof data.error === "string" ? data.error : "Update failed", "error");
      return;
    }
    await load();
    showToast("Enquiry marked replied", "success");
  }

  const inputStyle: React.CSSProperties = { outline: "1px solid gray" };

  return (
    <div className="space-y-6">
      {toast ? (
        <div
          className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${
            toast.type === "success" ? "bg-success text-success-content" : "bg-error text-error-content"
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-base-content">
            <Mail className="h-7 w-7" />
            Enquiries
          </h1>
          <p className="text-sm text-base-content/60">Contact form submissions and follow-up status.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
        <label className="form-control gap-1">
          <span className="label-text text-xs font-medium text-base-content/70">Search</span>
          <input
            className="input input-bordered input-sm w-64 rounded-md"
            style={inputStyle}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email, subject..."
          />
        </label>
        <label className="form-control gap-1">
          <span className="label-text text-xs font-medium text-base-content/70">Status</span>
          <select
            className="select select-bordered select-sm rounded-md"
            style={inputStyle}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-base-content/10 bg-base-100 shadow-sm">
        <table className="table table-sm">
          <thead className="sticky top-0 z-10 bg-base-200/95 text-xs uppercase text-base-content/70 backdrop-blur">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : pagedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-base-content/50">
                  No enquiries found.
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer transition-colors hover:bg-primary/5 active:bg-primary/10"
                  onClick={() => setModalId(row.id)}
                >
                  <td className="font-mono text-xs">#{row.id}</td>
                  <td>
                    <div className="font-medium">{fullName(row)}</div>
                    <div className="text-xs text-base-content/50">{row.email}</div>
                  </td>
                  <td className="text-sm">{row.phone ?? "—"}</td>
                  <td className="max-w-64 truncate text-sm" title={row.subject}>
                    {row.subject}
                  </td>
                  <td>
                    <span className={`badge badge-sm ${(row.status ?? "new") === "replied" ? "badge-success" : "badge-warning"}`}>
                      {row.status ?? "new"}
                    </span>
                  </td>
                  <td className="text-xs text-base-content/60">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="text-right">
                    {(row.status ?? "new") !== "replied" ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          void markReplied(row.id);
                        }}
                      >
                        Mark replied
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DashboardPagination page={page} pageCount={pageCount} setPage={setPage} />
        <DashboardTableExport title="Enquiries" rows={filtered} columns={exportColumns} />
      </div>

      <EntityViewModal
        open={modalId !== null}
        onClose={() => setModalId(null)}
        companyId={selectedCompanyId}
        kind="enquiry"
        entityId={modalId}
      />
    </div>
  );
}
