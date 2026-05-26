"use client";

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

export type TrendPoint = { month: string; label: string; amount: number };
export type CountryAmount = { country: string; amount: number };
export type SafariSlice = { name: string; value: number };

type DashboardChartsProps = {
  revenueTrend: TrendPoint[];
  revenueByCountry: CountryAmount[];
  safariDistribution: SafariSlice[];
};

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

export function DashboardCharts({
  revenueTrend,
  revenueByCountry,
  safariDistribution,
}: DashboardChartsProps) {
  const pieData =
    safariDistribution.length > 0 ? safariDistribution : [{ name: "No bookings", value: 1 }];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm lg:col-span-2">
        <h3 className="mb-4 text-sm font-semibold text-base-content">Revenue trend</h3>
        <div className="h-80 w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-base-content/60" />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => chartCompactFromKes(typeof v === "number" ? v : Number(v) || 0)}
                className="text-base-content/60"
              />
              <Tooltip
                formatter={(value) => [
                  formatKesForDisplay(typeof value === "number" ? value : Number(value) || 0),
                  "Revenue",
                ]}
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid oklch(var(--bc) / 0.12)",
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#2d5a3d"
                strokeWidth={2}
                dot={{ fill: "#d4a84b", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-base-content">Revenue by country</h3>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByCountry} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-base-content/10" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => chartCompactFromKes(typeof v === "number" ? v : Number(v) || 0)}
                tick={{ fontSize: 11 }}
              />
              <YAxis type="category" dataKey="country" width={72} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [
                  formatKesForDisplay(typeof value === "number" ? value : Number(value) || 0),
                  "Booked value",
                ]}
              />
              <Bar dataKey="amount" fill="#2d5a3d" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-base-content">Safari distribution</h3>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={88}
                paddingAngle={2}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={64}
                content={<SafariLegend />}
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
