import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "../src/lib/db";
import { nairobiYmd } from "../src/lib/nairobi-date";
import {
  countInPeriod,
  countUnpaidOrPartialBookings,
  guestCount,
  openBalance,
  paymentCountsTowardRevenue,
  recognizedRevenue,
  sumAmountsInPeriod,
  upcomingArrivals,
} from "../src/lib/overview-metrics";
import { inOverviewPeriod, type OverviewPeriod } from "../src/lib/overview-period";
import { normalizePaymentLink } from "../src/lib/payment-link";
import { safariSourceLabel, stayRoomsLabel, staySourceLabel } from "../src/lib/stay-labels";
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
} from "../src/lib/schema";
import {
  formatDayFromLabel,
  formatWeekFromLabel,
  parseDayLabel,
  parseWeekPeriod,
} from "../src/lib/weekly-bar";
import {
  amountSeriesWindow,
  countByNameWindow,
  namedAmountSeriesWindow,
  productSeriesWindow,
  stackedSeriesWindow,
} from "../src/lib/chart-period";
import { overviewWindow } from "../src/lib/overview-period";
import type { OverviewCharts } from "../src/lib/overview-view";

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

const EMPTY_PRODUCT = { name: "No products sold", quantity: 0, amount: 0 };

export type LegacyOverview = {
  queryCount: number;
  rowCount: number;
  dbMs: number;
  routeBytes: number;
  counts: { payments: number; bookings: number; stays: number };
  metrics: {
    hotelRevenue: number;
    barSales: number;
    restaurantSales: number;
    unpaidBalance: number;
    guests: number;
    upcomingArrivals: number;
    bookingCount: number;
    revenue: number;
    unpaidBookings: number;
    enquiryCount: number;
  };
  charts: OverviewCharts;
  recentBookings: Array<{ id: number; customerName: string; package: string; startDate: string; status: string; paymentStatus: string }>;
  recentStays: Array<{ id: number; guest: string; roomType: string; nights: number; checkInDate: string; status: string; paymentStatus: string; totalAmount: number }>;
  recentPayments: Array<{ id: number; amount: number; currency: string; method: string | null; status: string; recordedAt: string | null; sourceLabel: string }>;
};

export async function loadLegacyOverview(input: {
  companyId: "aha" | "ewc" | "bth";
  period: OverviewPeriod;
  today: string;
  anchor: string;
  safari: boolean;
  hotel: boolean;
  bar: boolean;
  restaurant: boolean;
}): Promise<LegacyOverview> {
  const { companyId, period, today, anchor } = input;
  let queryCount = 0;
  let rowCount = 0;
  const started = performance.now();
  const track = <T>(rows: T[]): T[] => {
    queryCount += 1;
    rowCount += rows.length;
    return rows;
  };

  const [bookingRows, revenueRows, recentPaymentRows, hotelRows, barOrderRows, restaurantOrderRows, enquiryRows, invoiceRows, paymentCountRows, bookingCountRows, stayCountRows] =
    await Promise.all([
      input.safari
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
            .then(track)
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
        .where(eq(revenueEntries.companyId, companyId))
        .then(track),
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
        .orderBy(desc(payments.recordedAt))
        .then(track),
      input.hotel
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
            .then(track)
        : Promise.resolve([]),
      input.bar
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
            .then(track)
        : Promise.resolve([]),
      input.restaurant
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
            .then(track)
        : Promise.resolve([]),
      db
        .select({ createdAt: contactSubmissions.createdAt })
        .from(contactSubmissions)
        .where(eq(contactSubmissions.companyId, companyId))
        .then(track),
      db
        .select({ status: invoices.status, balance: invoices.balance })
        .from(invoices)
        .where(eq(invoices.companyId, companyId))
        .then(track),
      db.select({ c: count() }).from(payments).where(eq(payments.companyId, companyId)).then(track),
      db.select({ c: count() }).from(bookings).where(eq(bookings.companyId, companyId)).then(track),
      input.hotel
        ? db.select({ c: count() }).from(hotelBookings).where(eq(hotelBookings.companyId, companyId)).then(track)
        : Promise.resolve([{ c: 0 }]),
    ]);

  const barIds = barOrderRows.map((order) => order.id);
  const restaurantIds = restaurantOrderRows.map((order) => order.id);
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
          .then(track)
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
          .then(track)
      : Promise.resolve([]),
  ]);

  const allocatedByStay = new Map<number, { code: string | null; name: string | null; roomTypeName: string | null; quantity: number | null }[]>();
  const primaryRoomById = new Map<number, { code: string | null; name: string | null; roomTypeName: string | null }>();
  if (input.hotel && hotelRows.length > 0) {
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
        .where(eq(hotelBookings.companyId, companyId))
        .then(track),
      db
        .select({
          id: rooms.id,
          code: rooms.code,
          name: rooms.name,
          roomTypeName: roomTypes.name,
        })
        .from(rooms)
        .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
        .where(eq(rooms.companyId, companyId))
        .then(track),
    ]);
    for (const row of allocatedRows) {
      const list = allocatedByStay.get(row.hotelBookingId) ?? [];
      list.push({ code: row.code, name: row.name, roomTypeName: row.roomTypeName, quantity: row.quantity });
      allocatedByStay.set(row.hotelBookingId, list);
    }
    for (const row of primaryRows) {
      primaryRoomById.set(row.id, { code: row.code, name: row.name, roomTypeName: row.roomTypeName });
    }
  }
  const dbMs = performance.now() - started;

  const recentBookings = [...bookingRows]
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    .map((booking) => ({
      id: booking.id,
      customerName: [booking.firstName, booking.lastName].filter(Boolean).join(" ").trim() || booking.email,
      package: booking.safariPackage ?? "—",
      startDate: booking.startDate || booking.travelDate,
      status: booking.status ?? "pending",
      paymentStatus: booking.paymentStatus,
    }));
  const recentStays = [...hotelRows]
    .sort((a, b) => String(b.checkInDate).localeCompare(String(a.checkInDate)))
    .map((stay) => {
      const allocated = allocatedByStay.get(stay.id) ?? [];
      const primary = primaryRoomById.get(stay.roomId);
      const roomType =
        allocated.length > 0 ? stayRoomsLabel({ rooms: allocated }) : primary ? stayRoomsLabel({ room: primary }) : "—";
      return {
        id: stay.id,
        guest: stay.primaryGuestName || "Guest",
        roomType: roomType === "Room" ? "—" : roomType,
        nights: stay.nights,
        checkInDate: ymdFromLoose(stay.checkInDate) ?? "",
        status: stay.status,
        paymentStatus: stay.paymentStatus,
        totalAmount: stay.totalAmount,
      };
    });

  const barByOrder = new Map<number, { quantity: number; sales: number; name: string }[]>();
  for (const line of barLines) {
    const current = barByOrder.get(line.orderId) ?? [];
    current.push({ name: line.itemName ?? "Product", quantity: line.quantity, sales: line.lineTotal });
    barByOrder.set(line.orderId, current);
  }
  const restaurantByOrder = new Map<number, { name: string; quantity: number; amount: number }[]>();
  for (const line of restaurantLines) {
    if ((line.quantity ?? 0) <= 0 && (line.lineTotal ?? 0) <= 0) continue;
    const current = restaurantByOrder.get(line.orderId) ?? [];
    current.push({ name: line.itemName ?? "Product", quantity: line.quantity ?? 0, amount: line.lineTotal ?? 0 });
    restaurantByOrder.set(line.orderId, current);
  }

  const bookingById = new Map(bookingRows.map((booking) => [booking.id, booking]));
  const hotelById = new Map(hotelRows.map((stay) => [stay.id, stay]));
  const barOrderById = new Map(barOrderRows.map((order) => [order.id, order]));
  const restaurantOrderById = new Map(restaurantOrderRows.map((order) => [order.id, order]));
  const recentPayments = recentPaymentRows.map((payment) => {
    const link = normalizePaymentLink(payment);
    let sourceLabel = "—";
    if (link.referenceType === "hotel" && link.referenceId != null) {
      const stay = hotelById.get(link.referenceId);
      if (!stay) sourceLabel = "Hotel stay";
      else {
        const allocated = allocatedByStay.get(stay.id) ?? [];
        sourceLabel = staySourceLabel({
          primaryGuestName: stay.primaryGuestName,
          rooms: allocated.length > 0 ? allocated : undefined,
          room: primaryRoomById.get(stay.roomId),
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
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      recordedAt: payment.recordedAt?.toISOString() ?? null,
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
          products: lines.map((line) => ({ name: line.name, quantity: line.quantity, amount: line.sales })),
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
        return { date: barOrderYmd(order) ?? "", amount, balance: orderBalance("bar", order.id, String(order.status ?? ""), amount) };
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
  const scopedFacts = {
    revenue: chartFacts.revenue.filter((row) => keep(row.date)),
    safariBookings: chartFacts.safariBookings.filter((row) => keep(row.date)),
    hotelStays: chartFacts.hotelStays.filter((row) => keep(row.date)),
    barOrders: chartFacts.barOrders.filter((row) => keep(row.date)),
    restaurantOrders: chartFacts.restaurantOrders.filter((row) => keep(row.date)),
  };
  const window = overviewWindow(period, today, anchor);
  const countries = namedAmountSeriesWindow(
    scopedFacts.safariBookings.map((booking) => ({ date: booking.date, name: booking.country, amount: booking.amount })),
    window
  );
  const durations = countByNameWindow(
    scopedFacts.safariBookings
      .filter((booking) => booking.days != null)
      .map((booking) => ({ date: booking.date, name: booking.days === 1 ? "1 Day" : `${booking.days} Days` })),
    window
  );
  const barProducts = productSeriesWindow(
    scopedFacts.barOrders.flatMap((order) =>
      order.products.map((product) => ({ date: order.date, name: product.name, quantity: product.quantity, amount: product.amount }))
    ),
    window
  );
  const restaurantProducts = productSeriesWindow(
    scopedFacts.restaurantOrders.flatMap((order) =>
      order.products.map((product) => ({ date: order.date, name: product.name, quantity: product.quantity, amount: product.amount }))
    ),
    window
  );
  const charts: OverviewCharts = {
    revenueLine: amountSeriesWindow(scopedFacts.revenue, window, today),
    revenueStack: stackedSeriesWindow(
      [
        ...scopedFacts.safariBookings.filter((row) => row.paid).map((row) => ({ date: row.date, safari: row.amount, hotel: 0, bar: 0 })),
        ...scopedFacts.hotelStays.filter((row) => row.paid).map((row) => ({ date: row.date, safari: 0, hotel: row.amount, bar: 0 })),
        ...scopedFacts.barOrders.filter((row) => row.paid).map((row) => ({ date: row.date, safari: 0, hotel: 0, bar: row.amount })),
      ],
      ["safari", "hotel", "bar"] as const,
      window,
      today
    ),
    countries: countries.length > 0 ? countries.map((row) => ({ country: row.name, amount: row.amount })) : [{ country: "No bookings", amount: 0 }],
    safariSlices: durations.length > 0 ? durations : [{ name: "No bookings", value: 1 }],
    department: stackedSeriesWindow(
      [
        ...scopedFacts.hotelStays.filter((row) => row.paid).map((row) => ({ date: row.date, hotel: row.amount, bar: 0, restaurant: 0 })),
        ...scopedFacts.barOrders.filter((row) => row.paid).map((row) => ({ date: row.date, hotel: 0, bar: row.amount, restaurant: 0 })),
        ...scopedFacts.restaurantOrders.filter((row) => row.paid).map((row) => ({ date: row.date, hotel: 0, bar: 0, restaurant: row.amount })),
      ],
      ["hotel", "bar", "restaurant"] as const,
      window,
      today
    ),
    stays: amountSeriesWindow(
      scopedFacts.hotelStays.map((row) => ({ date: row.date, amount: row.amount })),
      window,
      today
    ),
    barSales: amountSeriesWindow(
      scopedFacts.barOrders.map((row) => ({ date: row.date, amount: row.amount })),
      window,
      today
    ),
    barProducts: barProducts.length > 0 ? barProducts : [EMPTY_PRODUCT],
    restaurantSales: amountSeriesWindow(
      scopedFacts.restaurantOrders.map((row) => ({ date: row.date, amount: row.amount })),
      window,
      today
    ),
    restaurantProducts: restaurantProducts.length > 0 ? restaurantProducts : [EMPTY_PRODUCT],
  };

  const staysInPeriod = period === "all" ? recentStays : recentStays.filter((row) => keep(row.checkInDate));
  const bookingsInPeriod = period === "all" ? recentBookings : recentBookings.filter((row) => keep(row.startDate));
  const paymentsInPeriod =
    period === "all"
      ? recentPayments
      : recentPayments.filter((row) => keep(row.recordedAt ? nairobiYmd(new Date(row.recordedAt)) : null));

  const routeBytes = Buffer.byteLength(
    JSON.stringify({
      counts: {
        payments: Number(paymentCountRows[0]?.c ?? 0),
        bookings: Number(bookingCountRows[0]?.c ?? 0),
        stays: Number(stayCountRows[0]?.c ?? 0),
      },
      chartFacts: scopedFacts,
      ledger: {
        bookings: ledger.bookings.filter((row) => keep(row.date)),
        payments: ledger.payments.filter((row) => keep(row.date)),
        revenue: ledger.revenue.filter((row) => keep(row.date)),
        enquiries: ledger.enquiries.filter((row) => keep(row.date)),
        hotelStays: ledger.hotelStays,
        barOrders: ledger.barOrders,
        restaurantOrders: ledger.restaurantOrders,
      },
      recentBookings: input.hotel ? [] : period === "all" ? recentBookings : bookingsInPeriod,
      recentStays: input.hotel ? (period === "all" ? recentStays : staysInPeriod) : [],
      recentPayments: paymentsInPeriod,
    })
  );

  return {
    queryCount,
    rowCount,
    dbMs,
    routeBytes,
    counts: {
      payments: Number(paymentCountRows[0]?.c ?? 0),
      bookings: Number(bookingCountRows[0]?.c ?? 0),
      stays: Number(stayCountRows[0]?.c ?? 0),
    },
    metrics: {
      hotelRevenue: sumAmountsInPeriod(
        ledger.hotelStays.map((stay) => ({ date: stay.checkIn, amount: stay.amount })),
        period,
        today,
        anchor
      ),
      barSales: sumAmountsInPeriod(ledger.barOrders, period, today, anchor),
      restaurantSales: sumAmountsInPeriod(ledger.restaurantOrders, period, today, anchor),
      unpaidBalance: openBalance([...ledger.hotelStays, ...ledger.barOrders, ...ledger.restaurantOrders]),
      guests: guestCount(ledger.hotelStays, period, today, anchor),
      upcomingArrivals: upcomingArrivals(ledger.hotelStays, period, today, anchor),
      bookingCount: countInPeriod(ledger.bookings, period, today, anchor),
      revenue: recognizedRevenue(ledger.payments, ledger.revenue, period, today, anchor),
      unpaidBookings: countUnpaidOrPartialBookings(ledger.bookings, period, today, anchor),
      enquiryCount: countInPeriod(ledger.enquiries, period, today, anchor),
    },
    charts,
    recentBookings: input.hotel ? [] : bookingsInPeriod,
    recentStays: input.hotel ? staysInPeriod : [],
    recentPayments: paymentsInPeriod,
  };
}
