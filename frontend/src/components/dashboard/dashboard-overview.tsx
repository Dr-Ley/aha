"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BedDouble,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileWarning,
  Mail,
  Users,
  Wine,
  UtensilsCrossed,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCompany } from "@/store/company-context";
import { EntityViewModal } from "@/components/dashboard/entity-view-modal";
import { useCurrency } from "@/lib/currency-context";
import { formatKesForDisplay } from "@/lib/data";
import { nairobiYmd } from "@/lib/nairobi-date";
import type { OverviewCharts, OverviewMetrics } from "@/lib/overview-view";
import {
  DEFAULT_OVERVIEW_PERIOD,
  OVERVIEW_PERIODS,
  isOverviewPeriod,
  overviewPeriodStorageKey,
  overviewRangeCaption,
  overviewScopeLabel,
  shiftOverviewAnchor,
  upcomingScopeLabel,
  type OverviewPeriod,
} from "@/lib/overview-period";
import { companyUsesHotelStays, companyUsesRestaurant, companyUsesSafariTours } from "@/types/company";

const chartLoading = (
  <div className="grid gap-6 lg:grid-cols-2">
    <div className="skeleton h-72 rounded-2xl lg:col-span-2" />
    <div className="skeleton h-72 rounded-2xl" />
    <div className="skeleton h-72 rounded-2xl" />
  </div>
);

const DashboardCharts = dynamic(
  () => import("@/components/dashboard/dashboard-charts").then((m) => m.DashboardCharts),
  { ssr: false, loading: () => chartLoading }
);

const HospitalityCharts = dynamic(
  () => import("@/components/dashboard/dashboard-charts").then((m) => m.HospitalityCharts),
  { ssr: false, loading: () => chartLoading }
);

type OverviewPayload = {
  companyId: string;
  period: OverviewPeriod;
  anchor: string;
  counts?: { payments: number; bookings: number; stays: number };
  metrics: OverviewMetrics;
  charts: OverviewCharts;
  recentStays: Array<{
    id: number;
    guest: string;
    roomType?: string;
    nights?: number;
    checkInDate: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
  }>;
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
    sourceLabel?: string;
  }>;
};

export function DashboardOverview() {
  const { formatMoney } = useCurrency();
  const { data: session, status: sessionStatus } = useSession();
  const { selectedCompanyId, selectedCompany, hasOverviewAccess, permissionsLoading } = useCompany();
  const today = nairobiYmd();
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<OverviewPeriod>(DEFAULT_OVERVIEW_PERIOD);
  const [anchor, setAnchor] = useState(today);
  const [periodReady, setPeriodReady] = useState(false);
  const [bookingViewId, setBookingViewId] = useState<number | null>(null);
  const userId = session?.user?.id;

  useEffect(() => {
    if (sessionStatus === "loading") return;
    const stored = window.localStorage.getItem(overviewPeriodStorageKey(userId));
    if (isOverviewPeriod(stored)) setPeriod(stored);
    setPeriodReady(true);
  }, [sessionStatus, userId]);

  function selectPeriod(next: OverviewPeriod) {
    setPeriod(next);
    setAnchor(today);
    window.localStorage.setItem(overviewPeriodStorageKey(userId), next);
  }

  function shiftPeriod(delta: number) {
    if (period === "all") return;
    setAnchor((current) => shiftOverviewAnchor(period, current, delta));
  }

  useEffect(() => {
    if (permissionsLoading || !periodReady) return;
    if (!hasOverviewAccess) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    const requestedCompany = selectedCompanyId;
    const qs = new URLSearchParams({ companyId: requestedCompany, period, anchor });
    setData((current) => (current && current.companyId !== requestedCompany ? null : current));
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const res = await fetch(`/api/dashboard/overview?${qs}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        if (cancelled) return;
        setData({
          companyId: json.companyId,
          period: isOverviewPeriod(json.period) ? json.period : period,
          anchor: typeof json.anchor === "string" ? json.anchor : anchor,
          counts: json.counts,
          metrics: json.metrics,
          charts: json.charts,
          recentBookings: json.recentBookings ?? [],
          recentStays: json.recentStays ?? [],
          recentPayments: json.recentPayments ?? [],
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load overview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId, period, anchor, permissionsLoading, hasOverviewAccess, periodReady]);

  const viewPeriod = data?.period ?? period;
  const viewAnchor = data?.anchor ?? anchor;
  const scope = overviewScopeLabel(viewPeriod, today, viewAnchor);
  const cards = useMemo(() => {
    const metrics = data?.metrics;
    const hotelRevenue = metrics?.hotelRevenue ?? 0;
    const barSales = metrics?.barSales ?? 0;
    const restaurantSales = metrics?.restaurantSales ?? 0;
    const unpaid = metrics?.unpaidBalance ?? 0;
    if (selectedCompanyId === "bth") {
      return [
        { key: "hotel", label: "Hotel revenue", scope, value: formatKesForDisplay(hotelRevenue), hint: "Stay totals by check-in", icon: "bed" as const },
        { key: "restaurant", label: "Restaurant sales", scope, value: formatKesForDisplay(restaurantSales), hint: "Orders in this range", icon: "restaurant" as const },
        { key: "bar", label: "Bar sales", scope, value: formatKesForDisplay(barSales), hint: "Orders in this range", icon: "bar" as const },
        { key: "unpaid", label: "Unpaid and partial", scope: "Open balance", value: formatKesForDisplay(unpaid), hint: "Hotel, restaurant, and bar. Not limited by the date range.", icon: "warning" as const },
      ];
    }
    if (selectedCompanyId === "ewc") {
      return [
        { key: "hotel", label: "Hotel revenue", scope, value: formatKesForDisplay(hotelRevenue), hint: "Stay totals by check-in", icon: "bed" as const },
        { key: "bar", label: "Bar sales", scope, value: formatKesForDisplay(barSales), hint: "Orders in this range", icon: "bar" as const },
        { key: "guests", label: "Guests", scope, value: String(metrics?.guests ?? 0), hint: "People on stays in this range", icon: "guests" as const },
        { key: "arrivals", label: "Upcoming arrivals", scope: upcomingScopeLabel(viewPeriod, today, viewAnchor), value: String(metrics?.upcomingArrivals ?? 0), hint: "Confirmed or pending check-ins", icon: "calendar" as const },
      ];
    }
    return [
      { key: "bookings", label: "Total bookings", scope, value: String(metrics?.bookingCount ?? 0), hint: "All bookings in this range", icon: "clipboard" as const },
      { key: "revenue", label: "Revenue", scope, value: formatKesForDisplay(metrics?.revenue ?? 0), hint: "Paid and partial payments, plus recognized revenue", icon: "money" as const },
      { key: "outstanding", label: "Unpaid/partially paid bookings", scope, value: String(metrics?.unpaidBookings ?? 0), hint: "Payment status unpaid or partial", icon: "warning" as const },
      { key: "enquiries", label: "Total enquiries", scope, value: String(metrics?.enquiryCount ?? 0), hint: "Contact form submissions", icon: "mail" as const },
    ];
  }, [data?.metrics, scope, selectedCompanyId, today, viewAnchor, viewPeriod]);

  const canShiftPeriod = period !== "all";
  const staysInPeriod = data?.recentStays ?? [];
  const bookingsInPeriod = data?.recentBookings ?? [];
  const paymentsInPeriod = data?.recentPayments ?? [];
  const showInitialSkeleton = permissionsLoading || !periodReady;
  const showOverviewSkeleton = hasOverviewAccess && loading && !data;
  const showOverviewError = hasOverviewAccess && !loading && Boolean(error) && !data;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Overview</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-base-content md:text-3xl">
          Operations — {selectedCompany.name}
        </h1>
      </div>

      <div className="sticky top-16 z-10 -mx-4 border-b border-base-content/10 bg-base-100 py-3 pl-12 pr-4 shadow-sm md:-mx-6 md:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-square shrink-0 border-base-content/20 btn-outline"
            aria-label="Previous period"
            disabled={!canShiftPeriod}
            onClick={() => shiftPeriod(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2" role="group" aria-label="Date range">
            {OVERVIEW_PERIODS.map((option) => {
              const active = period === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  className={`btn btn-sm rounded-full ${active ? "btn-primary" : "btn-outline border-base-content/20"}`}
                  onClick={() => selectPeriod(option.id)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-square shrink-0 border-base-content/20 btn-outline"
            aria-label="Next period"
            disabled={!canShiftPeriod}
            onClick={() => shiftPeriod(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-xs text-base-content/60">{overviewRangeCaption(viewPeriod, today, viewAnchor)}</p>
      </div>

      {showInitialSkeleton || showOverviewSkeleton ? (
        <div className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      ) : !hasOverviewAccess ? (
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-6 text-sm text-base-content/80 shadow-sm">
          You do not have permission to view the operations overview for this company.
        </div>
      ) : showOverviewError || !data ? (
        <div className="rounded-2xl border border-error/20 bg-error/5 p-6 text-sm text-error">
          {error ?? "Unable to load dashboard data."}
        </div>
      ) : (
        <>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <KpiCard key={card.key} label={card.label} scope={card.scope} value={card.value} hint={card.hint} icon={card.icon} />
        ))}
      </div>

      {error && data ? <p className="text-sm text-error">{error}</p> : null}
      {companyUsesHotelStays(selectedCompanyId) ? (
        <HospitalityCharts
          period={viewPeriod}
          anchor={viewAnchor}
          series={data.charts}
          showRestaurant={companyUsesRestaurant(selectedCompanyId)}
          showDepartment={selectedCompanyId === "bth"}
        />
      ) : (
        <DashboardCharts period={viewPeriod} anchor={viewAnchor} series={data.charts} />
      )}

      {companyUsesSafariTours(selectedCompanyId) && companyUsesHotelStays(selectedCompanyId) ? (
        <DashboardCharts period={viewPeriod} anchor={viewAnchor} series={data.charts} stacked />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {companyUsesHotelStays(selectedCompanyId) ? (
          <PeriodCard
            key={`stays-${period}-${anchor}`}
            title="Recent stays"
            empty={(data.counts?.stays ?? data.recentStays.length) === 0 ? "No hotel stays yet." : "No stays in this period."}
            rows={staysInPeriod}
            render={(stay) => (
              <li key={stay.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-base-content">{stay.guest}</p>
                  <p className="text-xs text-base-content/60">
                    {[stay.roomType, stay.nights != null ? `${stay.nights} night${stay.nights === 1 ? "" : "s"}` : null, formatKesForDisplay(stay.totalAmount)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-base-content/50">{stay.checkInDate}</p>
                  <p className="text-xs capitalize text-base-content/70">
                    {stay.status} · {stay.paymentStatus}
                  </p>
                </div>
              </li>
            )}
          />
        ) : (
          <PeriodCard
            key={`bookings-${period}-${anchor}`}
            title="Recent bookings"
            empty={(data.counts?.bookings ?? data.recentBookings.length) === 0 ? "No bookings yet." : "No bookings in this period."}
            rows={bookingsInPeriod}
            render={(booking) => (
              <li key={booking.id}>
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center justify-between gap-2 py-3 text-left text-sm hover:bg-primary/5"
                  onClick={() => setBookingViewId(booking.id)}
                >
                  <div>
                    <p className="font-medium text-base-content">{booking.customerName}</p>
                    <p className="text-xs text-base-content/60">{booking.package}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-base-content/50">{booking.startDate}</p>
                    <p className="text-xs capitalize text-base-content/70">
                      {booking.status} · {booking.paymentStatus}
                    </p>
                  </div>
                </button>
              </li>
            )}
          />
        )}
        <PeriodCard
          key={`payments-${period}-${anchor}`}
          title="Payments received"
          empty={(data.counts?.payments ?? data.recentPayments.length) === 0 ? "No payments recorded." : "No payments in this period."}
          rows={paymentsInPeriod}
          render={(payment) => (
            <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <p className="font-medium text-base-content">{formatMoney(payment.amount, payment.currency)}</p>
                <p className="text-xs text-base-content/60">
                  {[payment.method, payment.status].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-base-content/70">{payment.sourceLabel || "—"}</p>
                <p className="text-xs text-base-content/50">
                  {payment.recordedAt
                    ? new Date(payment.recordedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"}
                </p>
              </div>
            </li>
          )}
        />
      </div>
      {!companyUsesHotelStays(selectedCompanyId) ? (
        <EntityViewModal
          open={bookingViewId !== null}
          onClose={() => setBookingViewId(null)}
          companyId={selectedCompanyId}
          kind="booking"
          entityId={bookingViewId}
        />
      ) : null}
        </>
      )}
    </div>
  );
}

function KpiIcon({ name }: { name: "bed" | "restaurant" | "bar" | "warning" | "guests" | "calendar" | "clipboard" | "money" | "mail" }) {
  const className = name === "warning" ? "h-4 w-4 text-accent opacity-90" : "h-4 w-4 text-primary opacity-80";
  if (name === "bed") return <BedDouble className={className} aria-hidden />;
  if (name === "restaurant") return <UtensilsCrossed className={className} aria-hidden />;
  if (name === "bar") return <Wine className={className} aria-hidden />;
  if (name === "warning") return <FileWarning className={className} aria-hidden />;
  if (name === "guests") return <Users className={className} aria-hidden />;
  if (name === "calendar") return <CalendarRange className={className} aria-hidden />;
  if (name === "money") return <CircleDollarSign className={className} aria-hidden />;
  if (name === "mail") return <Mail className={className} aria-hidden />;
  return <ClipboardList className={className} aria-hidden />;
}

function KpiCard({
  label,
  scope,
  value,
  hint,
  icon,
}: {
  label: string;
  scope: string;
  value: string;
  hint: string;
  icon: "bed" | "restaurant" | "bar" | "warning" | "guests" | "calendar" | "clipboard" | "money" | "mail";
}) {
  return (
    <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-base-content/60">{label}</p>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">{scope}</p>
        </div>
        <KpiIcon name={icon} />
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-base-content">{value}</p>
      <p className="mt-1 text-xs text-base-content/50">{hint}</p>
    </div>
  );
}

const CARD_PAGE_SIZE = 5;

function PeriodCard<T>({
  title,
  empty,
  rows,
  render,
}: {
  title: string;
  empty: string;
  rows: T[];
  render: (row: T) => ReactNode;
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / CARD_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = rows.slice((safePage - 1) * CARD_PAGE_SIZE, safePage * CARD_PAGE_SIZE);

  return (
    <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-base-content">{title}</h2>
      <ul className="mt-4 min-h-72 divide-y divide-base-content/10">
        {visible.length === 0 ? (
          <li className="py-6 text-center text-sm text-base-content/50">{empty}</li>
        ) : (
          visible.map((row) => render(row))
        )}
      </ul>
      {pageCount > 1 ? (
        <div className="mt-3 flex items-center justify-end gap-1">
          <button
            type="button"
            className="btn btn-ghost btn-xs px-1"
            aria-label={`Previous ${title} page`}
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-12 text-center text-xs tabular-nums text-base-content/60">
            {safePage} / {pageCount}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-xs px-1"
            aria-label={`Next ${title} page`}
            disabled={safePage >= pageCount}
            onClick={() => setPage(safePage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
