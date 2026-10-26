"use client";

import { useMemo, type ReactNode } from "react";
import {
  amountSeriesWindow,
  countByNameWindow,
  namedAmountSeriesWindow,
  productSeriesWindow,
  stackedSeriesWindow,
} from "@/lib/chart-period";
import { nairobiYmd } from "@/lib/nairobi-date";
import { overviewWindow, type OverviewPeriod } from "@/lib/overview-period";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatKesForDisplay } from "@/lib/data";

const COLORS = ["#2d5a3d", "#d4a84b", "#5a7d6a", "#8b6914", "#4a7c59", "#6b6560"];

export type ProductSale = { name: string; quantity: number; amount: number };

export type ChartOrderFact = {
  date: string;
  amount: number;
  paid: boolean;
  products: ProductSale[];
};

export type OverviewChartFacts = {
  revenue: { date: string; amount: number }[];
  safariBookings: { date: string; amount: number; country: string; days: number | null; paid: boolean }[];
  hotelStays: { date: string; amount: number; paid: boolean }[];
  barOrders: ChartOrderFact[];
  restaurantOrders: ChartOrderFact[];
};

const EMPTY_PRODUCT: ProductSale = { name: "No products sold", quantity: 0, amount: 0 };

function timeAxis(count: number) {
  if (count > 16) {
    return { interval: 0 as const, angle: -40, textAnchor: "end" as const, height: 52, tick: { fontSize: 10 } };
  }
  if (count > 8) {
    return { interval: 0 as const, angle: -25, textAnchor: "end" as const, height: 44, tick: { fontSize: 10 } };
  }
  return { interval: 0 as const, tick: { fontSize: 11 } };
}

function orderProductLines(orders: ChartOrderFact[]) {
  const lines: { date: string; name: string; quantity: number; amount: number }[] = [];
  for (const order of orders) {
    for (const product of order.products) {
      lines.push({ date: order.date, name: product.name, quantity: product.quantity, amount: product.amount });
    }
  }
  return lines;
}

function SafariLegend({ payload }: { payload?: { value?: unknown; color?: string }[] }) {
  if (!payload || payload.length === 0) return null;
  return (
    <ul className="mx-auto mt-2 flex max-w-full flex-wrap justify-center gap-x-3 gap-y-1 overflow-hidden px-2">
      {payload.map((entry, index) => {
        const label = String(entry.value ?? "");
        return (
          <li key={`${label}-${index}`} className="flex max-w-full items-center gap-1 text-xs text-base-content/80">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color ?? COLORS[index % COLORS.length] }}
            />
            <span className="max-w-36 truncate sm:max-w-48" title={label}>
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function chartCompactFromKes(kes: number) {
  const v = Number.isFinite(kes) ? Math.round(kes) : 0;
  if (Math.abs(v) >= 1000) {
    return `KSh${Math.round(v / 1000)}k`;
  }
  return `KSh${v}`;
}

function moneyTooltip(value: unknown, name: string) {
  return [formatKesForDisplay(typeof value === "number" ? value : Number(value) || 0), name] as [string, string];
}

function ChartCard({
  title,
  children,
  wide,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm ${wide ? "lg:col-span-2" : ""}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-base-content">{title}</h3>
      </div>
      <div className={wide ? "h-80 w-full min-w-0 overflow-hidden" : "h-72 w-full min-w-0 overflow-hidden"}>
        {children}
      </div>
    </div>
  );
}

export function DashboardCharts({
  facts,
  period,
  anchor,
  stacked = false,
}: {
  facts: OverviewChartFacts;
  period: OverviewPeriod;
  anchor?: string;
  stacked?: boolean;
}) {
  const today = nairobiYmd();
  const focus = anchor ?? today;
  const window = useMemo(() => overviewWindow(period, today, focus), [period, today, focus]);

  const revenueLine = useMemo(
    () => amountSeriesWindow(facts.revenue, window, today),
    [facts.revenue, window, today]
  );
  const revenueStack = useMemo(
    () =>
      stackedSeriesWindow(
        [
          ...facts.safariBookings
            .filter((booking) => booking.paid)
            .map((booking) => ({ date: booking.date, safari: booking.amount, hotel: 0, bar: 0 })),
          ...facts.hotelStays
            .filter((stay) => stay.paid)
            .map((stay) => ({ date: stay.date, safari: 0, hotel: stay.amount, bar: 0 })),
          ...facts.barOrders
            .filter((order) => order.paid)
            .map((order) => ({ date: order.date, safari: 0, hotel: 0, bar: order.amount })),
        ],
        ["safari", "hotel", "bar"] as const,
        window,
        today
      ),
    [facts.safariBookings, facts.hotelStays, facts.barOrders, window, today]
  );
  const countries = useMemo(() => {
    const rows = namedAmountSeriesWindow(
      facts.safariBookings.map((booking) => ({
        date: booking.date,
        name: booking.country,
        amount: booking.amount,
      })),
      window
    ).map((row) => ({ country: row.name, amount: row.amount }));
    return rows.length > 0 ? rows : [{ country: "No bookings", amount: 0 }];
  }, [facts.safariBookings, window]);
  const safariSlices = useMemo(() => {
    const rows = countByNameWindow(
      facts.safariBookings
        .filter((booking) => booking.days != null)
        .map((booking) => ({
          date: booking.date,
          name: booking.days === 1 ? "1 Day" : `${booking.days} Days`,
        })),
      window
    );
    return rows.length > 0 ? rows : [{ name: "No bookings", value: 1 }];
  }, [facts.safariBookings, window]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Revenue trend" wide>
        <ResponsiveContainer width="100%" height="100%">
          {stacked ? (
            <BarChart data={revenueStack} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" />
              <XAxis dataKey="label" {...timeAxis(revenueStack.length)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => chartCompactFromKes(Number(v) || 0)} />
              <Tooltip formatter={(value, name) => moneyTooltip(value, String(name))} />
              <Legend />
              <Bar dataKey="safari" name="Safari (paid/partial)" stackId="revenue" fill="#2d5a3d" />
              <Bar dataKey="hotel" name="Hotel stays (paid)" stackId="revenue" fill="#d4a84b" />
              <Bar dataKey="bar" name="Bar orders (paid)" stackId="revenue" fill="#5a7d6a" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={revenueLine} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" />
              <XAxis dataKey="label" {...timeAxis(revenueLine.length)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => chartCompactFromKes(Number(v) || 0)} />
              <Tooltip formatter={(value) => moneyTooltip(value, "Revenue")} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#2d5a3d"
                strokeWidth={2}
                dot={{ fill: "#d4a84b", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Revenue by country">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={countries} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => chartCompactFromKes(Number(v) || 0)} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="country" width={72} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => moneyTooltip(value, "Booked value")} />
            <Bar dataKey="amount" fill="#2d5a3d" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Safari duration distribution">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={safariSlices} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={2}>
              {safariSlices.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" height={64} content={<SafariLegend />} />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export function HospitalityCharts({
  facts,
  period,
  anchor,
  showRestaurant = false,
  showDepartment = false,
}: {
  facts: OverviewChartFacts;
  period: OverviewPeriod;
  anchor?: string;
  showRestaurant?: boolean;
  showDepartment?: boolean;
}) {
  const today = nairobiYmd();
  const focus = anchor ?? today;
  const window = useMemo(() => overviewWindow(period, today, focus), [period, today, focus]);

  const department = useMemo(
    () =>
      stackedSeriesWindow(
        [
          ...facts.hotelStays
            .filter((stay) => stay.paid)
            .map((stay) => ({ date: stay.date, hotel: stay.amount, bar: 0, restaurant: 0 })),
          ...facts.barOrders
            .filter((order) => order.paid)
            .map((order) => ({ date: order.date, hotel: 0, bar: order.amount, restaurant: 0 })),
          ...facts.restaurantOrders
            .filter((order) => order.paid)
            .map((order) => ({ date: order.date, hotel: 0, bar: 0, restaurant: order.amount })),
        ],
        ["hotel", "bar", "restaurant"] as const,
        window,
        today
      ),
    [facts.hotelStays, facts.barOrders, facts.restaurantOrders, window, today]
  );
  const stays = useMemo(
    () => amountSeriesWindow(facts.hotelStays.map((stay) => ({ date: stay.date, amount: stay.amount })), window, today),
    [facts.hotelStays, window, today]
  );
  const barSales = useMemo(
    () => amountSeriesWindow(facts.barOrders.map((order) => ({ date: order.date, amount: order.amount })), window, today),
    [facts.barOrders, window, today]
  );
  const barProducts = useMemo(() => {
    const rows = productSeriesWindow(orderProductLines(facts.barOrders), window);
    return rows.length > 0 ? rows : [EMPTY_PRODUCT];
  }, [facts.barOrders, window]);
  const restaurantSales = useMemo(
    () =>
      amountSeriesWindow(
        facts.restaurantOrders.map((order) => ({ date: order.date, amount: order.amount })),
        window,
        today
      ),
    [facts.restaurantOrders, window, today]
  );
  const restaurantProducts = useMemo(() => {
    const rows = productSeriesWindow(orderProductLines(facts.restaurantOrders), window);
    return rows.length > 0 ? rows : [EMPTY_PRODUCT];
  }, [facts.restaurantOrders, window]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {showDepartment ? (
        <ChartCard title="Revenue trend" wide>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={department} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" />
              <XAxis dataKey="label" {...timeAxis(department.length)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => chartCompactFromKes(Number(v) || 0)} />
              <Tooltip formatter={(value, name) => moneyTooltip(value, String(name))} />
              <Legend />
              <Bar dataKey="hotel" name="Hotel stays (paid)" stackId="department" fill="#2d5a3d" />
              <Bar dataKey="bar" name="Bar (paid)" stackId="department" fill="#d4a84b" />
              <Bar dataKey="restaurant" name="Restaurant (paid)" stackId="department" fill="#5a7d6a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}
      <ChartCard title="Hotel stay revenue" wide>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stays} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" />
            <XAxis dataKey="label" {...timeAxis(stays.length)} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => chartCompactFromKes(Number(v) || 0)} />
            <Tooltip formatter={(value) => moneyTooltip(value, "Stay revenue")} />
            <Line type="monotone" dataKey="amount" stroke="#2d5a3d" strokeWidth={2} dot={{ fill: "#d4a84b", strokeWidth: 0, r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Bar sales" wide>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barSales} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" />
            <XAxis dataKey="label" {...timeAxis(barSales.length)} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => chartCompactFromKes(Number(v) || 0)} />
            <Tooltip formatter={(value) => moneyTooltip(value, "Sales")} />
            <Bar dataKey="amount" fill="#2d5a3d" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Bar products" wide={!showRestaurant}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barProducts} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => String(Math.round(Number(v) || 0))} />
            <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value, _name, item) => {
                const row = item?.payload as ProductSale | undefined;
                return [`${row?.quantity ?? value} sold · ${formatKesForDisplay(row?.amount ?? 0)}`, "Product"];
              }}
            />
            <Bar dataKey="quantity" fill="#d4a84b" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      {showRestaurant ? (
        <>
          <ChartCard title="Restaurant sales">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={restaurantSales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" />
                <XAxis dataKey="label" {...timeAxis(restaurantSales.length)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => chartCompactFromKes(Number(v) || 0)} />
                <Tooltip formatter={(value) => moneyTooltip(value, "Sales")} />
                <Line type="monotone" dataKey="amount" stroke="#5a7d6a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Restaurant products">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restaurantProducts} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => String(Math.round(Number(v) || 0))} />
                <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, _name, item) => {
                    const row = item?.payload as ProductSale | undefined;
                    return [`${row?.quantity ?? value} sold · ${formatKesForDisplay(row?.amount ?? 0)}`, "Product"];
                  }}
                />
                <Bar dataKey="quantity" fill="#8b6914" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      ) : null}
    </div>
  );
}

export function MonthlyReportChart({ points }: { points: { label: string; total: number }[] }) {
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" />
          <XAxis dataKey="label" {...timeAxis(points.length)} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => chartCompactFromKes(Number(v) || 0)} />
          <Tooltip formatter={(value) => moneyTooltip(value, "Recognized")} />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#2d5a3d"
            strokeWidth={2}
            dot={{ fill: "#d4a84b", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
