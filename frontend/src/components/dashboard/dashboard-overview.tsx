"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import {
  CalendarRange,
  CircleDollarSign,
  ClipboardList,
  FileWarning,
  Wine,
  UtensilsCrossed,
} from "lucide-react";
import { useCompany } from "@/store/company-context";
import type {
  TrendPoint,
  CountryAmount,
  SafariSlice,
  ProductSale,
  MonthlyProductSales,
  DepartmentRevenuePoint,
  RevenueStackPoint,
} from "@/components/dashboard/dashboard-charts";
import { EntityViewModal } from "@/components/dashboard/entity-view-modal";
import { useCurrency } from "@/lib/currency-context";
import { formatKesForDisplay } from "@/lib/data";
import { nairobiYmd } from "@/lib/nairobi-date";
import { companyUsesHotelStays, companyUsesRestaurant, companyUsesSafariTours } from "@/types/company";

type CardPeriod = "today" | "week" | "month" | "last3" | "year" | "all";

const CARD_PERIODS: { id: CardPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "last3", label: "Last 3 months" },
  { id: "year", label: "This year" },
  { id: "all", label: "All" },
];

function periodBounds(period: CardPeriod, today: string): { start: string; end: string } | null {
  if (period === "all") return null;
  if (period === "today") return { start: today, end: today };
  const [year, month, day] = today.split("-").map(Number);
  if (period === "week") {
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const mondayOffset = weekday === 0 ? 6 : weekday - 1;
    const startDate = new Date(Date.UTC(year, month - 1, day - mondayOffset));
    const endDate = new Date(startDate.getTime() + 6 * 86_400_000);
    return { start: startDate.toISOString().slice(0, 10), end: endDate.toISOString().slice(0, 10) };
  }
  if (period === "month" || period === "last3") {
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const end = `${today.slice(0, 7)}-${String(last).padStart(2, "0")}`;
    if (period === "month") return { start: `${today.slice(0, 7)}-01`, end };
    const startIndex = year * 12 + (month - 1) - 2;
    const startYear = Math.floor(startIndex / 12);
    const startMonth = (startIndex % 12) + 1;
    return {
      start: `${startYear}-${String(startMonth).padStart(2, "0")}-01`,
      end,
    };
  }
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function ymdInPeriod(value: string | null | undefined, period: CardPeriod, today: string): boolean {
  const bounds = periodBounds(period, today);
  if (!bounds) return true;
  const day = String(value ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= bounds.start && day <= bounds.end;
}

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
  kpis: {
    totalBookings: number;
    monthlyRevenue: number;
    upcomingTrips: number;
    unpaidInvoices: number;
  };
  revenueTrend: TrendPoint[];
  revenueStack: RevenueStackPoint[];
  revenueByCountry: CountryAmount[];
  safariDistribution: SafariSlice[];
  hospitalityKpis: {
    hotelStays: number;
    hotelRevenueMonth: number;
    upcomingArrivals: number;
    barSales: number;
    weeklyBarRecords: number;
    restaurantSales: number;
  };
  hotelStayTrend: TrendPoint[];
  barWeeklySales: { label: string; amount: number }[];
  barProductSales: ProductSale[];
  barProductSalesByMonth: MonthlyProductSales[];
  restaurantSalesTrend: TrendPoint[];
  restaurantProductSales: ProductSale[];
  departmentRevenue: DepartmentRevenuePoint[];
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
  const { selectedCompanyId, selectedCompany, hasOverviewAccess, permissionsLoading } = useCompany();
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stayPeriod, setStayPeriod] = useState<CardPeriod>("month");
  const [bookingPeriod, setBookingPeriod] = useState<CardPeriod>("month");
  const [paymentPeriod, setPaymentPeriod] = useState<CardPeriod>("month");
  const [bookingViewId, setBookingViewId] = useState<number | null>(null);

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
          hospitalityKpis: json.hospitalityKpis ?? {
            hotelStays: 0,
            hotelRevenueMonth: 0,
            upcomingArrivals: 0,
            barSales: 0,
            weeklyBarRecords: 0,
            restaurantSales: 0,
          },
          revenueTrend: json.revenueTrend ?? [],
          revenueStack: json.revenueStack ?? [],
          revenueByCountry: json.revenueByCountry ?? [],
          safariDistribution: json.safariDistribution ?? [],
          hotelStayTrend: json.hotelStayTrend ?? [],
          barWeeklySales: json.barWeeklySales ?? [],
          barProductSales: json.barProductSales ?? [],
          barProductSalesByMonth: json.barProductSalesByMonth ?? [],
          restaurantSalesTrend: json.restaurantSalesTrend ?? [],
          restaurantProductSales: json.restaurantProductSales ?? [],
          departmentRevenue: json.departmentRevenue ?? [],
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
          KPIs and charts
        </p>
      </div>

      {companyUsesHotelStays(selectedCompanyId) ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-base-content/60">Hotel stays</p>
              <ClipboardList className="h-4 w-4 text-primary opacity-80" aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-base-content">
              {data.hospitalityKpis.hotelStays}
            </p>
          </div>
          <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-base-content/60">Hotel revenue this month</p>
              <CircleDollarSign className="h-4 w-4 text-primary opacity-80" aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-base-content">
              {formatKesForDisplay(data.hospitalityKpis.hotelRevenueMonth)}
            </p>
          </div>
          <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-base-content/60">Bar sales</p>
              <Wine className="h-4 w-4 text-primary opacity-80" aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-base-content">
              {formatKesForDisplay(data.hospitalityKpis.barSales)}
            </p>
            <p className="mt-1 text-xs text-base-content/50">
              {selectedCompanyId === "ewc"
                ? `${data.hospitalityKpis.weeklyBarRecords} weekly records`
                : `${data.hospitalityKpis.weeklyBarRecords} daily records`}
            </p>
          </div>
          {companyUsesRestaurant(selectedCompanyId) ? (
            <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-base-content/60">Restaurant sales</p>
                <UtensilsCrossed className="h-4 w-4 text-primary opacity-80" aria-hidden />
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums text-base-content">
                {formatKesForDisplay(data.hospitalityKpis.restaurantSales)}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-base-content/60">Upcoming arrivals</p>
                <CalendarRange className="h-4 w-4 text-primary opacity-80" aria-hidden />
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums text-base-content">
                {data.hospitalityKpis.upcomingArrivals}
              </p>
              <p className="mt-1 text-xs text-base-content/50">Check-in on or after today</p>
            </div>
          )}
        </div>
      ) : (
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
      )}

      {companyUsesHotelStays(selectedCompanyId) ? (
        <HospitalityCharts
          hotelStayTrend={data.hotelStayTrend}
          barWeeklySales={data.barWeeklySales}
          barProductSales={data.barProductSales}
          barProductSalesByMonth={data.barProductSalesByMonth}
          restaurantSalesTrend={data.restaurantSalesTrend}
          restaurantProductSales={data.restaurantProductSales}
          showRestaurant={companyUsesRestaurant(selectedCompanyId)}
          barTrendTitle="Monthly bar sales"
          showBarProductFilter={selectedCompanyId === "ewc"}
          departmentRevenue={selectedCompanyId === "bth" ? data.departmentRevenue : undefined}
        />
      ) : (
        <DashboardCharts
          revenueTrend={data.revenueTrend}
          revenueByCountry={data.revenueByCountry}
          safariDistribution={data.safariDistribution}
        />
      )}

      {companyUsesSafariTours(selectedCompanyId) && companyUsesHotelStays(selectedCompanyId) ? (
        <DashboardCharts
          revenueTrend={data.revenueTrend}
          revenueByCountry={data.revenueByCountry}
          safariDistribution={data.safariDistribution}
          revenueStack={data.revenueStack}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {companyUsesHotelStays(selectedCompanyId) ? (
          <PeriodCard
            title="Recent stays"
            period={stayPeriod}
            onPeriod={setStayPeriod}
            empty={
              data.recentStays.length === 0
                ? "No hotel stays yet."
                : "No stays in this period."
            }
            rows={data.recentStays.filter((stay) => ymdInPeriod(stay.checkInDate, stayPeriod, nairobiYmd()))}
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
            title="Recent bookings"
            period={bookingPeriod}
            onPeriod={setBookingPeriod}
            empty={
              data.recentBookings.length === 0
                ? "No bookings yet."
                : "No bookings in this period."
            }
            rows={data.recentBookings.filter((booking) =>
              ymdInPeriod(booking.startDate, bookingPeriod, nairobiYmd())
            )}
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
          title="Payments received"
          period={paymentPeriod}
          onPeriod={setPaymentPeriod}
          empty={
            data.recentPayments.length === 0
              ? "No payments recorded."
              : "No payments in this period."
          }
          rows={data.recentPayments.filter((payment) =>
            ymdInPeriod(
              payment.recordedAt ? nairobiYmd(new Date(payment.recordedAt)) : null,
              paymentPeriod,
              nairobiYmd()
            )
          )}
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
    </div>
  );
}

function PeriodCard<T>({
  title,
  period,
  onPeriod,
  empty,
  rows,
  render,
}: {
  title: string;
  period: CardPeriod;
  onPeriod: (period: CardPeriod) => void;
  empty: string;
  rows: T[];
  render: (row: T) => ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-base-content">{title}</h2>
        <select
          className="select select-bordered select-xs w-40 shrink-0 rounded-md"
          style={{ outline: "1px solid gray" }}
          aria-label={`${title} period`}
          value={period}
          onChange={(event) => onPeriod(event.target.value as CardPeriod)}
        >
          {CARD_PERIODS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <ul className="mt-4 h-72 divide-y divide-base-content/10 overflow-y-auto">
        {rows.length === 0 ? (
          <li className="py-6 text-center text-sm text-base-content/50">{empty}</li>
        ) : (
          rows.map((row) => render(row))
        )}
      </ul>
    </div>
  );
}
