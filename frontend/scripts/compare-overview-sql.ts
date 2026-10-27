import dotenv from "dotenv";
import { join } from "node:path";
import { loadOverviewAggregate } from "../src/lib/overview-aggregate";
import { nairobiYmd } from "../src/lib/nairobi-date";
import { overviewPeriodBounds } from "../src/lib/overview-period";
import {
  companyUsesBar,
  companyUsesHotelStays,
  companyUsesRestaurant,
  companyUsesSafariTours,
} from "../src/types/company";
import { loadLegacyOverview } from "./overview-legacy-load";

dotenv.config({ path: join(process.cwd(), ".env.local") });

const companies = ["bth", "aha", "ewc"] as const;
const periods = ["today", "week", "month", "year", "all"] as const;
const only = process.argv[2];
const today = nairobiYmd();
let failed = 0;

function listKey(row: object): string {
  const value = row as { checkInDate?: string; startDate?: string; recordedAt?: string | null };
  return value.checkInDate ?? value.startDate ?? value.recordedAt ?? "";
}

/** Field equality after the same date-then-id order. Rows that share a check-in or timestamp used to follow the unordered scan. */
function sameList<T extends { id: number }>(
  left: T[],
  right: T[],
  fields: (keyof T)[]
): string | null {
  if (left.length !== right.length) return `length ${left.length} vs ${right.length}`;
  const order = (rows: T[]) =>
    [...rows].sort((a, b) => listKey(b).localeCompare(listKey(a)) || b.id - a.id);
  const a = order(left);
  const b = order(right);
  for (let i = 0; i < a.length; i += 1) {
    for (const field of fields) {
      const av = a[i][field];
      const bv = b[i][field];
      if (field === "recordedAt") {
        const at = av ? new Date(String(av)).getTime() : null;
        const bt = bv ? new Date(String(bv)).getTime() : null;
        if (at !== bt) return `id ${a[i].id} recordedAt ${String(av)} vs ${String(bv)}`;
        continue;
      }
      if (av !== bv) return `id ${a[i].id} ${String(field)} ${JSON.stringify(av)} vs ${JSON.stringify(bv)}`;
    }
  }
  return null;
}

function seriesDiff(name: string, left: unknown, right: unknown): string | null {
  const a = JSON.stringify(left);
  const b = JSON.stringify(right);
  if (a === b) return null;
  return `${name} ${a.length}b vs ${b.length}b`;
}

for (const companyId of companies) {
  if (only && only !== companyId && !periods.includes(only as (typeof periods)[number])) continue;
  for (const period of periods) {
    if (only && periods.includes(only as (typeof periods)[number]) && only !== period) continue;
    if (only && companies.includes(only as (typeof companies)[number]) && only !== companyId) continue;
    const bounds = overviewPeriodBounds(period, today, today);
    const flags = {
      safari: companyUsesSafariTours(companyId),
      hotel: companyUsesHotelStays(companyId),
      bar: companyUsesBar(companyId),
      restaurant: companyUsesRestaurant(companyId),
    };
    const legacyStarted = performance.now();
    const legacy = await loadLegacyOverview({ companyId, period, today, anchor: today, ...flags });
    const legacyWall = Math.round(performance.now() - legacyStarted);
    const sqlStarted = performance.now();
    const next = await loadOverviewAggregate({
      companyId,
      period,
      today,
      anchor: today,
      periodStart: bounds?.start ?? null,
      periodEnd: bounds?.end ?? null,
      ...flags,
    });
    const sqlWall = Math.round(performance.now() - sqlStarted);
    const problems: string[] = [];
    for (const key of Object.keys(legacy.metrics) as (keyof typeof legacy.metrics)[]) {
      if (legacy.metrics[key] !== next.metrics[key]) problems.push(`${key} ${legacy.metrics[key]} vs ${next.metrics[key]}`);
    }
    for (const key of ["payments", "bookings", "stays"] as const) {
      if (legacy.counts[key] !== next.counts[key]) problems.push(`count.${key} ${legacy.counts[key]} vs ${next.counts[key]}`);
    }
    const chartKeys = Object.keys(legacy.charts) as (keyof typeof legacy.charts)[];
    for (const key of chartKeys) {
      const diff = seriesDiff(key, legacy.charts[key], next.charts[key]);
      if (diff) problems.push(diff);
    }
    const stayDiff = sameList(legacy.recentStays, next.recentStays, [
      "id",
      "guest",
      "roomType",
      "nights",
      "checkInDate",
      "status",
      "paymentStatus",
      "totalAmount",
    ]);
    if (stayDiff) problems.push(`stays ${stayDiff}`);
    const bookingDiff = sameList(legacy.recentBookings, next.recentBookings, [
      "id",
      "customerName",
      "package",
      "startDate",
      "status",
      "paymentStatus",
    ]);
    if (bookingDiff) problems.push(`bookings ${bookingDiff}`);
    const paymentDiff = sameList(legacy.recentPayments, next.recentPayments, [
      "id",
      "amount",
      "currency",
      "method",
      "status",
      "recordedAt",
      "sourceLabel",
    ]);
    if (paymentDiff) problems.push(`payments ${paymentDiff}`);
    const legacyBytes = Buffer.byteLength(
      JSON.stringify({
        counts: legacy.counts,
        metrics: legacy.metrics,
        charts: legacy.charts,
        recentBookings: legacy.recentBookings,
        recentStays: legacy.recentStays,
        recentPayments: legacy.recentPayments,
      })
    );
    const nextBytes = Buffer.byteLength(
      JSON.stringify({
        counts: next.counts,
        metrics: next.metrics,
        charts: next.charts,
        recentBookings: next.recentBookings,
        recentStays: next.recentStays,
        recentPayments: next.recentPayments,
      })
    );
    const mark = problems.length ? "FAIL" : "ok";
    if (problems.length) failed += 1;
    console.log(
      `${mark} ${companyId} ${period} legacy ${legacy.queryCount} queries ${legacy.rowCount} rows ${Math.round(legacy.dbMs)}ms db ${legacyWall}ms wall route ${legacy.routeBytes}b shaped ${legacyBytes}b | sql 1 query ${sqlWall}ms ${nextBytes}b`
    );
    for (const problem of problems.slice(0, 8)) console.log(`  ${problem}`);
  }
}

const anchors = [
  { period: "month" as const, anchor: "2025-06-15" },
  { period: "year" as const, anchor: "2024-12-31" },
  { period: "today" as const, anchor: "2026-01-01" },
  { period: "week" as const, anchor: "2026-02-01" },
];
if (!only) {
  for (const companyId of companies) {
    for (const item of anchors) {
      const bounds = overviewPeriodBounds(item.period, today, item.anchor);
      const flags = {
        safari: companyUsesSafariTours(companyId),
        hotel: companyUsesHotelStays(companyId),
        bar: companyUsesBar(companyId),
        restaurant: companyUsesRestaurant(companyId),
      };
      const legacy = await loadLegacyOverview({ companyId, period: item.period, today, anchor: item.anchor, ...flags });
      const started = performance.now();
      const next = await loadOverviewAggregate({
        companyId,
        period: item.period,
        today,
        anchor: item.anchor,
        periodStart: bounds?.start ?? null,
        periodEnd: bounds?.end ?? null,
        ...flags,
      });
      const problems: string[] = [];
      for (const key of Object.keys(legacy.metrics) as (keyof typeof legacy.metrics)[]) {
        if (legacy.metrics[key] !== next.metrics[key]) problems.push(`${key} ${legacy.metrics[key]} vs ${next.metrics[key]}`);
      }
      for (const key of Object.keys(legacy.charts) as (keyof typeof legacy.charts)[]) {
        if (JSON.stringify(legacy.charts[key]) !== JSON.stringify(next.charts[key])) problems.push(key);
      }
      if (problems.length) failed += 1;
      console.log(
        `${problems.length ? "FAIL" : "ok"} ${companyId} ${item.period}@${item.anchor} ${Math.round(performance.now() - started)}ms ${problems.slice(0, 6).join("; ")}`
      );
    }
  }
}

process.exit(failed ? 1 : 0);
