import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  barItems,
  barOrderItems,
  barOrders,
  bookings,
  hotelBookingRooms,
  hotelBookings,
  payments,
  restaurantItems,
  restaurantOrderItems,
  restaurantOrders,
  revenueEntries,
  roomTypes,
  rooms,
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
import {
  formatDayFromLabel,
  formatWeekFromLabel,
  parseDayLabel,
  parseWeekPeriod,
} from "@/lib/weekly-bar";
import { nairobiYmd } from "@/lib/nairobi-date";
import { normalizePaymentLink } from "@/lib/payment-link";
import { safariSourceLabel, stayRoomsLabel, staySourceLabel } from "@/lib/stay-labels";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthKeyFromYmd(value: string | null | undefined): string | null {
  const ymd = String(value ?? "").slice(0, 10);
  return /^\d{4}-\d{2}/.test(ymd) ? ymd.slice(0, 7) : null;
}

function monthKeyFromLoose(value: string | Date | null | undefined): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : monthKey(value);
  const direct = monthKeyFromYmd(value);
  if (direct) return direct;
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : monthKey(parsed);
}

function ymdFromLoose(value: string | Date | null | undefined): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : nairobiYmd(value);
  const text = String(value ?? "");
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : nairobiYmd(parsed);
}

function barOrderYmd(order: { tableLabel: string | null; createdAt: Date | null }): string | null {
  const period = parseWeekPeriod(order.tableLabel);
  if (period) return period.start;
  return parseDayLabel(order.tableLabel) ?? ymdFromLoose(order.createdAt);
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
          .orderBy(desc(payments.recordedAt)),
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

    const allocatedByStay = new Map<
      number,
      { code: string | null; name: string | null; roomTypeName: string | null; quantity: number | null }[]
    >();
    const primaryRoomById = new Map<
      number,
      { code: string | null; name: string | null; roomTypeName: string | null }
    >();
    if (showHotel && hotelRows.length > 0) {
      const { ensureHotelBookingRoomsTable } = await import("@/server/database/ensure-hotel-booking-rooms");
      await ensureHotelBookingRoomsTable();
      const stayIds = hotelRows.map((stay) => stay.id);
      const roomIds = [...new Set(hotelRows.map((stay) => stay.roomId))];
      const [allocatedRows, primaryRows] = await Promise.all([
        db
          .select({
            hotelBookingId: hotelBookingRooms.hotelBookingId,
            code: rooms.code,
            name: rooms.name,
            roomTypeName: roomTypes.name,
            quantity: hotelBookingRooms.quantity,
          })
          .from(hotelBookingRooms)
          .innerJoin(rooms, eq(hotelBookingRooms.roomId, rooms.id))
          .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
          .where(inArray(hotelBookingRooms.hotelBookingId, stayIds)),
        roomIds.length
          ? db
              .select({
                id: rooms.id,
                code: rooms.code,
                name: rooms.name,
                roomTypeName: roomTypes.name,
              })
              .from(rooms)
              .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
              .where(inArray(rooms.id, roomIds))
          : Promise.resolve([]),
      ]);
      for (const row of allocatedRows) {
        const list = allocatedByStay.get(row.hotelBookingId) ?? [];
        list.push({
          code: row.code,
          name: row.name,
          roomTypeName: row.roomTypeName,
          quantity: row.quantity,
        });
        allocatedByStay.set(row.hotelBookingId, list);
      }
      for (const row of primaryRows) {
        primaryRoomById.set(row.id, {
          code: row.code,
          name: row.name,
          roomTypeName: row.roomTypeName,
        });
      }
    }

    const recentStays = [...hotelRows]
      .sort((a, b) => String(b.checkInDate).localeCompare(String(a.checkInDate)))
      .map((s) => {
        const allocated = allocatedByStay.get(s.id) ?? [];
        const primary = primaryRoomById.get(s.roomId);
        const roomType =
          allocated.length > 0
            ? stayRoomsLabel({ rooms: allocated })
            : primary
              ? stayRoomsLabel({ room: primary })
              : "—";
        return {
          id: s.id,
          guest: s.primaryGuestName || "Guest",
          roomType: roomType === "Room" ? "—" : roomType,
          nights: s.nights,
          checkInDate: s.checkInDate,
          status: s.status,
          paymentStatus: s.paymentStatus,
          totalAmount: s.totalAmount,
        };
      });

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

    const barOrderMonth = new Map<number, string>();
    const weeklyPoints = barOrderRows
      .map((order) => {
        const lines = barByOrder.get(order.id) ?? [];
        const period = parseWeekPeriod(order.tableLabel);
        const day = parseDayLabel(order.tableLabel);
        const sales = lines.reduce((sum, line) => sum + line.sales, 0);
        const ym = period
          ? monthKeyFromYmd(period.start)
          : day
            ? monthKeyFromYmd(day)
            : monthKeyFromLoose(order.createdAt);
        if (ym) barOrderMonth.set(order.id, ym);
        return { ym, sales, status: String(order.status ?? "").toLowerCase() };
      })
      .filter((row) => row.sales > 0);
    const barMonthMap = new Map<string, number>();
    for (const key of lastSixMonthKeys()) barMonthMap.set(key, 0);
    for (const row of weeklyPoints) {
      if (!row.ym) continue;
      barMonthMap.set(row.ym, (barMonthMap.get(row.ym) ?? 0) + row.sales);
    }
    const barMonthly = [...barMonthMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({ label: monthLabel(month), amount }));

    const barProductMap = new Map<string, { name: string; quantity: number; amount: number }>();
    const barProductMonthMap = new Map<string, Map<string, { name: string; quantity: number; amount: number }>>();
    for (const line of barLines) {
      if ((line.quantity ?? 0) <= 0 && (line.lineTotal ?? 0) <= 0) continue;
      const name = line.itemName ?? "Product";
      const current = barProductMap.get(name) ?? { name, quantity: 0, amount: 0 };
      current.quantity += line.quantity ?? 0;
      current.amount += line.lineTotal ?? 0;
      barProductMap.set(name, current);
      const ym = barOrderMonth.get(line.orderId);
      if (!ym) continue;
      const monthProducts = barProductMonthMap.get(ym) ?? new Map();
      const monthCurrent = monthProducts.get(name) ?? { name, quantity: 0, amount: 0 };
      monthCurrent.quantity += line.quantity ?? 0;
      monthCurrent.amount += line.lineTotal ?? 0;
      monthProducts.set(name, monthCurrent);
      barProductMonthMap.set(ym, monthProducts);
    }
    const barProductSales = [...barProductMap.values()].sort((a, b) => b.quantity - a.quantity);
    const barProductSalesByMonth = [...barProductMonthMap.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, products]) => ({
        month,
        label: monthLabel(month),
        products: [...products.values()].sort((a, b) => b.quantity - a.quantity),
      }));
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
    const restaurantTotalByOrder = new Map<number, number>();
    for (const line of restaurantLines) {
      restaurantTotalByOrder.set(line.orderId, (restaurantTotalByOrder.get(line.orderId) ?? 0) + (line.lineTotal ?? 0));
    }
    const departmentRevenueMap = new Map<string, { hotel: number; bar: number; restaurant: number }>();
    if (showHotel && showRestaurant) {
      for (const key of lastSixMonthKeys()) departmentRevenueMap.set(key, { hotel: 0, bar: 0, restaurant: 0 });
      for (const stay of hotelRows) {
        if (stay.status === "cancelled") continue;
        if (String(stay.paymentStatus ?? "").toLowerCase() !== "paid") continue;
        const ym = monthKeyFromYmd(stay.checkInDate);
        if (!ym || !departmentRevenueMap.has(ym)) continue;
        departmentRevenueMap.get(ym)!.hotel += stay.totalAmount ?? 0;
      }
      for (const row of weeklyPoints) {
        if (row.status !== "paid" || !row.ym || !departmentRevenueMap.has(row.ym)) continue;
        departmentRevenueMap.get(row.ym)!.bar += row.sales;
      }
      for (const order of restaurantOrderRows) {
        if (String(order.status ?? "").toLowerCase() !== "paid") continue;
        const ym = monthKeyFromLoose(order.createdAt);
        if (!ym || !departmentRevenueMap.has(ym)) continue;
        departmentRevenueMap.get(ym)!.restaurant += restaurantTotalByOrder.get(order.id) ?? 0;
      }
    }
    const departmentRevenue = [...departmentRevenueMap.entries()].map(([month, amounts]) => ({
      month,
      label: monthLabel(month),
      hotel: amounts.hotel,
      bar: amounts.bar,
      restaurant: amounts.restaurant,
    }));

    const bookingById = new Map(bookingRows.map((booking) => [booking.id, booking]));
    const hotelById = new Map(hotelRows.map((stay) => [stay.id, stay]));
    const barOrderById = new Map(barOrderRows.map((order) => [order.id, order]));
    const restaurantOrderById = new Map(restaurantOrderRows.map((order) => [order.id, order]));
    const revenueStackMap = new Map<string, { safari: number; hotel: number; bar: number }>();
    if (showSafari && showHotel) {
      for (const key of lastSixMonthKeys()) revenueStackMap.set(key, { safari: 0, hotel: 0, bar: 0 });
      for (const booking of bookingRows) {
        if (booking.status === "cancelled") continue;
        const pay = String(booking.paymentStatus ?? "").toLowerCase();
        if (pay !== "paid" && pay !== "partial") continue;
        const ym = monthKeyFromLoose(booking.startDate || booking.travelDate);
        if (!ym || !revenueStackMap.has(ym)) continue;
        const bucket = revenueStackMap.get(ym)!;
        bucket.safari += booking.totalPrice ?? 0;
      }
      for (const stay of hotelRows) {
        if (stay.status === "cancelled") continue;
        if (String(stay.paymentStatus ?? "").toLowerCase() !== "paid") continue;
        const ym = monthKeyFromYmd(stay.checkInDate);
        if (!ym || !revenueStackMap.has(ym)) continue;
        const bucket = revenueStackMap.get(ym)!;
        bucket.hotel += stay.totalAmount ?? 0;
      }
      for (const row of weeklyPoints) {
        if (row.status !== "paid" || !row.ym || !revenueStackMap.has(row.ym)) continue;
        const bucket = revenueStackMap.get(row.ym)!;
        bucket.bar += row.sales;
      }
    }
    const revenueStack = [...revenueStackMap.entries()].map(([month, amounts]) => ({
      month,
      label: monthLabel(month),
      safari: amounts.safari,
      hotel: amounts.hotel,
      bar: amounts.bar,
    }));

    const recentPayments = recentPaymentRows.map((p) => {
      const link = normalizePaymentLink(p);
      let sourceLabel = "—";
      if (link.referenceType === "hotel" && link.referenceId != null) {
        const stay = hotelById.get(link.referenceId);
        if (!stay) sourceLabel = "Hotel stay";
        else {
          const allocated = allocatedByStay.get(stay.id) ?? [];
          const primary = primaryRoomById.get(stay.roomId);
          sourceLabel = staySourceLabel({
            primaryGuestName: stay.primaryGuestName,
            rooms: allocated.length > 0 ? allocated : undefined,
            room: primary,
          });
        }
      } else if (link.referenceType === "tour" && link.referenceId != null) {
        const booking = bookingById.get(link.referenceId);
        sourceLabel = booking ? safariSourceLabel(booking) : "Safari booking";
      } else if (link.referenceType === "bar" && link.referenceId != null) {
        const order = barOrderById.get(link.referenceId);
        if (!order) sourceLabel = "Bar order";
        else if (companyId === "bth") sourceLabel = formatDayFromLabel(order.tableLabel);
        else if (companyId === "ewc") sourceLabel = formatWeekFromLabel(order.tableLabel);
        else sourceLabel = order.tableLabel || order.customerName || "Bar order";
      } else if (link.referenceType === "restaurant" && link.referenceId != null) {
        const order = restaurantOrderById.get(link.referenceId);
        sourceLabel = order?.tableLabel || order?.customerName || "Restaurant order";
      }
      return {
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        method: p.method,
        status: p.status,
        recordedAt: p.recordedAt?.toISOString() ?? null,
        sourceLabel,
      };
    });

    const chartFacts = {
      revenue: revenueRows
        .map((row) => ({
          date: ymdFromLoose(row.recognizedAt) ?? (row.periodMonth ? `${row.periodMonth}-01` : ""),
          amount: row.amount ?? 0,
        }))
        .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date)),
      safariBookings: bookingRows
        .filter((booking) => booking.status !== "cancelled")
        .map((booking) => {
          const start = booking.startDate || booking.travelDate;
          const end = booking.endDate;
          let days: number | null = null;
          if (start && end) {
            const startMs = new Date(start).getTime();
            const endMs = new Date(end).getTime();
            if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs >= startMs) {
              days = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
            }
          }
          const pay = String(booking.paymentStatus ?? "").toLowerCase();
          return {
            date: ymdFromLoose(start) ?? "",
            amount: booking.totalPrice ?? 0,
            country: booking.tripCountry ?? "Unknown",
            days,
            paid: pay === "paid" || pay === "partial",
          };
        })
        .filter((booking) => /^\d{4}-\d{2}-\d{2}$/.test(booking.date)),
      hotelStays: hotelRows
        .filter((stay) => stay.status !== "cancelled")
        .map((stay) => ({
          date: String(stay.checkInDate).slice(0, 10),
          amount: stay.totalAmount ?? 0,
          paid: String(stay.paymentStatus ?? "").toLowerCase() === "paid",
        }))
        .filter((stay) => /^\d{4}-\d{2}-\d{2}$/.test(stay.date)),
      barOrders: barOrderRows
        .map((order) => {
          const lines = (barByOrder.get(order.id) ?? []).filter((line) => line.quantity > 0 || line.sales > 0);
          return {
            date: barOrderYmd(order) ?? "",
            amount: lines.reduce((sum, line) => sum + line.sales, 0),
            paid: String(order.status ?? "").toLowerCase() === "paid",
            products: lines.map((line) => ({
              name: line.name,
              quantity: line.quantity,
              amount: line.sales,
            })),
          };
        })
        .filter((order) => /^\d{4}-\d{2}-\d{2}$/.test(order.date) && order.amount > 0),
      restaurantOrders: restaurantOrderRows
        .map((order) => {
          const products = restaurantLines
            .filter((line) => line.orderId === order.id && ((line.quantity ?? 0) > 0 || (line.lineTotal ?? 0) > 0))
            .map((line) => ({
              name: line.itemName ?? "Product",
              quantity: line.quantity ?? 0,
              amount: line.lineTotal ?? 0,
            }));
          return {
            date: ymdFromLoose(order.createdAt) ?? "",
            amount: products.reduce((sum, line) => sum + line.amount, 0),
            paid: String(order.status ?? "").toLowerCase() === "paid",
            products,
          };
        })
        .filter((order) => /^\d{4}-\d{2}-\d{2}$/.test(order.date)),
    };

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
      chartFacts,
      revenueTrend,
      revenueStack,
      revenueByCountry,
      safariDistribution,
      hotelStayTrend,
      barWeeklySales: barMonthly,
      barProductSales,
      barProductSalesByMonth,
      restaurantSalesTrend,
      restaurantProductSales,
      departmentRevenue,
      recentBookings,
      recentStays,
      recentPayments,
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}
