import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  barItems,
  barOrderItems,
  barOrders,
  bookings,
  hotelBookings,
  payments,
  restaurantItems,
  restaurantOrderItems,
  restaurantOrders,
  revenueEntries,
} from "@/lib/schema";
import { requireTenantContext } from "@/server/tenancy";
import { desc, eq, inArray } from "drizzle-orm";
import { ensureBookingCustomerColumn } from "@/lib/customers";
import {
  companyUsesBar,
  companyUsesHotelStays,
  companyUsesRestaurant,
  companyUsesSafariTours,
  type CompanyId,
} from "@/types/company";
import { formatWeekPeriod, parseWeekPeriod } from "@/lib/weekly-bar";
import { nairobiYmd } from "@/lib/nairobi-date";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthKeyFromYmd(value: string | null | undefined): string | null {
  const ymd = String(value ?? "").slice(0, 10);
  return /^\d{4}-\d{2}/.test(ymd) ? ymd.slice(0, 7) : null;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
}

function lastSixMonthKeys(now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return keys;
}

function parseTripStart(b: {
  startDate: string | null;
  travelDate: string;
}): Date | null {
  const raw = b.startDate || b.travelDate;
  if (!raw) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const d = iso ? new Date(`${raw}T12:00:00`) : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: NextRequest) {
  try {
    const tenant = await requireTenantContext(
      request.nextUrl.searchParams.get("companyId") ?? new URL(request.url).searchParams.get("companyId"),
      { overview: true }
    );
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId as CompanyId;

    await ensureBookingCustomerColumn();

    const showSafari = companyUsesSafariTours(companyId);
    const showHotel = companyUsesHotelStays(companyId);
    const showBar = companyUsesBar(companyId);
    const showRestaurant = companyUsesRestaurant(companyId);

    const [bookingRows, revenueRows, recentPaymentRows, hotelRows, barOrderRows, restaurantOrderRows] =
      await Promise.all([
        showSafari ? db.select().from(bookings).where(eq(bookings.companyId, companyId)) : Promise.resolve([]),
        db.select().from(revenueEntries).where(eq(revenueEntries.companyId, companyId)),
        db
          .select()
          .from(payments)
          .where(eq(payments.companyId, companyId))
          .orderBy(desc(payments.recordedAt))
          .limit(8),
        showHotel
          ? db.select().from(hotelBookings).where(eq(hotelBookings.companyId, companyId))
          : Promise.resolve([]),
        showBar ? db.select().from(barOrders).where(eq(barOrders.companyId, companyId)) : Promise.resolve([]),
        showRestaurant
          ? db.select().from(restaurantOrders).where(eq(restaurantOrders.companyId, companyId))
          : Promise.resolve([]),
      ]);

    const barIds = barOrderRows.map((o) => o.id);
    const restaurantIds = restaurantOrderRows.map((o) => o.id);
    const [barLines, restaurantLines] = await Promise.all([
      barIds.length
        ? db
            .select({
              orderId: barOrderItems.orderId,
              quantity: barOrderItems.quantity,
              lineTotal: barOrderItems.lineTotal,
              itemName: barItems.name,
            })
            .from(barOrderItems)
            .leftJoin(barItems, eq(barOrderItems.itemId, barItems.id))
            .where(inArray(barOrderItems.orderId, barIds))
        : Promise.resolve([]),
      restaurantIds.length
        ? db
            .select({
              orderId: restaurantOrderItems.orderId,
              quantity: restaurantOrderItems.quantity,
              lineTotal: restaurantOrderItems.lineTotal,
              itemName: restaurantItems.name,
            })
            .from(restaurantOrderItems)
            .leftJoin(restaurantItems, eq(restaurantOrderItems.itemId, restaurantItems.id))
            .where(inArray(restaurantOrderItems.orderId, restaurantIds))
        : Promise.resolve([]),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayYmd = nairobiYmd();
    const currentYm = monthKey(new Date());

    const totalBookings = bookingRows.length;
    const upcomingTrips = bookingRows.filter((b) => {
      if (b.status === "cancelled") return false;
      const d = parseTripStart(b);
      if (!d) return false;
      d.setHours(0, 0, 0, 0);
      return d >= today;
    }).length;

    const unpaidInvoices = bookingRows.filter(
      (b) =>
        b.status !== "cancelled" && (b.paymentStatus === "unpaid" || b.paymentStatus === "partial")
    ).length;

    const monthlyRevenue = revenueRows
      .filter((r) => r.periodMonth === currentYm)
      .reduce((s, r) => s + (r.amount ?? 0), 0);

    const trendMap = new Map<string, number>();
    for (const key of lastSixMonthKeys()) trendMap.set(key, 0);
    for (const r of revenueRows) {
      if (!r.periodMonth || !trendMap.has(r.periodMonth)) continue;
      trendMap.set(r.periodMonth, (trendMap.get(r.periodMonth) ?? 0) + r.amount);
    }
    const revenueTrend = [...trendMap.entries()].map(([month, amount]) => ({
      month,
      label: monthLabel(month),
      amount,
    }));

    const countryTotals = new Map<string, number>();
    for (const b of bookingRows) {
      if (b.status === "cancelled") continue;
      const c = b.tripCountry ?? "Unknown";
      countryTotals.set(c, (countryTotals.get(c) ?? 0) + (b.totalPrice ?? 0));
    }
    const revenueByCountry = [...countryTotals.entries()].map(([country, amount]) => ({
      country,
      amount,
    }));

    const durationMap = new Map<number, number>();
    for (const b of bookingRows) {
      if (b.status === "cancelled") continue;
      const start = b.startDate || b.travelDate;
      const end = b.endDate;
      if (!start || !end) continue;
      const startMs = new Date(start).getTime();
      const endMs = new Date(end).getTime();
      if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) continue;
      const days = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
      durationMap.set(days, (durationMap.get(days) ?? 0) + 1);
    }
    const safariDistribution = [...durationMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([days, count]) => ({
        name: days === 1 ? "1 Day" : `${days} Days`,
        value: count,
      }));

    const recentBookings = [...bookingRows]
      .sort((a, b) => {
        const ta = a.createdAt?.getTime() ?? 0;
        const tb = b.createdAt?.getTime() ?? 0;
        return tb - ta;
      })
      .slice(0, 8)
      .map((b) => ({
        id: b.id,
        customerName: [b.firstName, b.lastName].filter(Boolean).join(" ").trim() || b.email,
        package: b.safariPackage ?? "—",
        startDate: b.startDate || b.travelDate,
        status: b.status ?? "pending",
        paymentStatus: b.paymentStatus,
      }));

    const hotelStayMap = new Map<string, number>();
    for (const key of lastSixMonthKeys()) hotelStayMap.set(key, 0);
    let hotelStays = 0;
    let hotelRevenueMonth = 0;
    let upcomingArrivals = 0;
    for (const stay of hotelRows) {
      if (stay.status === "cancelled") continue;
      hotelStays += 1;
      const checkIn = String(stay.checkInDate).slice(0, 10);
      const ym = monthKeyFromYmd(checkIn);
      if (ym && hotelStayMap.has(ym)) {
        hotelStayMap.set(ym, (hotelStayMap.get(ym) ?? 0) + (stay.totalAmount ?? 0));
      }
      if (ym === currentYm) hotelRevenueMonth += stay.totalAmount ?? 0;
      if (checkIn >= todayYmd && stay.status !== "checked_out") upcomingArrivals += 1;
    }
    const hotelStayTrend = [...hotelStayMap.entries()].map(([month, amount]) => ({
      month,
      label: monthLabel(month),
      amount,
    }));

    const recentStays = [...hotelRows]
      .sort((a, b) => String(b.checkInDate).localeCompare(String(a.checkInDate)))
      .slice(0, 8)
      .map((s) => ({
        id: s.id,
        guest: s.primaryGuestName || "Guest",
        checkInDate: s.checkInDate,
        status: s.status,
        paymentStatus: s.paymentStatus,
        totalAmount: s.totalAmount,
      }));

    const barByOrder = new Map<number, { quantity: number; sales: number; name: string }[]>();
    for (const line of barLines) {
      const current = barByOrder.get(line.orderId) ?? [];
      current.push({
        name: line.itemName ?? "Product",
        quantity: line.quantity,
        sales: line.lineTotal,
      });
      barByOrder.set(line.orderId, current);
    }

    const weeklyPoints = barOrderRows
      .map((order) => {
        const lines = barByOrder.get(order.id) ?? [];
        const period = parseWeekPeriod(order.tableLabel);
        const sales = lines.reduce((sum, line) => sum + line.sales, 0);
        return { period, sales, createdAt: order.createdAt };
      })
      .filter((row) => row.sales > 0);
    const useWeeklyBarPoints = weeklyPoints.some((row) => row.period);
    const barWeekly = useWeeklyBarPoints
      ? weeklyPoints
          .filter((row) => row.period)
          .map((row) => ({
            start: row.period!.start,
            label: formatWeekPeriod(row.period!),
            amount: row.sales,
          }))
          .sort((a, b) => a.start.localeCompare(b.start))
      : lastSixMonthKeys().map((month) => ({
          start: month,
          label: monthLabel(month),
          amount: weeklyPoints
            .filter((row) => monthKeyFromYmd(row.createdAt?.toISOString()) === month)
            .reduce((sum, row) => sum + row.sales, 0),
        }));

    const barProductMap = new Map<string, { name: string; quantity: number; amount: number }>();
    for (const line of barLines) {
      if ((line.quantity ?? 0) <= 0 && (line.lineTotal ?? 0) <= 0) continue;
      const name = line.itemName ?? "Product";
      const current = barProductMap.get(name) ?? { name, quantity: 0, amount: 0 };
      current.quantity += line.quantity ?? 0;
      current.amount += line.lineTotal ?? 0;
      barProductMap.set(name, current);
    }
    const barProductSales = [...barProductMap.values()].sort((a, b) => b.quantity - a.quantity);
    const barSales = barLines.reduce((sum, line) => sum + (line.lineTotal ?? 0), 0);
    const weeklyBarRecords = barOrderRows.length;

    const restaurantMonthMap = new Map<string, number>();
    for (const key of lastSixMonthKeys()) restaurantMonthMap.set(key, 0);
    for (const order of restaurantOrderRows) {
      const ym = monthKeyFromYmd(order.createdAt?.toISOString());
      if (!ym || !restaurantMonthMap.has(ym)) continue;
      const lines = restaurantLines.filter((line) => line.orderId === order.id);
      restaurantMonthMap.set(
        ym,
        (restaurantMonthMap.get(ym) ?? 0) + lines.reduce((sum, line) => sum + (line.lineTotal ?? 0), 0)
      );
    }
    const restaurantSalesTrend = [...restaurantMonthMap.entries()].map(([month, amount]) => ({
      month,
      label: monthLabel(month),
      amount,
    }));
    const restaurantProductMap = new Map<string, { name: string; quantity: number; amount: number }>();
    for (const line of restaurantLines) {
      if ((line.quantity ?? 0) <= 0 && (line.lineTotal ?? 0) <= 0) continue;
      const name = line.itemName ?? "Product";
      const current = restaurantProductMap.get(name) ?? { name, quantity: 0, amount: 0 };
      current.quantity += line.quantity ?? 0;
      current.amount += line.lineTotal ?? 0;
      restaurantProductMap.set(name, current);
    }
    const restaurantProductSales = [...restaurantProductMap.values()].sort((a, b) => b.quantity - a.quantity);
    const restaurantSales = restaurantLines.reduce((sum, line) => sum + (line.lineTotal ?? 0), 0);

    const recentPayments = recentPaymentRows.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      method: p.method,
      status: p.status,
      recordedAt: p.recordedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({
      success: true,
      companyId,
      mode: showHotel || showBar || showRestaurant ? (showSafari ? "mixed" : "hospitality") : "safari",
      kpis: {
        totalBookings,
        monthlyRevenue,
        upcomingTrips,
        unpaidInvoices,
      },
      hospitalityKpis: {
        hotelStays,
        hotelRevenueMonth,
        upcomingArrivals,
        barSales,
        weeklyBarRecords,
        restaurantSales,
      },
      revenueTrend,
      revenueByCountry,
      safariDistribution,
      hotelStayTrend,
      barWeeklySales: barWeekly.map(({ label, amount }) => ({ label, amount })),
      barProductSales,
      restaurantSalesTrend,
      restaurantProductSales,
      recentBookings,
      recentStays,
      recentPayments,
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}
