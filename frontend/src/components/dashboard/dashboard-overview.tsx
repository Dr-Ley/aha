"use client";

import dynamic from "next/dynamic";
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
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
import type { OverviewChartFacts } from "@/components/dashboard/dashboard-charts";
import { EntityViewModal } from "@/components/dashboard/entity-view-modal";
import { useCurrency } from "@/lib/currency-context";
import { formatKesForDisplay } from "@/lib/data";
import { nairobiYmd } from "@/lib/nairobi-date";
import {
  countInPeriod,
  countUnpaidOrPartialBookings,
  guestCount,
  openBalance,
  recognizedRevenue,
  sumAmountsInPeriod,
  upcomingArrivals,
  type HotelStayFact,
  type OrderFact,
  type RevenueEntryFact,
  type RevenuePaymentFact,
} from "@/lib/overview-metrics";
import {
  DEFAULT_OVERVIEW_PERIOD,
  OVERVIEW_PERIODS,
  inOverviewPeriod,
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

type OverviewLedger = {
  bookings: { date: string; status: string; paymentStatus: string }[];
  payments: RevenuePaymentFact[];
  revenue: RevenueEntryFact[];
  enquiries: { date: string }[];
  outstandingBalance: number;
  hotelStays: HotelStayFact[];
  barOrders: OrderFact[];
  restaurantOrders: OrderFact[];
};

const EMPTY_LEDGER: OverviewLedger = {
  bookings: [],
  payments: [],
  revenue: [],
  enquiries: [],
  outstandingBalance: 0,
  hotelStays: [],
  barOrders: [],
  restaurantOrders: [],
};

type OverviewPayload = {
  counts?: { payments: number; bookings: number; stays: number };
  chartFacts: OverviewChartFacts;
  ledger: OverviewLedger;
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

function emptyChartFacts(): OverviewChartFacts {
  return { revenue: [], safariBookings: [], hotelStays: [], barOrders: [], restaurantOrders: [] };
}

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
    const qs = new URLSearchParams({ companyId: selectedCompanyId, period: "all" });

    async function load() {
      setLoading(true);
      setData(null);
      setError(null);
      try {
        const res = await fetch(`/api/dashboard/overview?${qs}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        if (cancelled) return;
        setData({
          counts: json.counts,
          chartFacts: {
            revenue: json.chartFacts?.revenue ?? [],
            safariBookings: json.chartFacts?.safariBookings ?? [],
            hotelStays: json.chartFacts?.hotelStays ?? [],
            barOrders: json.chartFacts?.barOrders ?? [],
            restaurantOrders: json.chartFacts?.restaurantOrders ?? [],
          },
          ledger: {
            bookings: json.ledger?.bookings ?? [],
            payments: json.ledger?.payments ?? [],
            revenue: json.ledger?.revenue ?? [],
            enquiries: json.ledger?.enquiries ?? [],
            outstandingBalance: Number(json.ledger?.outstandingBalance) || 0,
            hotelStays: json.ledger?.hotelStays ?? [],
            barOrders: json.ledger?.barOrders ?? [],
            restaurantOrders: json.ledger?.restaurantOrders ?? [],
          },
          recentBookings: json.recentBookings ?? [],
          recentStays: json.recentStays ?? [],
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
  }, [selectedCompanyId, permissionsLoading, hasOverviewAccess, periodReady]);

  const ledger = data?.ledger ?? EMPTY_LEDGER;
  const scope = overviewScopeLabel(period, today, anchor);
  const cards = useMemo(() => {
    const hotelRevenue = sumAmountsInPeriod(
      ledger.hotelStays.map((stay) => ({ date: stay.checkIn, amount: stay.amount })),
      period,
      today,
      anchor
    );
    const barSales = sumAmountsInPeriod(ledger.barOrders, period, today, anchor);
    const restaurantSales = sumAmountsInPeriod(ledger.restaurantOrders, period, today, anchor);
    const unpaid = openBalance([...ledger.hotelStays, ...ledger.barOrders, ...ledger.restaurantOrders]);
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
        { key: "guests", label: "Guests", scope, value: String(guestCount(ledger.hotelStays, period, today, anchor)), hint: "People on stays in this range", icon: "guests" as const },
        { key: "arrivals", label: "Upcoming arrivals", scope: upcomingScopeLabel(period, today, anchor), value: String(upcomingArrivals(ledger.hotelStays, period, today, anchor)), hint: "Confirmed or pending check-ins", icon: "calendar" as const },
      ];
    }
    return [
      { key: "bookings", label: "Total bookings", scope, value: String(countInPeriod(ledger.bookings, period, today, anchor)), hint: "All bookings in this range", icon: "clipboard" as const },
      { key: "revenue", label: "Revenue", scope, value: formatKesForDisplay(recognizedRevenue(ledger.payments, ledger.revenue, period, today, anchor)), hint: "Paid and partial payments, plus recognized revenue", icon: "money" as const },
      { key: "outstanding", label: "Unpaid/partially paid bookings", scope, value: String(countUnpaidOrPartialBookings(ledger.bookings, period, today, anchor)), hint: "Payment status unpaid or partial", icon: "warning" as const },
      { key: "enquiries", label: "Total enquiries", scope, value: String(countInPeriod(ledger.enquiries, period, today, anchor)), hint: "Contact form submissions", icon: "mail" as const },
    ];
  }, [ledger, period, today, anchor, scope, selectedCompanyId]);

  const canShiftPeriod = period !== "all";
  const chartPeriod = useDeferredValue(period);
  const chartAnchor = useDeferredValue(anchor);
  const staysInPeriod = (data?.recentStays ?? []).filter((stay) => inOverviewPeriod(stay.checkInDate, period, today, anchor));
  const bookingsInPeriod = (data?.recentBookings ?? []).filter((booking) =>
    inOverviewPeriod(booking.startDate, period, today, anchor)
  );
  const paymentsInPeriod = (data?.recentPayments ?? []).filter((payment) =>
    inOverviewPeriod(payment.recordedAt ? nairobiYmd(new Date(payment.recordedAt)) : null, period, today, anchor)
  );
  const showInitialSkeleton = permissionsLoading || !periodReady;
  const showOverviewSkeleton = hasOverviewAccess && loading;
  const showOverviewError = hasOverviewAccess && !loading && (error || !data);

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
        <p className="mt-2 text-xs text-base-content/60">{overviewRangeCaption(period, today, anchor)}</p>
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

      {companyUsesHotelStays(selectedCompanyId) ? (
        <HospitalityCharts
          facts={data.chartFacts}
          period={chartPeriod}
          anchor={chartAnchor}
          showRestaurant={companyUsesRestaurant(selectedCompanyId)}
          showDepartment={selectedCompanyId === "bth"}
        />
      ) : (
        <DashboardCharts facts={data.chartFacts ?? emptyChartFacts()} period={chartPeriod} anchor={chartAnchor} />
      )}

      {companyUsesSafariTours(selectedCompanyId) && companyUsesHotelStays(selectedCompanyId) ? (
        <DashboardCharts facts={data.chartFacts} period={chartPeriod} anchor={chartAnchor} stacked />
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
