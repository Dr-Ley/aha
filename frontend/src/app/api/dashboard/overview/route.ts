import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureInvoiceTables } from "@/lib/ensure-finance-documents";
import { paymentCountsTowardRevenue } from "@/lib/overview-metrics";
import {
  barItems,
  barOrderItems,
  barOrders,
  bookings,
  contactSubmissions,
  hotelBookingRooms,
  hotelBookings,
  invoices,
  payments,
  restaurantItems,
  restaurantOrderItems,
  restaurantOrders,
  revenueEntries,
  roomTypes,
  rooms,
} from "@/lib/schema";
import { requireTenantContext } from "@/server/tenancy";
import { and, count, desc, eq, gte, inArray, lt } from "drizzle-orm";
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
import { nairobiRange, nairobiYmd } from "@/lib/nairobi-date";
import { inOverviewPeriod, isOverviewPeriod, overviewPeriodBounds, type OverviewPeriod } from "@/lib/overview-period";
import { normalizePaymentLink } from "@/lib/payment-link";
import { safariSourceLabel, stayRoomsLabel, staySourceLabel } from "@/lib/stay-labels";

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

export async function GET(request: NextRequest) {
  try {
    const tenant = await requireTenantContext(
      request.nextUrl.searchParams.get("companyId") ?? new URL(request.url).searchParams.get("companyId"),
      { overview: true }
    );
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId as CompanyId;
    const showSafari = companyUsesSafariTours(companyId);
    const showHotel = companyUsesHotelStays(companyId);
    const showBar = companyUsesBar(companyId);
    const showRestaurant = companyUsesRestaurant(companyId);

    const { ensureHotelBookingRoomsTable } = await import("@/server/database/ensure-hotel-booking-rooms");
    await Promise.all([
      ensureBookingCustomerColumn(),
      ensureInvoiceTables(),
      showHotel ? ensureHotelBookingRoomsTable() : Promise.resolve(),
    ]);
    const periodParam = request.nextUrl.searchParams.get("period");
    const period: OverviewPeriod = isOverviewPeriod(periodParam) ? periodParam : "all";
    const today = nairobiYmd();
    const anchorParam = request.nextUrl.searchParams.get("anchor");
    const anchor = anchorParam && /^\d{4}-\d{2}-\d{2}$/.test(anchorParam) ? anchorParam : today;
    const bounds = overviewPeriodBounds(period, today, anchor);
    const revenueWhere = bounds
      ? and(
          eq(revenueEntries.companyId, companyId),
          gte(revenueEntries.recognizedAt, nairobiRange(bounds.start, bounds.end).from),
          lt(revenueEntries.recognizedAt, nairobiRange(bounds.start, bounds.end).to)
        )
      : eq(revenueEntries.companyId, companyId);

    const [bookingRows, revenueRows, recentPaymentRows, hotelRows, barOrderRows, restaurantOrderRows, enquiryRows, invoiceRows, paymentCountRows, bookingCountRows, stayCountRows] =
      await Promise.all([
        showSafari
          ? db
              .select({
                id: bookings.id,
                createdAt: bookings.createdAt,
                firstName: bookings.firstName,
                lastName: bookings.lastName,
                email: bookings.email,
                safariPackage: bookings.safariPackage,
                startDate: bookings.startDate,
                travelDate: bookings.travelDate,
                endDate: bookings.endDate,
                status: bookings.status,
                paymentStatus: bookings.paymentStatus,
                totalPrice: bookings.totalPrice,
                tripCountry: bookings.tripCountry,
              })
              .from(bookings)
              .where(eq(bookings.companyId, companyId))
          : Promise.resolve([]),
        db
          .select({
            recognizedAt: revenueEntries.recognizedAt,
            periodMonth: revenueEntries.periodMonth,
            amount: revenueEntries.amount,
            referenceType: revenueEntries.referenceType,
            referenceId: revenueEntries.referenceId,
          })
          .from(revenueEntries)
          .where(revenueWhere),
        db
          .select({
            id: payments.id,
            amount: payments.amount,
            currency: payments.currency,
            method: payments.method,
            status: payments.status,
            recordedAt: payments.recordedAt,
            bookingId: payments.bookingId,
            referenceType: payments.referenceType,
            referenceId: payments.referenceId,
          })
          .from(payments)
          .where(eq(payments.companyId, companyId))
          .orderBy(desc(payments.recordedAt)),
        showHotel
          ? db
              .select({
                id: hotelBookings.id,
                roomId: hotelBookings.roomId,
                checkInDate: hotelBookings.checkInDate,
                checkOutDate: hotelBookings.checkOutDate,
                nights: hotelBookings.nights,
                primaryGuestName: hotelBookings.primaryGuestName,
                adults: hotelBookings.adults,
                children: hotelBookings.children,
                infants: hotelBookings.infants,
                totalAmount: hotelBookings.totalAmount,
                amountPaid: hotelBookings.amountPaid,
                paymentStatus: hotelBookings.paymentStatus,
                status: hotelBookings.status,
              })
              .from(hotelBookings)
              .where(eq(hotelBookings.companyId, companyId))
          : Promise.resolve([]),
        showBar
          ? db
              .select({
                id: barOrders.id,
                tableLabel: barOrders.tableLabel,
                customerName: barOrders.customerName,
                status: barOrders.status,
                createdAt: barOrders.createdAt,
              })
              .from(barOrders)
              .where(eq(barOrders.companyId, companyId))
          : Promise.resolve([]),
        showRestaurant
          ? db
              .select({
                id: restaurantOrders.id,
                tableLabel: restaurantOrders.tableLabel,
                customerName: restaurantOrders.customerName,
                status: restaurantOrders.status,
                createdAt: restaurantOrders.createdAt,
              })
              .from(restaurantOrders)
              .where(eq(restaurantOrders.companyId, companyId))
          : Promise.resolve([]),
        db
          .select({ createdAt: contactSubmissions.createdAt })
          .from(contactSubmissions)
          .where(eq(contactSubmissions.companyId, companyId)),
        db
          .select({ status: invoices.status, balance: invoices.balance })
          .from(invoices)
          .where(eq(invoices.companyId, companyId)),
        db.select({ c: count() }).from(payments).where(eq(payments.companyId, companyId)),
        db.select({ c: count() }).from(bookings).where(eq(bookings.companyId, companyId)),
        showHotel
          ? db.select({ c: count() }).from(hotelBookings).where(eq(hotelBookings.companyId, companyId))
          : Promise.resolve([{ c: 0 }]),
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
            .where(and(eq(barOrderItems.companyId, companyId), inArray(barOrderItems.orderId, barIds)))
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
            .where(and(eq(restaurantOrderItems.companyId, companyId), inArray(restaurantOrderItems.orderId, restaurantIds)))
        : Promise.resolve([]),
    ]);

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

    const allocatedByStay = new Map<
      number,
      { code: string | null; name: string | null; roomTypeName: string | null; quantity: number | null }[]
    >();
    const primaryRoomById = new Map<
      number,
      { code: string | null; name: string | null; roomTypeName: string | null }
    >();
    if (showHotel && hotelRows.length > 0) {
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
          .innerJoin(hotelBookings, eq(hotelBookingRooms.hotelBookingId, hotelBookings.id))
          .innerJoin(rooms, eq(hotelBookingRooms.roomId, rooms.id))
          .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
          .where(eq(hotelBookings.companyId, companyId)),
        db
          .select({
            id: rooms.id,
            code: rooms.code,
            name: rooms.name,
            roomTypeName: roomTypes.name,
          })
          .from(rooms)
          .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
          .where(eq(rooms.companyId, companyId)),
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
          checkInDate: ymdFromLoose(s.checkInDate) ?? "",
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
    const restaurantByOrder = new Map<number, { name: string; quantity: number; amount: number }[]>();
    for (const line of restaurantLines) {
      if ((line.quantity ?? 0) <= 0 && (line.lineTotal ?? 0) <= 0) continue;
      const current = restaurantByOrder.get(line.orderId) ?? [];
      current.push({
        name: line.itemName ?? "Product",
        quantity: line.quantity ?? 0,
        amount: line.lineTotal ?? 0,
      });
      restaurantByOrder.set(line.orderId, current);
    }

    const bookingById = new Map(bookingRows.map((booking) => [booking.id, booking]));
    const hotelById = new Map(hotelRows.map((stay) => [stay.id, stay]));
    const barOrderById = new Map(barOrderRows.map((order) => [order.id, order]));
    const restaurantOrderById = new Map(restaurantOrderRows.map((order) => [order.id, order]));

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
          date: ymdFromLoose(stay.checkInDate) ?? "",
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
          const products = restaurantByOrder.get(order.id) ?? [];
          return {
            date: ymdFromLoose(order.createdAt) ?? "",
            amount: products.reduce((sum, line) => sum + line.amount, 0),
            paid: String(order.status ?? "").toLowerCase() === "paid",
            products,
          };
        })
        .filter((order) => /^\d{4}-\d{2}-\d{2}$/.test(order.date)),
    };

    const receivedBySource = new Map<string, number>();
    for (const payment of recentPaymentRows) {
      if (!paymentCountsTowardRevenue(payment.status)) continue;
      const link = normalizePaymentLink(payment);
      if (!link.referenceType || link.referenceId == null) continue;
      const key = `${link.referenceType}:${link.referenceId}`;
      receivedBySource.set(key, (receivedBySource.get(key) ?? 0) + (payment.amount ?? 0));
    }
    const orderBalance = (referenceType: string, orderId: number, status: string, gross: number) => {
      if (String(status ?? "").toLowerCase() === "paid") return 0;
      return Math.max(0, gross - (receivedBySource.get(`${referenceType}:${orderId}`) ?? 0));
    };

    const ledger = {
      bookings: bookingRows
        .map((booking) => ({
          date: ymdFromLoose(booking.startDate || booking.travelDate) ?? "",
          status: booking.status ?? "pending",
          paymentStatus: booking.paymentStatus ?? "unpaid",
        }))
        .filter((booking) => /^\d{4}-\d{2}-\d{2}$/.test(booking.date)),
      payments: recentPaymentRows
        .map((payment) => {
          const link = normalizePaymentLink(payment);
          return {
            id: payment.id,
            date: payment.recordedAt ? nairobiYmd(payment.recordedAt) : "",
            amount: payment.amount ?? 0,
            status: payment.status,
            referenceType: link.referenceType,
            referenceId: link.referenceId,
          };
        })
        .filter((payment) => /^\d{4}-\d{2}-\d{2}$/.test(payment.date)),
      revenue: revenueRows
        .map((row) => ({
          date: ymdFromLoose(row.recognizedAt) ?? (row.periodMonth ? `${row.periodMonth}-01` : ""),
          amount: row.amount ?? 0,
          paymentId: row.referenceType === "payment" ? row.referenceId : null,
          referenceType: row.referenceType,
          referenceId: row.referenceId,
        }))
        .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date)),
      enquiries: enquiryRows
        .map((row) => ({ date: row.createdAt ? nairobiYmd(row.createdAt) : "" }))
        .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date)),
      outstandingBalance: invoiceRows.reduce((sum, invoice) => {
        if (invoice.status !== "issued" && invoice.status !== "partial") return sum;
        return sum + Math.max(0, invoice.balance ?? 0);
      }, 0),
      hotelStays: hotelRows
        .filter((stay) => stay.status !== "cancelled")
        .map((stay) => {
          const party = (stay.adults ?? 0) + (stay.children ?? 0) + (stay.infants ?? 0);
          const owed = stay.paymentStatus === "unpaid" || stay.paymentStatus === "partial";
          return {
            checkIn: ymdFromLoose(stay.checkInDate) ?? "",
            checkOut: ymdFromLoose(stay.checkOutDate) ?? "",
            amount: stay.totalAmount ?? 0,
            guests: party > 0 ? party : 1,
            status: stay.status,
            balance: owed ? Math.max(0, (stay.totalAmount ?? 0) - (stay.amountPaid ?? 0)) : 0,
          };
        })
        .filter((stay) => /^\d{4}-\d{2}-\d{2}$/.test(stay.checkIn)),
      barOrders: barOrderRows
        .map((order) => {
          const amount = (barByOrder.get(order.id) ?? []).reduce((sum, line) => sum + line.sales, 0);
          return {
            date: barOrderYmd(order) ?? "",
            amount,
            balance: orderBalance("bar", order.id, String(order.status ?? ""), amount),
          };
        })
        .filter((order) => /^\d{4}-\d{2}-\d{2}$/.test(order.date)),
      restaurantOrders: restaurantOrderRows
        .map((order) => {
          const amount = (restaurantByOrder.get(order.id) ?? []).reduce((sum, line) => sum + line.amount, 0);
          return {
            date: ymdFromLoose(order.createdAt) ?? "",
            amount,
            balance: orderBalance("restaurant", order.id, String(order.status ?? ""), amount),
          };
        })
        .filter((order) => /^\d{4}-\d{2}-\d{2}$/.test(order.date)),
    };

    const keep = (date: string | null | undefined) => period === "all" || inOverviewPeriod(date, period, today, anchor);
    const scopedChartFacts =
      period === "all"
        ? chartFacts
        : {
            revenue: chartFacts.revenue.filter((row) => keep(row.date)),
            safariBookings: chartFacts.safariBookings.filter((row) => keep(row.date)),
            hotelStays: chartFacts.hotelStays.filter((row) => keep(row.date)),
            barOrders: chartFacts.barOrders.filter((row) => keep(row.date)),
            restaurantOrders: chartFacts.restaurantOrders.filter((row) => keep(row.date)),
          };
    const scopedLedger =
      period === "all"
        ? ledger
        : {
            ...ledger,
            bookings: ledger.bookings.filter((row) => keep(row.date)),
            payments: ledger.payments.filter((row) => keep(row.date)),
            revenue: ledger.revenue.filter((row) => keep(row.date)),
            enquiries: ledger.enquiries.filter((row) => keep(row.date)),
          };

    return NextResponse.json({
      success: true,
      companyId,
      period,
      counts: {
        payments: Number(paymentCountRows[0]?.c ?? 0),
        bookings: Number(bookingCountRows[0]?.c ?? 0),
        stays: Number(stayCountRows[0]?.c ?? 0),
      },
      chartFacts: scopedChartFacts,
      ledger: scopedLedger,
      recentBookings: period === "all" ? recentBookings : recentBookings.filter((row) => keep(row.startDate)),
      recentStays: period === "all" ? recentStays : recentStays.filter((row) => keep(row.checkInDate)),
      recentPayments:
        period === "all"
          ? recentPayments
          : recentPayments.filter((row) => keep(row.recordedAt ? nairobiYmd(new Date(row.recordedAt)) : null)),
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}
