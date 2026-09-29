"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCompany } from "@/store/company-context";
import {
  DashboardPagination,
  DashboardTableExport,
  type ExportColumn,
  useDashboardPagination,
} from "@/components/dashboard/dashboard-table-tools";

type CustomerRow = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  nationality: string | null;
  country: string | null;
  notes: string | null;
  bookingCount: number;
  hotelStayCount: number;
  lastActivity: string | null;
  createdAt: string | null;
};

function displayName(row: CustomerRow): string {
  return [row.firstName, row.lastName].filter(Boolean).join(" ").trim() || row.email;
}

const exportColumns: ExportColumn<CustomerRow>[] = [
  { key: "id", header: "ID", value: (row) => row.id },
  { key: "name", header: "Name", value: displayName },
  { key: "email", header: "Email", value: (row) => row.email },
  { key: "phone", header: "Phone", value: (row) => row.phone },
  { key: "nationality", header: "Nationality", value: (row) => row.nationality },
  { key: "bookings", header: "Safaris", value: (row) => row.bookingCount },
  { key: "stays", header: "Hotel stays", value: (row) => row.hotelStayCount ?? 0 },
  { key: "lastActivity", header: "Last activity", value: (row) => row.lastActivity },
  { key: "notes", header: "Notes", value: (row) => row.notes },
];

export function CustomersPanel() {
  const { selectedCompanyId } = useCompany();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ companyId: selectedCompanyId });
      const res = await fetch(`/api/customers?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to load customers");
      setRows(data.customers ?? []);
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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      `${displayName(row)} ${row.email} ${row.phone ?? ""} ${row.nationality ?? ""} ${row.notes ?? ""}`
        .toLowerCase()
        .includes(needle)
    );
  }, [rows, query]);

  const { page, pageCount, setPage, pagedRows } = useDashboardPagination(filtered, 10);

  async function saveNotes(row: CustomerRow) {
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, companyId: selectedCompanyId, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Save failed");
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="text-sm text-base-content/60">
          Company-specific guest profiles. Stay and safari snapshots keep historical name and contact
          details. Email is the automatic match key; staff can still create or link a customer without
          one. AHA, Enchoro, and Bondo records stay separate.
        </p>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input input-bordered input-sm w-full max-w-xs"
          placeholder="Search name, email, phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <DashboardTableExport title={`Customers ${selectedCompanyId}`} columns={exportColumns} rows={filtered} />
      </div>

      {loading ? (
        <div className="loading loading-spinner loading-md" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-content/10">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Nationality</th>
                <th>Safaris</th>
                <th>Stays</th>
                <th>Last activity</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-base-content/60">
                    No customers for this company yet. Safari bookings with an email, or a staff
                    identification from a hotel stay, create a profile.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium">{displayName(row)}</td>
                    <td>{row.email ?? "—"}</td>
                    <td>{row.phone ?? "—"}</td>
                    <td>{row.nationality ?? row.country ?? "—"}</td>
                    <td>{row.bookingCount}</td>
                    <td>{row.hotelStayCount ?? 0}</td>
                    <td>{row.lastActivity ?? "—"}</td>
                    <td>
                      {editingId === row.id ? (
                        <div className="flex min-w-[14rem] flex-col gap-2">
                          <textarea
                            className="textarea textarea-bordered textarea-sm"
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              disabled={saving}
                              onClick={() => void saveNotes(row)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => {
                            setEditingId(row.id);
                            setNotes(row.notes ?? "");
                          }}
                        >
                          {row.notes?.trim() ? row.notes : "Add notes"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <DashboardPagination page={page} pageCount={pageCount} setPage={setPage} />
    </div>
  );
}
