"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useCompany } from "@/store/company-context";
import { formatKesForDisplay } from "@/lib/data";
import { EntityViewModal, type EntityPreviewKind } from "@/components/dashboard/entity-view-modal";
import {
  DashboardPagination,
  DashboardTableExport,
  type ExportColumn,
  useDashboardPagination,
} from "@/components/dashboard/dashboard-table-tools";

type RevenueRow = {
  id: number;
  amount: number;
  packageLabel: string | null;
  periodMonth: string | null;
  bookingId: number | null;
  referenceType: string | null;
  referenceId: number | null;
  recognizedAt: string | null;
};

function revenueRowLinked(r: RevenueRow): boolean {
  return r.bookingId != null || (r.referenceType != null && r.referenceId != null);
}

function formatRevenueLinkCell(r: RevenueRow): string {
  if (r.referenceType === "payment" && r.referenceId != null) return `Payment #${r.referenceId}`;
  if (r.referenceType === "hotel" && r.referenceId != null) return `Hotel stay #${r.referenceId}`;
  if (r.referenceType === "bar" && r.referenceId != null) return `Bar order #${r.referenceId}`;
  if (r.referenceType === "restaurant" && r.referenceId != null) return `Restaurant order #${r.referenceId}`;
  if (r.bookingId != null) return `Safari booking #${r.bookingId}`;
  return "—";
}

const exportColumns: ExportColumn<RevenueRow>[] = [
  { key: "id", header: "ID", value: (r) => r.id },
  { key: "periodMonth", header: "Month", value: (r) => r.periodMonth },
  { key: "packageLabel", header: "Package", value: (r) => r.packageLabel },
  { key: "link", header: "Linked source", value: formatRevenueLinkCell },
  { key: "amount", header: "Amount", value: (r) => r.amount },
  { key: "recognizedAt", header: "Recognized", value: (r) => r.recognizedAt },
];

function previewForRevenue(r: RevenueRow): { kind: EntityPreviewKind; id: number } | null {
  if (r.referenceType === "payment" && r.referenceId != null) return { kind: "payment", id: r.referenceId };
  if (r.referenceType === "hotel" && r.referenceId != null) return { kind: "hotel", id: r.referenceId };
  if (r.referenceType === "bar" && r.referenceId != null) return { kind: "bar", id: r.referenceId };
  if (r.referenceType === "restaurant" && r.referenceId != null) return { kind: "restaurant", id: r.referenceId };
  if (r.bookingId != null) return { kind: "booking", id: r.bookingId };
  return null;
}

export function RevenuePanel() {
  const { selectedCompanyId } = useCompany();
  const [rows, setRows] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthF, setMonthF] = useState("");
  const [bookingRF, setBookingRF] = useState<"" | "linked" | "none">("");
  const [view, setView] = useState<{ kind: EntityPreviewKind; id: number } | null>(null);

  const inputStyle = { outline: "1px solid gray" };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ companyId: selectedCompanyId });
      const rRes = await fetch(`/api/revenue?${qs}`);
      const rJson = await rRes.json();
      if (!rRes.ok) throw new Error(typeof rJson.error === "string" ? rJson.error : "Failed to load revenue");
      setRows(rJson.revenue ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const byMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const key = r.periodMonth ?? "—";
      m.set(key, (m.get(key) ?? 0) + r.amount);
    }
    return [...m.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, total]) => ({ month, total }));
  }, [rows]);

  const topPackages = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = r.packageLabel?.trim() || "Unspecified";
      m.set(k, (m.get(k) ?? 0) + r.amount);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, total]) => ({ name, total }));
  }, [rows]);

  const trendSpark = useMemo(() => {
    const last = [...byMonth].slice(0, 6).reverse();
    const max = Math.max(1, ...last.map((x) => x.total));
    return last.map((x) => ({ ...x, pct: Math.round((x.total / max) * 100) }));
  }, [byMonth]);

  const monthChoices = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => {
      if (r.periodMonth) s.add(r.periodMonth);
    });
    return [...s].sort((a, b) => b.localeCompare(a));
  }, [rows]);

  const revenueTableRows = useMemo(() => {
    return rows
      .filter((r) => {
        if (monthF && (r.periodMonth ?? "") !== monthF) return false;
        if (bookingRF === "linked" && !revenueRowLinked(r)) return false;
        if (bookingRF === "none" && revenueRowLinked(r)) return false;
        return true;
      })
      .sort((a, b) => String(b.recognizedAt).localeCompare(String(a.recognizedAt)));
  }, [rows, monthF, bookingRF]);
  const { page, pageCount, setPage, pagedRows } = useDashboardPagination(revenueTableRows, 10);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-base-content mb-5">Revenue</h1>
          <p className="text-sm text-base-content/60">
            Monthly recognition, trends, and top packages. Revenue rows are created automatically only when payment
            entries are marked completed.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-base-content">
            <TrendingUp className="h-4 w-4 text-primary" />
            Monthly report
          </h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-xs uppercase text-base-content/60">
                  <th>Month</th>
                  <th className="text-right">Recognized</th>
                </tr>
              </thead>
              <tbody>
                {byMonth.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-sm text-base-content/50">
                      No revenue rows yet.
                    </td>
                  </tr>
                ) : (
                  byMonth.map((row) => (
                    <tr key={row.month}>
                      <td className="font-medium">{row.month}</td>
                      <td className="text-right tabular-nums">{formatKesForDisplay(row.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-base-content">6-month trend (relative)</h2>
          <div className="flex h-40 items-end gap-1">
            {trendSpark.length === 0 ? (
              <p className="text-xs text-base-content/50">Add data to see bars.</p>
            ) : (
              trendSpark.map((b) => (
                <div key={b.month} className="flex h-full min-h-24 flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className="w-full max-w-10 rounded-t-md bg-primary/80"
                    style={{ height: `${Math.max(12, b.pct)}%` }}
                    title={`${b.month}: ${formatKesForDisplay(b.total)}`}
                  />
                  <span className="max-w-12 truncate text-[0.65rem] text-base-content/50">{b.month.slice(5)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-base-content">Top packages (by recognized amount)</h2>
        <ol className="space-y-2">
          {topPackages.length === 0 ? (
            <li className="text-sm text-base-content/50">No package labels yet.</li>
          ) : (
            topPackages.map((p, i) => (
              <li key={p.name} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  <span className="mr-2 font-mono text-xs text-base-content/40">{i + 1}.</span>
                  {p.name}
                </span>
                <span className="tabular-nums font-medium">{formatKesForDisplay(p.total)}</span>
              </li>
            ))
          )}
        </ol>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-base-content/10 bg-base-100 shadow-sm">
        <table className="table table-sm">
          <thead className="sticky top-0 z-10 bg-base-200/95 text-xs uppercase text-base-content/70 backdrop-blur">
            <tr>
              <th className="align-top">ID</th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-32 flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Month
                    <select
                      className="select select-bordered select-xs max-w-32 rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={monthF}
                      onChange={(e) => setMonthF(e.target.value)}
                    >
                      <option value="">All</option>
                      {monthChoices.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              </th>
              <th className="align-top">Package</th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-32 flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Linked
                    <select
                      className="select select-bordered select-xs max-w-30 rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={bookingRF}
                      onChange={(e) => setBookingRF(e.target.value as "" | "linked" | "none")}
                    >
                      <option value="">All</option>
                      <option value="linked">Any link</option>
                      <option value="none">Not linked</option>
                    </select>
                  </span>
                </label>
              </th>
              <th className="align-top text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : revenueTableRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-base-content/50">
                  {rows.length === 0 ? "No revenue entries." : "No rows match filters."}
                </td>
              </tr>
            ) : pagedRows.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer transition-colors hover:bg-primary/5 active:bg-primary/10"
                    onClick={() => {
                      const target = previewForRevenue(r);
                      if (target) setView(target);
                    }}
                  >
                    <td className="font-mono text-xs">{r.id}</td>
                    <td>{r.periodMonth ?? "—"}</td>
                    <td className="max-w-[200px] truncate">{r.packageLabel ?? "—"}</td>
                    <td>{formatRevenueLinkCell(r)}</td>
                    <td className="text-right tabular-nums font-medium">{formatKesForDisplay(r.amount)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DashboardPagination page={page} pageCount={pageCount} setPage={setPage} />
        <DashboardTableExport title="Revenue" rows={revenueTableRows} columns={exportColumns} />
      </div>

      <EntityViewModal
        open={view !== null}
        onClose={() => setView(null)}
        companyId={selectedCompanyId}
        kind={view?.kind ?? null}
        entityId={view?.id ?? null}
      />

    </div>
  );
}