import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, payments, revenueEntries } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { checkOverviewApi, canAccessDashboardFromSession } from "@/lib/permissions-server";
import { resolveCompanyId } from "@/lib/tenant";
import { desc, eq } from "drizzle-orm";

function getUserId(session: { user?: { id?: string | null } } | null): number | null {
  if (!session?.user?.id) return null;
  return typeof session.user.id === "string" ? parseInt(session.user.id, 10) : session.user.id;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
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
    const session = await auth();
    if (!getUserId(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = resolveCompanyId(searchParams.get("companyId"));

    const overviewDenied = await checkOverviewApi(session, companyId);
    if (overviewDenied) return overviewDenied;

    const [bookingRows, revenueRows, recentPaymentRows] = await Promise.all([
      db.select().from(bookings).where(eq(bookings.companyId, companyId)),
      db.select().from(revenueEntries).where(eq(revenueEntries.companyId, companyId)),
      db
        .select()
        .from(payments)
        .where(eq(payments.companyId, companyId))
        .orderBy(desc(payments.recordedAt))
        .limit(8),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    const currentYm = monthKey(new Date());
    const monthlyRevenue = revenueRows
      .filter((r) => r.periodMonth === currentYm)
      .reduce((s, r) => s + (r.amount ?? 0), 0);

    const trendMap = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      trendMap.set(monthKey(d), 0);
    }
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

    const safariMap = new Map<string, number>();
    for (const b of bookingRows) {
      if (b.status === "cancelled") continue;
      const label = b.safariPackage?.trim() || "Unspecified package";
      safariMap.set(label, (safariMap.get(label) ?? 0) + 1);
    }
    const safariDistribution = [...safariMap.entries()].map(([name, value]) => ({ name, value }));

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
      kpis: {
        totalBookings,
        monthlyRevenue,
        upcomingTrips,
        unpaidInvoices,
      },
      revenueTrend,
      revenueByCountry,
      safariDistribution,
      recentBookings,
      recentPayments,
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}
