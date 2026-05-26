"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  CalendarRange,
  CircleDollarSign,
  ClipboardList,
  FileWarning,
} from "lucide-react";
import { useCompany } from "@/store/company-context";
import type { TrendPoint, CountryAmount, SafariSlice } from "@/components/dashboard/dashboard-charts";
import { useCurrency } from "@/lib/currency-context";
import { formatKesForDisplay } from "@/lib/data";

const DashboardCharts = dynamic(
  () =>
    import("@/components/dashboard/dashboard-charts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-72 rounded-2xl lg:col-span-2" />
        <div className="skeleton h-72 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    ),
  }
);

type OverviewPayload = {
  kpis: {
    totalBookings: number;
    monthlyRevenue: number;
    upcomingTrips: number;
    unpaidInvoices: number;
  };
  revenueTrend: TrendPoint[];
  revenueByCountry: CountryAmount[];
  safariDistribution: SafariSlice[];
  recentBookings: Array<{
    id: number;
    customerName: string;
    package: string;
    startDate: string;
    status: string;
    paymentStatus: string;
  }>;
  recentPayments: Array<{
    id: number;
    amount: number;
    currency: string;
    method: string | null;
    status: string;
    recordedAt: string | null;
  }>;
};

export function DashboardOverview() {
  const { formatMoney } = useCurrency();
  const { selectedCompanyId, selectedCompany, hasOverviewAccess, permissionsLoading } = useCompany();
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (permissionsLoading) return;
    if (!hasOverviewAccess) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    const qs = new URLSearchParams({ companyId: selectedCompanyId });

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dashboard/overview?${qs}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        if (cancelled) return;
        setData({
          kpis: json.kpis,
          revenueTrend: json.revenueTrend ?? [],
          revenueByCountry: json.revenueByCountry ?? [],
          safariDistribution: json.safariDistribution ?? [],
          recentBookings: json.recentBookings ?? [],
          recentPayments: json.recentPayments ?? [],
        });
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : "Failed to load overview");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId, permissionsLoading, hasOverviewAccess]);

  if (permissionsLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (!hasOverviewAccess) {
    return (
      <div className="rounded-2xl border border-base-content/10 bg-base-100 p-6 text-sm text-base-content/80 shadow-sm">
        You do not have permission to view the operations overview for this company.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/5 p-6 text-sm text-error">
        {error ?? "Unable to load dashboard data."}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Overview</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-base-content md:text-3xl">
          Operations — {selectedCompany.name}
        </h1>
        <p className="mt-1 text-sm text-base-content/60">
          KPIs and charts respect the company selected in the top bar.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-base-content/60">Total bookings</p>
            <ClipboardList className="h-4 w-4 text-primary opacity-80" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-base-content">
            {data.kpis.totalBookings}
          </p>
        </div>
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-base-content/60">Monthly revenue</p>
            <CircleDollarSign className="h-4 w-4 text-primary opacity-80" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-base-content">
            {formatKesForDisplay(data.kpis.monthlyRevenue)}
          </p>
          <p className="mt-1 text-xs text-base-content/50">From revenue entries this month</p>
        </div>
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-base-content/60">Upcoming trips</p>
            <CalendarRange className="h-4 w-4 text-primary opacity-80" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-base-content">
            {data.kpis.upcomingTrips}
          </p>
          <p className="mt-1 text-xs text-base-content/50">Non-cancelled, start on or after today</p>
        </div>
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-base-content/60">Unpaid invoices</p>
            <FileWarning className="h-4 w-4 text-accent opacity-90" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-base-content">
            {data.kpis.unpaidInvoices}
          </p>
          <p className="mt-1 text-xs text-base-content/50">Bookings unpaid or partially paid</p>
        </div>
      </div>

      <DashboardCharts
        revenueTrend={data.revenueTrend}
        revenueByCountry={data.revenueByCountry}
        safariDistribution={data.safariDistribution}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-base-content">Recent bookings</h2>
          <ul className="mt-4 divide-y divide-base-content/10">
            {data.recentBookings.length === 0 ? (
              <li className="py-6 text-center text-sm text-base-content/50">No bookings yet.</li>
            ) : (
              data.recentBookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium text-base-content">{b.customerName}</p>
                    <p className="text-xs text-base-content/60">{b.package}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-base-content/50">{b.startDate}</p>
                    <p className="text-xs capitalize text-base-content/70">
                      {b.status} · {b.paymentStatus}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-base-content">Payments received</h2>
          <ul className="mt-4 divide-y divide-base-content/10">
            {data.recentPayments.length === 0 ? (
              <li className="py-6 text-center text-sm text-base-content/50">No payments recorded.</li>
            ) : (
              data.recentPayments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium text-base-content">
                      {formatMoney(p.amount, p.currency)}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {[p.method, p.status].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="text-xs text-base-content/50">
                    {p.recordedAt
                      ? new Date(p.recordedAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
