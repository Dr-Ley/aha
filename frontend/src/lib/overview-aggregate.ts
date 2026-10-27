import { sql } from "drizzle-orm";
import {
  amountSeriesWindow,
  countByNameWindow,
  namedAmountSeriesWindow,
  productSeriesWindow,
  stackedSeriesWindow,
} from "@/lib/chart-period";
import { db } from "@/lib/db";
import { overviewWindow, upcomingArrivalBounds, type OverviewPeriod } from "@/lib/overview-period";
import { normalizePaymentLink } from "@/lib/payment-link";
import { safariSourceLabel, stayRoomsLabel, staySourceLabel } from "@/lib/stay-labels";
import { formatDayFromLabel, formatWeekFromLabel } from "@/lib/weekly-bar";
import type {
  OverviewCharts,
  OverviewMetrics,
  OverviewRecentBooking,
  OverviewRecentPayment,
  OverviewRecentStay,
} from "@/lib/overview-view";

export type OverviewAggregate = {
  companyId: string;
  period: OverviewPeriod;
  anchor: string;
  counts: { payments: number; bookings: number; stays: number };
  metrics: OverviewMetrics;
  charts: OverviewCharts;
  recentBookings: OverviewRecentBooking[];
  recentStays: OverviewRecentStay[];
  recentPayments: OverviewRecentPayment[];
};

type Point = { date: string; amount: number };
type NamedPoint = { name: string; amount: number };
type DurationPoint = { name: string; value: number };
type ProductPoint = { name: string; quantity: number; amount: number };
type RoomBits = {
  code?: string | null;
  name?: string | null;
  roomTypeName?: string | null;
  quantity?: number | null;
};

type AggregatePayload = {
  counts: OverviewAggregate["counts"];
  metrics: OverviewMetrics;
  points: {
    revenue: Point[];
    safariPaid: Point[];
    hotelPaid: Point[];
    hotelAll: Point[];
    barChart: Point[];
    barPaid: Point[];
    restaurantAll: Point[];
    restaurantPaid: Point[];
    countries: NamedPoint[];
    durations: DurationPoint[];
    barProducts: ProductPoint[];
    restaurantProducts: ProductPoint[];
  };
  recentBookings: OverviewRecentBooking[];
  recentStays: Array<
    OverviewRecentStay & {
      rooms?: RoomBits[] | null;
      room?: RoomBits | null;
    }
  >;
  recentPayments: Array<{
    id: number;
    amount: number;
    currency: string;
    method: string | null;
    status: string;
    recordedAt: string | null;
    bookingId: number | null;
    referenceType: string | null;
    referenceId: number | null;
    hotel: { guest: string | null; rooms: RoomBits[] | null; room: RoomBits | null } | null;
    booking: {
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      safariPackage: string | null;
    } | null;
    bar: { tableLabel: string | null; customerName: string | null } | null;
    restaurant: { tableLabel: string | null; customerName: string | null } | null;
  }>;
};

const EMPTY_PRODUCT = { name: "No products sold", quantity: 0, amount: 0 };

function num(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Chart series from grain totals. Bucket labels stay in the existing window helpers. */
export function chartsFromPoints(
  points: AggregatePayload["points"],
  period: OverviewPeriod,
  today: string,
  anchor: string,
  modules: { safari: boolean; hotel: boolean; bar: boolean; restaurant: boolean }
): OverviewCharts {
  const window = overviewWindow(period, today, anchor);
  const revenue = modules.safari || modules.hotel || modules.bar || modules.restaurant ? list<Point>(points.revenue) : [];
  const safariPaid = modules.safari ? list<Point>(points.safariPaid) : [];
  const hotelPaid = modules.hotel ? list<Point>(points.hotelPaid) : [];
  const hotelAll = modules.hotel ? list<Point>(points.hotelAll) : [];
  const barChart = modules.bar ? list<Point>(points.barChart) : [];
  const barPaid = modules.bar ? list<Point>(points.barPaid) : [];
  const restaurantAll = modules.restaurant ? list<Point>(points.restaurantAll) : [];
  const restaurantPaid = modules.restaurant ? list<Point>(points.restaurantPaid) : [];
  const countries = namedAmountSeriesWindow(
    (modules.safari ? list<NamedPoint>(points.countries) : []).map((row) => ({
      date: anchor,
      name: row.name,
      amount: num(row.amount),
    })),
    { bounds: null, grain: "year" }
  );
  const durations = countByNameWindow(
    (modules.safari ? list<DurationPoint>(points.durations) : []).flatMap((row) =>
      Array.from({ length: num(row.value) }, () => ({ date: anchor, name: row.name }))
    ),
    { bounds: null, grain: "year" }
  );
  const barProducts = productSeriesWindow(
    (modules.bar ? list<ProductPoint>(points.barProducts) : []).map((row) => ({
      date: anchor,
      name: row.name,
      quantity: num(row.quantity),
      amount: num(row.amount),
    })),
    { bounds: null, grain: "year" }
  );
  const restaurantProducts = productSeriesWindow(
    (modules.restaurant ? list<ProductPoint>(points.restaurantProducts) : []).map((row) => ({
      date: anchor,
      name: row.name,
      quantity: num(row.quantity),
      amount: num(row.amount),
    })),
    { bounds: null, grain: "year" }
  );

  return {
    revenueLine: amountSeriesWindow(revenue, window, today),
    revenueStack: stackedSeriesWindow(
      [
        ...safariPaid.map((row) => ({ date: row.date, safari: num(row.amount), hotel: 0, bar: 0 })),
        ...hotelPaid.map((row) => ({ date: row.date, safari: 0, hotel: num(row.amount), bar: 0 })),
        ...barPaid.map((row) => ({ date: row.date, safari: 0, hotel: 0, bar: num(row.amount) })),
      ],
      ["safari", "hotel", "bar"] as const,
      window,
      today
    ),
    countries:
      countries.length > 0
        ? countries.map((row) => ({ country: row.name, amount: row.amount }))
        : [{ country: "No bookings", amount: 0 }],
    safariSlices: durations.length > 0 ? durations : [{ name: "No bookings", value: 1 }],
    department: stackedSeriesWindow(
      [
        ...hotelPaid.map((row) => ({ date: row.date, hotel: num(row.amount), bar: 0, restaurant: 0 })),
        ...barPaid.map((row) => ({ date: row.date, hotel: 0, bar: num(row.amount), restaurant: 0 })),
        ...restaurantPaid.map((row) => ({ date: row.date, hotel: 0, bar: 0, restaurant: num(row.amount) })),
      ],
      ["hotel", "bar", "restaurant"] as const,
      window,
      today
    ),
    stays: amountSeriesWindow(hotelAll, window, today),
    barSales: amountSeriesWindow(barChart, window, today),
    barProducts: barProducts.length > 0 ? barProducts : [EMPTY_PRODUCT],
    restaurantSales: amountSeriesWindow(restaurantAll, window, today),
    restaurantProducts: restaurantProducts.length > 0 ? restaurantProducts : [EMPTY_PRODUCT],
  };
}

function paymentSourceLabel(companyId: string, row: AggregatePayload["recentPayments"][number]): string {
  const link = normalizePaymentLink({
    bookingId: row.bookingId,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
  });
  if (link.referenceType === "hotel" && link.referenceId != null) {
    if (!row.hotel) return "Hotel stay";
    const rooms = list<RoomBits>(row.hotel.rooms);
    return staySourceLabel({
      primaryGuestName: row.hotel.guest,
      rooms: rooms.length > 0 ? rooms : undefined,
      room: row.hotel.room,
    });
  }
  if (link.referenceType === "tour" && link.referenceId != null) {
    return row.booking ? safariSourceLabel(row.booking) : "Safari booking";
  }
  if (link.referenceType === "bar" && link.referenceId != null) {
    if (!row.bar) return "Bar order";
    if (companyId === "bth") return formatDayFromLabel(row.bar.tableLabel);
    if (companyId === "ewc") return formatWeekFromLabel(row.bar.tableLabel);
    return row.bar.tableLabel || row.bar.customerName || "Bar order";
  }
  if (link.referenceType === "restaurant" && link.referenceId != null) {
    return row.restaurant?.tableLabel || row.restaurant?.customerName || "Restaurant order";
  }
  return "—";
}

function stayRoomType(row: AggregatePayload["recentStays"][number]): string {
  const rooms = list<RoomBits>(row.rooms);
  const label =
    rooms.length > 0 ? stayRoomsLabel({ rooms }) : row.room ? stayRoomsLabel({ room: row.room }) : "—";
  return label === "Room" ? "—" : label;
}

function rowsOf(result: unknown): Array<{ payload: AggregatePayload }> {
  if (Array.isArray(result)) return result as Array<{ payload: AggregatePayload }>;
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows: Array<{ payload: AggregatePayload }> }).rows;
  }
  return [];
}

export async function loadOverviewAggregate(input: {
  companyId: string;
  period: OverviewPeriod;
  today: string;
  anchor: string;
  periodStart: string | null;
  periodEnd: string | null;
  safari: boolean;
  hotel: boolean;
  bar: boolean;
  restaurant: boolean;
}): Promise<OverviewAggregate> {
  const upcoming = upcomingArrivalBounds(input.period, input.today, input.anchor);
  const grain = input.period === "all" ? "year" : input.period === "year" ? "month" : "day";
  const companyId = input.companyId;
  const periodStart = input.periodStart;
  const periodEnd = input.periodEnd;
  const upcomingStart = upcoming.start;
  const upcomingEnd = upcoming.end;
  const showSafari = input.safari;
  const showHotel = input.hotel;
  const showBar = input.bar;
  const showRestaurant = input.restaurant;

  const result = await db.execute(sql`
    WITH books AS MATERIALIZED (
      SELECT
        b.id,
        b.created_at,
        b.first_name,
        b.last_name,
        b.email,
        b.safari_package,
        b.start_date,
        b.travel_date,
        b.end_date,
        b.status::text AS status,
        b.payment_status::text AS payment_status,
        coalesce(b.total_price, 0)::int AS total_price,
        b.trip_country::text AS trip_country,
        CASE
          WHEN coalesce(nullif(b.start_date, ''), b.travel_date) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
          THEN left(coalesce(nullif(b.start_date, ''), b.travel_date), 10)
          ELSE NULL
        END AS activity_date,
        coalesce(nullif(b.start_date, ''), b.travel_date) AS list_date
      FROM bookings b
      WHERE b.company_id = ${companyId}
    ),
    pay AS MATERIALIZED (
      SELECT
        p.id,
        p.amount::int AS amount,
        p.currency,
        p.method,
        p.status,
        p.recorded_at,
        p.booking_id,
        CASE
          WHEN p.booking_id IS NOT NULL AND coalesce(p.reference_type::text, '') = '' THEN 'tour'
          ELSE nullif(p.reference_type::text, '')
        END AS ref_type,
        CASE
          WHEN p.booking_id IS NOT NULL AND coalesce(p.reference_type::text, '') = '' THEN p.booking_id
          WHEN p.reference_type::text = 'tour' AND p.reference_id IS NULL AND p.booking_id IS NOT NULL THEN p.booking_id
          ELSE p.reference_id
        END AS ref_id,
        p.reference_type::text AS reference_type,
        p.reference_id,
        CASE
          WHEN p.recorded_at IS NULL THEN NULL
          ELSE to_char(p.recorded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM-DD')
        END AS activity_date,
        CASE
          WHEN p.recorded_at IS NULL THEN NULL
          ELSE to_char(p.recorded_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        END AS recorded_iso,
        regexp_replace(lower(btrim(coalesce(p.status, ''))), '[[:space:]-]+', '_', 'g') AS status_key
      FROM payments p
      WHERE p.company_id = ${companyId}
    ),
    rev AS MATERIALIZED (
      SELECT
        r.amount::int AS amount,
        CASE WHEN r.reference_type::text = 'payment' THEN r.reference_id ELSE NULL END AS payment_id,
        nullif(r.reference_type::text, '') AS ref_type,
        r.reference_id AS ref_id,
        CASE
          WHEN r.recognized_at IS NOT NULL THEN to_char(r.recognized_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM-DD')
          WHEN r.period_month ~ '^[0-9]{4}-[0-9]{2}$' THEN r.period_month || '-01'
          ELSE NULL
        END AS activity_date
      FROM revenue_entries r
      WHERE r.company_id = ${companyId}
    ),
    counted AS MATERIALIZED (
      SELECT id, ref_type, ref_id, amount
      FROM pay
      WHERE status_key IN ('paid', 'partial', 'partially_paid', 'completed')
        AND activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        AND (
          ${periodStart}::date IS NULL
          OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date
        )
    ),
    received AS MATERIALIZED (
      SELECT ref_type, ref_id, sum(amount)::int AS amount
      FROM pay
      WHERE status_key IN ('paid', 'partial', 'partially_paid', 'completed')
        AND ref_type IS NOT NULL
        AND ref_id IS NOT NULL
      GROUP BY ref_type, ref_id
    ),
    stays AS MATERIALIZED (
      SELECT
        hb.id,
        hb.room_id,
        to_char(hb.check_in_date, 'YYYY-MM-DD') AS check_in,
        to_char(hb.check_out_date, 'YYYY-MM-DD') AS check_out,
        hb.nights,
        hb.primary_guest_name,
        hb.adults,
        hb.children,
        hb.infants,
        hb.total_amount::int AS total_amount,
        hb.amount_paid::int AS amount_paid,
        hb.payment_status::text AS payment_status,
        hb.reservation_status::text AS status
      FROM hotel_bookings hb
      WHERE hb.company_id = ${companyId}
        AND ${showHotel}::boolean
    ),
    bar_sums AS MATERIALIZED (
      SELECT
        i.order_id,
        coalesce(sum(i.line_total), 0)::int AS ledger_amount,
        coalesce(sum(i.line_total) FILTER (WHERE i.quantity > 0 OR i.line_total > 0), 0)::int AS chart_amount
      FROM bar_order_items i
      WHERE i.company_id = ${companyId}
        AND ${showBar}::boolean
      GROUP BY i.order_id
    ),
    bar AS MATERIALIZED (
      SELECT
        o.id,
        o.status,
        o.table_label,
        o.customer_name,
        coalesce(s.ledger_amount, 0)::int AS ledger_amount,
        coalesce(s.chart_amount, 0)::int AS chart_amount,
        lower(coalesce(o.status, '')) = 'paid' AS is_paid,
        CASE
          WHEN week.parts IS NOT NULL
            AND week.parts[1]::int BETWEEN 1 AND 31
            AND week.parts[2]::int BETWEEN 1 AND 12
            AND week.parts[4]::int BETWEEN 1 AND 31
            AND week.parts[5]::int BETWEEN 1 AND 12
          THEN lpad(week.parts[3], 4, '0') || '-' || lpad(week.parts[2], 2, '0') || '-' || lpad(week.parts[1], 2, '0')
          WHEN btrim(coalesce(o.table_label, '')) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN btrim(o.table_label)
          WHEN day.parts IS NOT NULL
            AND day.parts[1]::int BETWEEN 1 AND 31
            AND day.parts[2]::int BETWEEN 1 AND 12
          THEN lpad(day.parts[3], 4, '0') || '-' || lpad(day.parts[2], 2, '0') || '-' || lpad(day.parts[1], 2, '0')
          WHEN o.created_at IS NOT NULL THEN to_char(o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM-DD')
          ELSE NULL
        END AS activity_date
      FROM bar_orders o
      LEFT JOIN bar_sums s ON s.order_id = o.id
      LEFT JOIN LATERAL (
        SELECT regexp_match(
          replace(replace(btrim(coalesce(o.table_label, '')), '–', '-'), '—', '-'),
          '([0-9]{1,2})[/-]([0-9]{1,2})[/-]([0-9]{4})[[:space:]]*-[[:space:]]*([0-9]{1,2})[/-]([0-9]{1,2})[/-]([0-9]{4})'
        ) AS parts
      ) week ON true
      LEFT JOIN LATERAL (
        SELECT regexp_match(btrim(coalesce(o.table_label, '')), '^([0-9]{1,2})[/-]([0-9]{1,2})[/-]([0-9]{4})$') AS parts
      ) day ON true
      WHERE o.company_id = ${companyId}
        AND ${showBar}::boolean
    ),
    rest_sums AS MATERIALIZED (
      SELECT
        i.order_id,
        coalesce(sum(i.line_total) FILTER (WHERE i.quantity > 0 OR i.line_total > 0), 0)::int AS amount
      FROM restaurant_order_items i
      WHERE i.company_id = ${companyId}
        AND ${showRestaurant}::boolean
      GROUP BY i.order_id
    ),
    rest AS MATERIALIZED (
      SELECT
        o.id,
        o.status,
        o.table_label,
        o.customer_name,
        coalesce(s.amount, 0)::int AS amount,
        lower(coalesce(o.status, '')) = 'paid' AS is_paid,
        CASE
          WHEN o.created_at IS NULL THEN NULL
          ELSE to_char(o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM-DD')
        END AS activity_date
      FROM restaurant_orders o
      LEFT JOIN rest_sums s ON s.order_id = o.id
      WHERE o.company_id = ${companyId}
        AND ${showRestaurant}::boolean
    ),
    enquiries AS MATERIALIZED (
      SELECT
        CASE
          WHEN c.created_at IS NULL THEN NULL
          ELSE to_char(c.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM-DD')
        END AS activity_date
      FROM contact_submissions c
      WHERE c.company_id = ${companyId}
    )
    SELECT jsonb_build_object(
      'counts', jsonb_build_object(
        'payments', (SELECT count(*)::int FROM pay),
        'bookings', (SELECT count(*)::int FROM books),
        'stays', CASE WHEN ${showHotel}::boolean THEN (SELECT count(*)::int FROM stays) ELSE 0 END
      ),
      'metrics', jsonb_build_object(
        'hotelRevenue', (
          SELECT coalesce(sum(total_amount), 0)::int
          FROM stays
          WHERE status <> 'cancelled'
            AND check_in ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            AND (${periodStart}::date IS NULL OR check_in::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
        ),
        'barSales', (
          SELECT coalesce(sum(ledger_amount), 0)::int
          FROM bar
          WHERE activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            AND (${periodStart}::date IS NULL OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
        ),
        'restaurantSales', (
          SELECT coalesce(sum(amount), 0)::int
          FROM rest
          WHERE activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            AND (${periodStart}::date IS NULL OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
        ),
        'unpaidBalance', (
          SELECT
            (
              SELECT coalesce(sum(greatest(0, total_amount - amount_paid)), 0)::int
              FROM stays
              WHERE status <> 'cancelled'
                AND check_in ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                AND payment_status IN ('unpaid', 'partial')
            )
            + (
              SELECT coalesce(sum(
                CASE
                  WHEN b.is_paid THEN 0
                  ELSE greatest(0, b.ledger_amount - coalesce(r.amount, 0))
                END
              ), 0)::int
              FROM bar b
              LEFT JOIN received r ON r.ref_type = 'bar' AND r.ref_id = b.id
              WHERE b.activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            )
            + (
              SELECT coalesce(sum(
                CASE
                  WHEN o.is_paid THEN 0
                  ELSE greatest(0, o.amount - coalesce(r.amount, 0))
                END
              ), 0)::int
              FROM rest o
              LEFT JOIN received r ON r.ref_type = 'restaurant' AND r.ref_id = o.id
              WHERE o.activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            )
        ),
        'guests', (
          SELECT coalesce(sum(CASE WHEN adults + children + infants > 0 THEN adults + children + infants ELSE 1 END), 0)::int
          FROM stays
          WHERE status <> 'cancelled'
            AND check_in ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            AND (
              ${periodStart}::date IS NULL
              OR (
                check_out ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                AND check_in::date <= ${periodEnd}::date
                AND check_out::date >= ${periodStart}::date
              )
            )
        ),
        'upcomingArrivals', (
          SELECT count(*)::int
          FROM stays
          WHERE status IN ('pending', 'confirmed')
            AND check_in ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            AND check_in::date BETWEEN ${upcomingStart}::date AND ${upcomingEnd}::date
        ),
        'bookingCount', (
          SELECT count(*)::int
          FROM books
          WHERE ${showSafari}::boolean
            AND activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            AND (${periodStart}::date IS NULL OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
        ),
        'revenue', (
          SELECT coalesce((SELECT sum(amount) FROM counted), 0)::int
            + coalesce((
              SELECT sum(e.amount)::int
              FROM rev e
              WHERE e.activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                AND (${periodStart}::date IS NULL OR e.activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
                AND NOT (e.payment_id IS NOT NULL AND e.payment_id IN (SELECT id FROM counted))
                AND NOT (
                  e.ref_type IS NOT NULL
                  AND e.ref_id IS NOT NULL
                  AND EXISTS (
                    SELECT 1
                    FROM counted c
                    WHERE c.ref_type IS NOT NULL
                      AND c.ref_id IS NOT NULL
                      AND c.ref_type = e.ref_type
                      AND c.ref_id = e.ref_id
                  )
                )
            ), 0)::int
        ),
        'unpaidBookings', (
          SELECT count(*)::int
          FROM books
          WHERE ${showSafari}::boolean
            AND activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            AND (${periodStart}::date IS NULL OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
            AND regexp_replace(lower(btrim(coalesce(payment_status, ''))), '[[:space:]-]+', '_', 'g')
              IN ('unpaid', 'partial', 'partially_paid')
        ),
        'enquiryCount', (
          SELECT count(*)::int
          FROM enquiries
          WHERE activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            AND (${periodStart}::date IS NULL OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
        )
      ),
      'points', jsonb_build_object(
        'revenue', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('date', d, 'amount', amount) ORDER BY d), '[]'::jsonb)
          FROM (
            SELECT
              CASE ${grain}
                WHEN 'year' THEN left(activity_date, 4) || '-01-01'
                WHEN 'month' THEN left(activity_date, 7) || '-01'
                ELSE activity_date
              END AS d,
              sum(amount)::int AS amount
            FROM rev
            WHERE activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND (${periodStart}::date IS NULL OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
            GROUP BY 1
          ) s
        ),
        'safariPaid', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('date', d, 'amount', amount) ORDER BY d), '[]'::jsonb)
          FROM (
            SELECT
              CASE ${grain}
                WHEN 'year' THEN left(activity_date, 4) || '-01-01'
                WHEN 'month' THEN left(activity_date, 7) || '-01'
                ELSE activity_date
              END AS d,
              sum(total_price)::int AS amount
            FROM books
            WHERE ${showSafari}::boolean
              AND coalesce(status, '') <> 'cancelled'
              AND lower(coalesce(payment_status, '')) IN ('paid', 'partial')
              AND activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND (${periodStart}::date IS NULL OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
            GROUP BY 1
          ) s
        ),
        'hotelPaid', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('date', d, 'amount', amount) ORDER BY d), '[]'::jsonb)
          FROM (
            SELECT
              CASE ${grain}
                WHEN 'year' THEN left(check_in, 4) || '-01-01'
                WHEN 'month' THEN left(check_in, 7) || '-01'
                ELSE check_in
              END AS d,
              sum(total_amount)::int AS amount
            FROM stays
            WHERE status <> 'cancelled'
              AND lower(coalesce(payment_status, '')) = 'paid'
              AND check_in ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND (${periodStart}::date IS NULL OR check_in::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
            GROUP BY 1
          ) s
        ),
        'hotelAll', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('date', d, 'amount', amount) ORDER BY d), '[]'::jsonb)
          FROM (
            SELECT
              CASE ${grain}
                WHEN 'year' THEN left(check_in, 4) || '-01-01'
                WHEN 'month' THEN left(check_in, 7) || '-01'
                ELSE check_in
              END AS d,
              sum(total_amount)::int AS amount
            FROM stays
            WHERE status <> 'cancelled'
              AND check_in ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND (${periodStart}::date IS NULL OR check_in::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
            GROUP BY 1
          ) s
        ),
        'barChart', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('date', d, 'amount', amount) ORDER BY d), '[]'::jsonb)
          FROM (
            SELECT
              CASE ${grain}
                WHEN 'year' THEN left(activity_date, 4) || '-01-01'
                WHEN 'month' THEN left(activity_date, 7) || '-01'
                ELSE activity_date
              END AS d,
              sum(chart_amount)::int AS amount
            FROM bar
            WHERE chart_amount > 0
              AND activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND (${periodStart}::date IS NULL OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
            GROUP BY 1
          ) s
        ),
        'barPaid', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('date', d, 'amount', amount) ORDER BY d), '[]'::jsonb)
          FROM (
            SELECT
              CASE ${grain}
                WHEN 'year' THEN left(activity_date, 4) || '-01-01'
                WHEN 'month' THEN left(activity_date, 7) || '-01'
                ELSE activity_date
              END AS d,
              sum(chart_amount)::int AS amount
            FROM bar
            WHERE is_paid
              AND chart_amount > 0
              AND activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND (${periodStart}::date IS NULL OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
            GROUP BY 1
          ) s
        ),
        'restaurantAll', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('date', d, 'amount', amount) ORDER BY d), '[]'::jsonb)
          FROM (
            SELECT
              CASE ${grain}
                WHEN 'year' THEN left(activity_date, 4) || '-01-01'
                WHEN 'month' THEN left(activity_date, 7) || '-01'
                ELSE activity_date
              END AS d,
              sum(amount)::int AS amount
            FROM rest
            WHERE activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND (${periodStart}::date IS NULL OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
            GROUP BY 1
          ) s
        ),
        'restaurantPaid', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('date', d, 'amount', amount) ORDER BY d), '[]'::jsonb)
          FROM (
            SELECT
              CASE ${grain}
                WHEN 'year' THEN left(activity_date, 4) || '-01-01'
                WHEN 'month' THEN left(activity_date, 7) || '-01'
                ELSE activity_date
              END AS d,
              sum(amount)::int AS amount
            FROM rest
            WHERE is_paid
              AND activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND (${periodStart}::date IS NULL OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
            GROUP BY 1
          ) s
        ),
        'countries', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'amount', amount)), '[]'::jsonb)
          FROM (
            SELECT coalesce(nullif(btrim(trip_country), ''), 'Unknown') AS name, sum(total_price)::int AS amount
            FROM books
            WHERE ${showSafari}::boolean
              AND coalesce(status, '') <> 'cancelled'
              AND activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND (${periodStart}::date IS NULL OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
            GROUP BY 1
          ) s
        ),
        'durations', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'value', value)), '[]'::jsonb)
          FROM (
            SELECT
              CASE WHEN days = 1 THEN '1 Day' ELSE days::text || ' Days' END AS name,
              count(*)::int AS value
            FROM (
              SELECT
                CASE
                  WHEN activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                    AND end_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
                    AND left(end_date, 10)::date >= activity_date::date
                  THEN greatest(1, (left(end_date, 10)::date - activity_date::date))
                  ELSE NULL
                END AS days
              FROM books
              WHERE ${showSafari}::boolean
                AND coalesce(status, '') <> 'cancelled'
                AND activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                AND (${periodStart}::date IS NULL OR activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
            ) sized
            WHERE days IS NOT NULL
            GROUP BY days
          ) s
        ),
        'barProducts', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'quantity', quantity, 'amount', amount)), '[]'::jsonb)
          FROM (
            SELECT
              coalesce(nullif(btrim(bi.name), ''), 'Product') AS name,
              sum(i.quantity)::int AS quantity,
              sum(i.line_total)::int AS amount
            FROM bar_order_items i
            JOIN bar b ON b.id = i.order_id
            LEFT JOIN bar_items bi ON bi.id = i.item_id
            WHERE i.company_id = ${companyId}
              AND (i.quantity > 0 OR i.line_total > 0)
              AND b.chart_amount > 0
              AND b.activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND (${periodStart}::date IS NULL OR b.activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
            GROUP BY 1
          ) s
        ),
        'restaurantProducts', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'quantity', quantity, 'amount', amount)), '[]'::jsonb)
          FROM (
            SELECT
              coalesce(nullif(btrim(ri.name), ''), 'Product') AS name,
              sum(i.quantity)::int AS quantity,
              sum(i.line_total)::int AS amount
            FROM restaurant_order_items i
            JOIN rest o ON o.id = i.order_id
            LEFT JOIN restaurant_items ri ON ri.id = i.item_id
            WHERE i.company_id = ${companyId}
              AND (i.quantity > 0 OR i.line_total > 0)
              AND o.activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND (${periodStart}::date IS NULL OR o.activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date)
            GROUP BY 1
          ) s
        )
      ),
      'recentBookings', (
        SELECT coalesce(jsonb_agg(jsonb_build_object(
          'id', id,
          'customerName', customer_name,
          'package', package_name,
          'startDate', list_date,
          'status', status,
          'paymentStatus', payment_status
        ) ORDER BY created_at DESC NULLS LAST, id DESC), '[]'::jsonb)
        FROM (
          SELECT
            id,
            created_at,
            coalesce(nullif(btrim(concat_ws(' ', first_name, nullif(last_name, ''))), ''), email) AS customer_name,
            CASE WHEN safari_package IS NULL THEN '—' ELSE safari_package END AS package_name,
            list_date,
            coalesce(status, 'pending') AS status,
            payment_status
          FROM books
          WHERE NOT ${showHotel}::boolean
            AND (
              ${periodStart}::date IS NULL
              OR (
                left(coalesce(list_date, ''), 10) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                AND left(list_date, 10)::date BETWEEN ${periodStart}::date AND ${periodEnd}::date
              )
            )
        ) listed
      ),
      'recentStays', (
        SELECT coalesce(jsonb_agg(jsonb_build_object(
          'id', s.id,
          'guest', CASE WHEN s.primary_guest_name IS NULL OR s.primary_guest_name = '' THEN 'Guest' ELSE s.primary_guest_name END,
          'nights', s.nights,
          'checkInDate', s.check_in,
          'status', s.status,
          'paymentStatus', s.payment_status,
          'totalAmount', s.total_amount,
          'rooms', coalesce(alloc.rooms, '[]'::jsonb),
          'room', CASE
            WHEN alloc.rooms IS NULL THEN jsonb_build_object('code', pr.code, 'name', pr.name, 'roomTypeName', prt.name)
            ELSE NULL
          END
        ) ORDER BY s.check_in DESC, s.id DESC), '[]'::jsonb)
        FROM stays s
        LEFT JOIN LATERAL (
          SELECT jsonb_agg(jsonb_build_object(
            'code', r.code,
            'name', r.name,
            'roomTypeName', rt.name,
            'quantity', hbr.quantity
          ) ORDER BY hbr.id) AS rooms
          FROM hotel_booking_rooms hbr
          JOIN rooms r ON r.id = hbr.room_id AND r.company_id = ${companyId}
          LEFT JOIN room_types rt ON rt.id = r.room_type_id
          WHERE hbr.hotel_booking_id = s.id
        ) alloc ON true
        LEFT JOIN rooms pr ON alloc.rooms IS NULL AND pr.id = s.room_id AND pr.company_id = ${companyId}
        LEFT JOIN room_types prt ON prt.id = pr.room_type_id
        WHERE ${showHotel}::boolean
          AND (
            ${periodStart}::date IS NULL
            OR (
              s.check_in ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND s.check_in::date BETWEEN ${periodStart}::date AND ${periodEnd}::date
            )
          )
      ),
      'recentPayments', (
        SELECT coalesce(jsonb_agg(jsonb_build_object(
          'id', p.id,
          'amount', p.amount,
          'currency', p.currency,
          'method', p.method,
          'status', p.status,
          'recordedAt', p.recorded_iso,
          'bookingId', p.booking_id,
          'referenceType', p.reference_type,
          'referenceId', p.reference_id,
          'hotel', CASE
            WHEN p.ref_type = 'hotel' AND p.ref_id IS NOT NULL THEN (
              SELECT jsonb_build_object(
                'guest', hb.primary_guest_name,
                'rooms', coalesce((
                  SELECT jsonb_agg(jsonb_build_object(
                    'code', r.code,
                    'name', r.name,
                    'roomTypeName', rt.name,
                    'quantity', hbr.quantity
                  ) ORDER BY hbr.id)
                  FROM hotel_booking_rooms hbr
                  JOIN rooms r ON r.id = hbr.room_id AND r.company_id = ${companyId}
                  LEFT JOIN room_types rt ON rt.id = r.room_type_id
                  WHERE hbr.hotel_booking_id = hb.id
                ), '[]'::jsonb),
                'room', (
                  SELECT jsonb_build_object('code', r.code, 'name', r.name, 'roomTypeName', rt.name)
                  FROM rooms r
                  LEFT JOIN room_types rt ON rt.id = r.room_type_id
                  WHERE r.id = hb.room_id AND r.company_id = ${companyId}
                )
              )
              FROM hotel_bookings hb
              WHERE hb.id = p.ref_id AND hb.company_id = ${companyId}
            )
            ELSE NULL
          END,
          'booking', CASE
            WHEN p.ref_type = 'tour' AND p.ref_id IS NOT NULL THEN (
              SELECT jsonb_build_object(
                'firstName', b.first_name,
                'lastName', b.last_name,
                'email', b.email,
                'safariPackage', b.safari_package
              )
              FROM bookings b
              WHERE b.id = p.ref_id AND b.company_id = ${companyId}
            )
            ELSE NULL
          END,
          'bar', CASE
            WHEN p.ref_type = 'bar' AND p.ref_id IS NOT NULL THEN (
              SELECT jsonb_build_object('tableLabel', o.table_label, 'customerName', o.customer_name)
              FROM bar_orders o
              WHERE o.id = p.ref_id AND o.company_id = ${companyId}
            )
            ELSE NULL
          END,
          'restaurant', CASE
            WHEN p.ref_type = 'restaurant' AND p.ref_id IS NOT NULL THEN (
              SELECT jsonb_build_object('tableLabel', o.table_label, 'customerName', o.customer_name)
              FROM restaurant_orders o
              WHERE o.id = p.ref_id AND o.company_id = ${companyId}
            )
            ELSE NULL
          END
        ) ORDER BY p.recorded_at DESC NULLS LAST, p.id DESC), '[]'::jsonb)
        FROM pay p
        WHERE (
          ${periodStart}::date IS NULL
          OR (
            p.activity_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            AND p.activity_date::date BETWEEN ${periodStart}::date AND ${periodEnd}::date
          )
        )
      )
    ) AS payload
  `);

  const payload = rowsOf(result)[0]?.payload;
  if (!payload) throw new Error("Overview aggregate returned no row");
  const metrics = payload.metrics;
  const points = payload.points;
  const recentPayments = list<AggregatePayload["recentPayments"][number]>(payload.recentPayments).map((row) => ({
    id: num(row.id),
    amount: num(row.amount),
    currency: row.currency || "KES",
    method: row.method,
    status: row.status,
    recordedAt: row.recordedAt,
    sourceLabel: paymentSourceLabel(companyId, row),
  }));
  const recentStays = list<AggregatePayload["recentStays"][number]>(payload.recentStays).map((row) => ({
    id: num(row.id),
    guest: row.guest,
    roomType: stayRoomType(row),
    nights: num(row.nights),
    checkInDate: row.checkInDate,
    status: row.status,
    paymentStatus: row.paymentStatus,
    totalAmount: num(row.totalAmount),
  }));
  const recentBookings = list<OverviewRecentBooking>(payload.recentBookings).map((row) => ({
    id: num(row.id),
    customerName: row.customerName,
    package: row.package,
    startDate: row.startDate ?? "",
    status: row.status,
    paymentStatus: row.paymentStatus,
  }));

  return {
    companyId,
    period: input.period,
    anchor: input.anchor,
    counts: {
      payments: num(payload.counts?.payments),
      bookings: num(payload.counts?.bookings),
      stays: num(payload.counts?.stays),
    },
    metrics: {
      hotelRevenue: num(metrics?.hotelRevenue),
      barSales: num(metrics?.barSales),
      restaurantSales: num(metrics?.restaurantSales),
      unpaidBalance: num(metrics?.unpaidBalance),
      guests: num(metrics?.guests),
      upcomingArrivals: num(metrics?.upcomingArrivals),
      bookingCount: num(metrics?.bookingCount),
      revenue: num(metrics?.revenue),
      unpaidBookings: num(metrics?.unpaidBookings),
      enquiryCount: num(metrics?.enquiryCount),
    },
    charts: chartsFromPoints(points, input.period, input.today, input.anchor, {
      safari: showSafari,
      hotel: showHotel,
      bar: showBar,
      restaurant: showRestaurant,
    }),
    recentBookings: showHotel ? [] : recentBookings,
    recentStays: showHotel ? recentStays : [],
    recentPayments,
  };
}

