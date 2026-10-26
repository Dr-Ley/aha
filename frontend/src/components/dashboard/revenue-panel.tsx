"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";

const MonthlyReportChart = dynamic(
  () => import("@/components/dashboard/dashboard-charts").then((m) => m.MonthlyReportChart),
  { ssr: false, loading: () => <div className="skeleton h-64 rounded-xl" /> }
);
import { ChartPeriodFilter } from "@/components/dashboard/chart-period-filter";
import { useCompany } from "@/store/company-context";
import { amountSeries, type ChartPeriod } from "@/lib/chart-period";
import { formatKesForDisplay } from "@/lib/data";
import { nairobiYmd } from "@/lib/nairobi-date";
import { EntityViewModal, type EntityPreviewKind } from "@/components/dashboard/entity-view-modal";
import {
  DashboardPagination,
  DashboardTableExport,
  type ExportColumn,
} from "@/components/dashboard/dashboard-table-tools";
import { safariSourceLabel, staySourceLabel } from "@/lib/stay-labels";
import { companyUsesHotelStays, companyUsesSafariTours } from "@/types/company";

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

function formatRevenueLinkCell(r: RevenueRow, labels: Record<string, string>): string {
  if (r.referenceType === "hotel" && r.referenceId != null) {
    return labels[`hotel:${r.referenceId}`] ?? "Hotel stay";
  }
  if (r.bookingId != null || (r.referenceType === "tour" && r.referenceId != null)) {
    const bid = r.bookingId ?? r.referenceId;
    return (bid != null && labels[`tour:${bid}`]) || "Safari booking";
  }
  if (r.referenceType === "bar" && r.referenceId != null) return labels[`bar:${r.referenceId}`] ?? "Bar order";
  if (r.referenceType === "restaurant" && r.referenceId != null) {
    return labels[`restaurant:${r.referenceId}`] ?? "Restaurant order";
  }
  if (r.referenceType === "payment" && r.referenceId != null) return "Payment";
  return "—";
}

const exportColumns: ExportColumn<RevenueRow>[] = [
  { key: "periodMonth", header: "Month", value: (r) => r.periodMonth },
  { key: "packageLabel", header: "Package", value: (r) => r.packageLabel },
  { key: "amount", header: "Amount", value: (r) => r.amount },
  { key: "recognizedAt", header: "Recognized", value: (r) => r.recognizedAt },
];

function revenueYmd(row: RevenueRow): string {
  const raw = row.recognizedAt ? String(row.recognizedAt) : "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return nairobiYmd(parsed);
  }
  return row.periodMonth && /^\d{4}-\d{2}$/.test(row.periodMonth) ? `${row.periodMonth}-01` : "";
}

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
  const [series, setSeries] = useState<RevenueRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sourceLabels, setSourceLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthF, setMonthF] = useState("");
  const [bookingRF, setBookingRF] = useState<"" | "linked" | "none">("");
  const [reportPeriod, setReportPeriodState] = useState<ChartPeriod>("month");
  const [reportShift, setReportShift] = useState(0);
  const [sparkPeriod, setSparkPeriodState] = useState<ChartPeriod>("month");
  const [sparkShift, setSparkShift] = useState(0);
  const setReportPeriod = (period: ChartPeriod) => {
    setReportPeriodState(period);
    setReportShift(0);
  };
  const setSparkPeriod = (period: ChartPeriod) => {
    setSparkPeriodState(period);
    setSparkShift(0);
  };
  const [view, setView] = useState<{ kind: EntityPreviewKind; id: number } | null>(null);

  const inputStyle = { outline: "1px solid gray" };
  const listKey = `${selectedCompanyId}|${monthF}|${bookingRF}`;
  const [seenList, setSeenList] = useState(listKey);
  if (seenList !== listKey) {
    setSeenList(listKey);
    setPage(1);
  }
  const pageCount = Math.max(1, Math.ceil(total / 10));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        companyId: selectedCompanyId,
        page: String(page),
        pageSize: "10",
      });
      if (monthF) qs.set("month", monthF);
      if (bookingRF) qs.set("linked", bookingRF);
      const lookup = new URLSearchParams({ companyId: selectedCompanyId, view: "link" });
      const parts: Promise<Response>[] = [fetch(`/api/revenue?${qs}`)];
      if (companyUsesSafariTours(selectedCompanyId)) parts.push(fetch(`/api/bookings?${lookup}`));
      if (companyUsesHotelStays(selectedCompanyId)) parts.push(fetch(`/api/hotel-bookings?${lookup}`));
      const results = await Promise.all(parts);
      const rRes = results[0];
      const rJson = await rRes.json();
      if (!rRes.ok) throw new Error(typeof rJson.error === "string" ? rJson.error : "Failed to load revenue");
      setRows(rJson.revenue ?? []);
      setSeries(
        (rJson.series ?? rJson.revenue ?? []).map((row: RevenueRow) => ({
          ...row,
          id: row.id ?? 0,
          bookingId: row.bookingId ?? null,
          referenceType: row.referenceType ?? null,
          referenceId: row.referenceId ?? null,
        }))
      );
      setTotal(Number(rJson.total ?? rJson.revenue?.length ?? 0));

      const labels: Record<string, string> = {};
      let idx = 1;
      if (companyUsesSafariTours(selectedCompanyId)) {
        const res = results[idx++];
        if (res?.ok) {
          const j = await res.json();
          for (const b of j.bookings ?? []) labels[`tour:${b.id}`] = safariSourceLabel(b);
        }
      }
      if (companyUsesHotelStays(selectedCompanyId)) {
        const res = results[idx++];
        if (res?.ok) {
          const j = await res.json();
          for (const h of j.hotelBookings ?? []) labels[`hotel:${h.id}`] = staySourceLabel(h);
        }
      }
      setSourceLabels(labels);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, page, monthF, bookingRF]);

  useEffect(() => {
    void load();
  }, [load]);

  const topPackages = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of series) {
      const k = r.packageLabel?.trim() || "Unspecified";
      m.set(k, (m.get(k) ?? 0) + r.amount);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, amount]) => ({ name, total: amount }));
  }, [series]);

  const datedRevenue = useMemo(
    () =>
      series
        .map((row) => ({ date: revenueYmd(row), amount: row.amount }))
        .filter((row) => row.date),
    [series]
  );

  const monthlyTrend = useMemo(
    () =>
      amountSeries(datedRevenue, reportPeriod, undefined, reportShift).map((point) => ({
        label: point.label,
        total: point.amount,
      })),
    [datedRevenue, reportPeriod, reportShift]
  );

  const trendSpark = useMemo(() => {
    const points = amountSeries(datedRevenue, sparkPeriod, undefined, sparkShift);
    const max = Math.max(1, ...points.map((point) => point.amount));
    return points.map((point) => ({
      label: point.label,
      total: point.amount,
      pct: Math.round((point.amount / max) * 100),
    }));
  }, [datedRevenue, sparkPeriod, sparkShift]);

  const monthChoices = useMemo(() => {
    const s = new Set<string>();
    series.forEach((r) => {
      if (r.periodMonth) s.add(r.periodMonth);
    });
    return [...s].sort((a, b) => b.localeCompare(a));
  }, [series]);

  async function loadRevenueExport(): Promise<RevenueRow[]> {
    const qs = new URLSearchParams({ companyId: selectedCompanyId });
    if (monthF) qs.set("month", monthF);
    if (bookingRF) qs.set("linked", bookingRF);
    const res = await fetch(`/api/revenue?${qs}`);
    const json = await res.json();
    if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Failed to export revenue");
    return json.revenue ?? [];
  }

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
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-base-content">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue report
            </h2>
            <ChartPeriodFilter
              value={reportPeriod}
              onChange={setReportPeriod}
              shift={reportShift}
              onShift={setReportShift}
              label="Revenue report time range"
            />
          </div>
          {series.length === 0 ? (
            <p className="text-sm text-base-content/50">No revenue rows yet.</p>
          ) : (
            <MonthlyReportChart points={monthlyTrend} />
          )}
        </div>
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-base-content">Relative trend</h2>
            <ChartPeriodFilter
              value={sparkPeriod}
              onChange={setSparkPeriod}
              shift={sparkShift}
              onShift={setSparkShift}
              label="Relative trend time range"
            />
          </div>
          <div className="flex h-40 items-end gap-1 overflow-x-auto">
            {series.length === 0 ? (
              <p className="text-xs text-base-content/50">Add data to see bars.</p>
            ) : (
              trendSpark.map((b) => (
                <div key={b.label} className="flex h-full min-h-24 min-w-8 flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className="w-full max-w-10 rounded-t-md bg-primary/80"
                    style={{ height: `${Math.max(b.total > 0 ? 12 : 0, b.pct)}%` }}
                    title={`${b.label}: ${formatKesForDisplay(b.total)}`}
                  />
                  <span className="max-w-14 truncate text-[0.65rem] text-base-content/50">{b.label}</span>
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
                <td colSpan={4} className="py-12 text-center">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-base-content/50">
                  {total === 0 && !monthF && !bookingRF ? "No revenue entries." : "No rows match filters."}
                </td>
              </tr>
            ) : rows.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer transition-colors hover:bg-primary/5 active:bg-primary/10"
                    onClick={() => {
                      const target = previewForRevenue(r);
                      if (target) setView(target);
                    }}
                  >
                    <td>{r.periodMonth ?? "—"}</td>
                    <td className="max-w-[200px] truncate">{r.packageLabel ?? "—"}</td>
                    <td>{formatRevenueLinkCell(r, sourceLabels)}</td>
                    <td className="text-right tabular-nums font-medium">{formatKesForDisplay(r.amount)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 max-md:flex-col max-md:items-stretch">
        <DashboardPagination page={page} pageCount={pageCount} setPage={setPage} />
        <DashboardTableExport title="Revenue" rows={rows} columns={exportColumns} loadRows={loadRevenueExport} />
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