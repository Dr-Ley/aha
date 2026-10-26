/**
 * Compare period-scoped overview facts with the existing metric functions.
 * Reads local aha_dev only. Does not write.
 *
 * The revenue date filter is accepted only when recognized revenue and the
 * chart sum match the full-ledger figures for AHA, EWC, and BTH on every preset.
 */
import { MongoClient, type Document } from "mongodb";
import { nairobiRange, nairobiYmd } from "../src/lib/nairobi-date";
import {
  countConfirmedBookings,
  countInPeriod,
  guestCount,
  openBalance,
  recognizedRevenue,
  sumAmountsInPeriod,
  upcomingArrivals,
  type HotelStayFact,
  type RevenueEntryFact,
  type RevenuePaymentFact,
} from "../src/lib/overview-metrics";
import { inOverviewPeriod, overviewPeriodBounds, type OverviewPeriod } from "../src/lib/overview-period";

const URI = "mongodb://127.0.0.1:27017/aha_dev";
const COMPANIES = ["aha", "ewc", "bth"] as const;
const PERIODS: OverviewPeriod[] = ["today", "week", "month", "year", "all"];

function ymdFromLoose(value: unknown): string {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : nairobiYmd(value);
  const text = String(value ?? "");
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  if (!text || text === "null") return "";
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : nairobiYmd(parsed);
}

function inRange(value: unknown, from: Date, to: Date): boolean {
  const date = value instanceof Date ? value : value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return false;
  return date.getTime() >= from.getTime() && date.getTime() < to.getTime();
}

function paymentFacts(rows: Document[]): RevenuePaymentFact[] {
  return rows
    .map((row) => ({
      id: Number(row._id),
      date: row.recorded_at ? nairobiYmd(new Date(row.recorded_at)) : "",
      amount: Number(row.amount ?? 0),
      status: String(row.status ?? ""),
      referenceType: (row.reference_type as string | null) ?? null,
      referenceId: row.reference_id == null ? null : Number(row.reference_id),
    }))
    .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date));
}

function entryFacts(rows: Document[]): RevenueEntryFact[] {
  return rows
    .map((row) => ({
      date: ymdFromLoose(row.recognized_at) || (row.period_month ? `${row.period_month}-01` : ""),
      amount: Number(row.amount ?? 0),
      paymentId: row.reference_type === "payment" && row.reference_id != null ? Number(row.reference_id) : null,
      referenceType: (row.reference_type as string | null) ?? null,
      referenceId: row.reference_id == null ? null : Number(row.reference_id),
    }))
    .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date));
}

async function lineMismatches(
  db: ReturnType<MongoClient["db"]>,
  itemsName: string,
  ordersName: string
): Promise<{ lines: number; mismatch: number; missingParent: number; nullCompany: number }> {
  const lines = await db.collection(itemsName).find({}).toArray();
  const parents = await db.collection(ordersName).find({}, { projection: { _id: 1, company_id: 1 } }).toArray();
  const companyByOrder = new Map(parents.map((row) => [row._id, row.company_id]));
  let mismatch = 0;
  let missingParent = 0;
  let nullCompany = 0;
  for (const line of lines) {
    if (line.company_id == null) nullCompany += 1;
    const parent = companyByOrder.get(line.order_id);
    if (parent == null) missingParent += 1;
    else if (line.company_id !== parent) mismatch += 1;
  }
  return { lines: lines.length, mismatch, missingParent, nullCompany };
}

async function main() {
  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 4000 });
  await client.connect();
  const db = client.db("aha_dev");
  const failures: string[] = [];
  try {
    if (db.databaseName !== "aha_dev") throw new Error(`Refused: connected to ${db.databaseName}`);
    for (const pair of [
      ["bar_order_items", "bar_orders"],
      ["restaurant_order_items", "restaurant_orders"],
    ] as const) {
      const report = await lineMismatches(db, pair[0], pair[1]);
      console.log(`${pair[0]} company check`, report);
      if (report.mismatch > 0 || report.missingParent > 0 || report.nullCompany > 0) {
        failures.push(`${pair[0]} company filter would change line totals: ${JSON.stringify(report)}`);
      }
    }

    for (const company of COMPANIES) {
      const [payments, revenue, bookings, stays, barOrders, restaurantOrders, barLines, restaurantLines] = await Promise.all([
        db.collection("payments").find({ company_id: company }).toArray(),
        db.collection("revenue_entries").find({ company_id: company }).toArray(),
        db.collection("bookings").find({ company_id: company }).toArray(),
        db.collection("hotel_bookings").find({ company_id: company }).toArray(),
        db.collection("bar_orders").find({ company_id: company }).toArray(),
        db.collection("restaurant_orders").find({ company_id: company }).toArray(),
        db.collection("bar_order_items").find({ company_id: company }).toArray(),
        db.collection("restaurant_order_items").find({ company_id: company }).toArray(),
      ]);
      const nullRecognized = revenue.filter((row) => row.recognized_at == null).length;
      const periodMonthOnly = revenue.filter((row) => row.recognized_at == null && row.period_month).length;
      console.log(`${company} rows`, {
        payments: payments.length,
        revenue: revenue.length,
        nullRecognized,
        periodMonthOnly,
        bookings: bookings.length,
        stays: stays.length,
      });

      const fullPayments = paymentFacts(payments);
      const fullEntries = entryFacts(revenue);
      const confirmed = bookings
        .filter((row) => row.status === "confirmed")
        .map((row) => ({ date: ymdFromLoose(row.start_date || row.travel_date), status: "confirmed" }))
        .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date));
      const chartRevenue = revenue
        .map((row) => ({
          date: ymdFromLoose(row.recognized_at) || (row.period_month ? `${row.period_month}-01` : ""),
          amount: Number(row.amount ?? 0),
        }))
        .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date));
      const hotelStays: HotelStayFact[] = stays
        .filter((stay) => stay.status !== "cancelled")
        .map((stay) => {
          const party = Number(stay.adults ?? 0) + Number(stay.children ?? 0) + Number(stay.infants ?? 0);
          const owed = stay.payment_status === "unpaid" || stay.payment_status === "partial";
          return {
            checkIn: ymdFromLoose(stay.check_in_date),
            checkOut: ymdFromLoose(stay.check_out_date),
            amount: Number(stay.total_amount ?? 0),
            guests: party > 0 ? party : 1,
            status: String(stay.status ?? ""),
            balance: owed ? Math.max(0, Number(stay.total_amount ?? 0) - Number(stay.amount_paid ?? 0)) : 0,
          };
        })
        .filter((stay) => /^\d{4}-\d{2}-\d{2}$/.test(stay.checkIn));
      const barByOrder = new Map<number, number>();
      for (const line of barLines) {
        barByOrder.set(Number(line.order_id), (barByOrder.get(Number(line.order_id)) ?? 0) + Number(line.line_total ?? 0));
      }
      const restaurantByOrder = new Map<number, number>();
      for (const line of restaurantLines) {
        restaurantByOrder.set(
          Number(line.order_id),
          (restaurantByOrder.get(Number(line.order_id)) ?? 0) + Number(line.line_total ?? 0)
        );
      }
      const barFacts = barOrders
        .map((order) => ({ date: ymdFromLoose(order.created_at), amount: barByOrder.get(Number(order._id)) ?? 0, balance: 0 }))
        .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date));
      const restaurantFacts = restaurantOrders
        .map((order) => ({
          date: ymdFromLoose(order.created_at),
          amount: restaurantByOrder.get(Number(order._id)) ?? 0,
          balance: 0,
        }))
        .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date));

      for (const period of PERIODS) {
        const bounds = overviewPeriodBounds(period);
        const rangedRevenue = bounds
          ? revenue.filter((row) => {
              const range = nairobiRange(bounds.start, bounds.end);
              return inRange(row.recognized_at, range.from, range.to);
            })
          : revenue;
        const rangedEntries = entryFacts(rangedRevenue);
        const rangedChart = rangedRevenue
          .map((row) => ({
            date: ymdFromLoose(row.recognized_at) || (row.period_month ? `${row.period_month}-01` : ""),
            amount: Number(row.amount ?? 0),
          }))
          .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date));
        const trimmedPayments = fullPayments.filter((row) => period === "all" || inOverviewPeriod(row.date, period));
        const trimmedEntries = fullEntries.filter((row) => period === "all" || inOverviewPeriod(row.date, period));

        const fullRevenue = recognizedRevenue(fullPayments, fullEntries, period);
        const trimmedRevenue = recognizedRevenue(trimmedPayments, trimmedEntries, period);
        const rangedMetric = recognizedRevenue(fullPayments, rangedEntries, period);
        const fullChart = sumAmountsInPeriod(chartRevenue, period);
        const rangedChartSum = sumAmountsInPeriod(rangedChart, period);
        const bookingsFull = countConfirmedBookings(confirmed, period);
        const bookingsTrimmed = countConfirmedBookings(
          confirmed.filter((row) => period === "all" || inOverviewPeriod(row.date, period)),
          period
        );
        const guests = guestCount(hotelStays, period);
        const arrivals = upcomingArrivals(hotelStays, period);
        const balance = openBalance([...hotelStays, ...barFacts, ...restaurantFacts]);
        const enquiryCount = countInPeriod(
          payments.map((row) => ({ date: row.recorded_at ? nairobiYmd(new Date(row.recorded_at)) : "" })).filter((row) =>
            /^\d{4}-\d{2}-\d{2}$/.test(row.date)
          ),
          period
        );

        const same =
          fullRevenue === trimmedRevenue &&
          fullRevenue === rangedMetric &&
          fullChart === rangedChartSum &&
          bookingsFull === bookingsTrimmed;
        console.log(
          `${company} ${period}`,
          JSON.stringify({
            recognizedRevenue: fullRevenue,
            trimmed: trimmedRevenue,
            dbRange: rangedMetric,
            chart: fullChart,
            chartAfterRange: rangedChartSum,
            confirmedBookings: bookingsFull,
            guests,
            arrivals,
            openBalance: balance,
            paymentDays: enquiryCount,
            revenueRows: revenue.length,
            revenueAfterRange: rangedRevenue.length,
          })
        );
        if (!same) {
          failures.push(
            `${company} ${period}: full ${fullRevenue} trimmed ${trimmedRevenue} dbRange ${rangedMetric} chart ${fullChart}/${rangedChartSum} bookings ${bookingsFull}/${bookingsTrimmed}`
          );
        }
      }
    }
  } finally {
    await client.close();
  }
  if (failures.length > 0) {
    console.error("MISMATCH");
    for (const failure of failures) console.error(failure);
    process.exit(1);
  }
  console.log("MATCH: period scope and revenue date filter preserve the metric functions.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
