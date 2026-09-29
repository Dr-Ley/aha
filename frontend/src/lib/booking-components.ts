import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookingComponents, bookings, companies } from "@/lib/schema";
import type { CurrencyCode } from "@/lib/data";
import {
  BOOKING_COMPONENT_TYPES,
  DEFAULT_COMPANY_MARKUP_PERCENT,
  buildStoredCostStack,
  componentTypeToCostStackKind,
  costStackKindToComponentType,
  quoteBookingComponents,
  type BookingComponentType,
  type PricingComponentInput,
  type StoredCostStack,
} from "@/lib/pricing";
import { PricingService } from "@/lib/pricing-service";

export type BookingComponentRow = typeof bookingComponents.$inferSelect;

export type BookingComponentDraft = {
  type: BookingComponentType;
  cost: number;
  config?: Record<string, unknown> | null;
  sequence?: number;
  label?: string | null;
};

let tablesReady = false;

export async function ensureBookingComponentTables(): Promise<void> {
  if (tablesReady) return;
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "booking_component_type" AS ENUM (
        'accommodation', 'transport', 'park_fee', 'activity', 'transfer', 'other'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await db.execute(sql`
    ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "markup_percent" integer NOT NULL DEFAULT 20
  `);
  await db.execute(sql`
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "current_version" integer NOT NULL DEFAULT 1
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "booking_components" (
      "id" serial PRIMARY KEY,
      "booking_id" integer NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
      "type" "booking_component_type" NOT NULL,
      "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "cost" integer NOT NULL DEFAULT 0,
      "sequence" integer NOT NULL DEFAULT 0,
      "created_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "booking_components_booking_id_idx"
    ON "booking_components" ("booking_id", "sequence")
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "booking_versions" (
      "id" serial PRIMARY KEY,
      "booking_id" integer NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
      "version" integer NOT NULL,
      "is_current" boolean NOT NULL DEFAULT false,
      "snapshot" jsonb NOT NULL,
      "selling_price" integer,
      "previous_selling_price" integer,
      "currency" varchar(10),
      "changed_by_user_id" integer REFERENCES "users"("id"),
      "change_summary" text,
      "created_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "booking_versions_booking_version"
    ON "booking_versions" ("booking_id", "version")
  `);
  await backfillBookingComponents();
  tablesReady = true;
}

async function backfillBookingComponents(): Promise<void> {
  await db.execute(sql`
    INSERT INTO "booking_components" ("booking_id", "type", "config", "cost", "sequence")
    SELECT b.id, v.type, jsonb_build_object('source', 'cost_stack', 'label', v.label), v.cost, v.seq
    FROM "bookings" b
    CROSS JOIN LATERAL (
      VALUES
        ('accommodation'::booking_component_type, COALESCE((b.cost_stack->>'accommodation')::int, 0), 'Accommodation', 0),
        ('transport'::booking_component_type, COALESCE((b.cost_stack->>'transport')::int, 0), 'Transport', 1),
        ('park_fee'::booking_component_type, COALESCE((b.cost_stack->>'parkFees')::int, 0), 'Park fees', 2),
        ('transfer'::booking_component_type, COALESCE((b.cost_stack->>'transfers')::int, 0), 'Transfers', 3),
        ('activity'::booking_component_type, COALESCE((b.cost_stack->>'activities')::int, 0), 'Activities', 4),
        ('other'::booking_component_type, COALESCE((b.cost_stack->>'other')::int, 0), 'Other costs', 5)
    ) AS v(type, cost, label, seq)
    WHERE b.pricing_source = 'cost_stack'
      AND b.cost_stack IS NOT NULL
      AND v.cost > 0
      AND NOT EXISTS (SELECT 1 FROM "booking_components" c WHERE c.booking_id = b.id)
  `);
  await db.execute(sql`
    INSERT INTO "booking_components" ("booking_id", "type", "config", "cost", "sequence")
    SELECT
      b.id,
      'other'::booking_component_type,
      jsonb_build_object(
        'source', COALESCE(b.pricing_source, 'manual'),
        'label', COALESCE(NULLIF(b.safari_package, ''), 'Safari booking')
      ),
      GREATEST(COALESCE(b.original_amount, b.total_price, 0), 0),
      0
    FROM "bookings" b
    WHERE NOT EXISTS (SELECT 1 FROM "booking_components" c WHERE c.booking_id = b.id)
  `);
  await db.execute(sql`
    INSERT INTO "booking_versions" (
      "booking_id", "version", "is_current", "snapshot", "selling_price", "currency", "change_summary"
    )
    SELECT
      b.id, 1, true,
      jsonb_build_object(
        'pricingSource', b.pricing_source,
        'originalAmount', b.original_amount,
        'totalPrice', b.total_price,
        'originalCurrency', b.original_currency,
        'migrated', true
      ),
      COALESCE(b.original_amount, b.total_price),
      COALESCE(b.original_currency, 'KES'),
      'Initial snapshot (Sprint 4 migration)'
    FROM "bookings" b
    WHERE NOT EXISTS (SELECT 1 FROM "booking_versions" v WHERE v.booking_id = b.id)
  `);
}

export async function getCompanyMarkupPercent(companyId: string): Promise<number> {
  await ensureBookingComponentTables();
  const [row] = await db
    .select({ markupPercent: companies.markupPercent })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  const n = Math.round(Number(row?.markupPercent ?? DEFAULT_COMPANY_MARKUP_PERCENT) || 0);
  return n >= 0 ? n : DEFAULT_COMPANY_MARKUP_PERCENT;
}

export function parseComponentType(raw: unknown): BookingComponentType | null {
  const value = String(raw ?? "").trim();
  return (BOOKING_COMPONENT_TYPES as readonly string[]).includes(value)
    ? (value as BookingComponentType)
    : null;
}

export function draftsFromCostStack(stack: {
  accommodation?: number | null;
  transport?: number | null;
  parkFees?: number | null;
  transfers?: number | null;
  activities?: number | null;
  other?: number | null;
}): BookingComponentDraft[] {
  const rows: Array<{ type: BookingComponentType; cost: number | null | undefined; label: string }> = [
    { type: "accommodation", cost: stack.accommodation, label: "Accommodation" },
    { type: "transport", cost: stack.transport, label: "Transport" },
    { type: "park_fee", cost: stack.parkFees, label: "Park fees" },
    { type: "transfer", cost: stack.transfers, label: "Transfers" },
    { type: "activity", cost: stack.activities, label: "Activities" },
    { type: "other", cost: stack.other, label: "Other costs" },
  ];
  return rows
    .filter((row) => Math.round(Number(row.cost) || 0) > 0)
    .map((row, index) => ({
      type: row.type,
      cost: Math.round(Number(row.cost)),
      sequence: index,
      config: { source: "cost_stack", label: row.label },
      label: row.label,
    }));
}

export function draftsFromInputs(rows: PricingComponentInput[]): BookingComponentDraft[] {
  return rows
    .map((row, index) => ({
      type: costStackKindToComponentType(String(row.type ?? "other")),
      cost: Math.round(Number(row.cost) || 0),
      sequence: row.sequence != null ? Math.round(Number(row.sequence)) : index,
      config: row.config ?? {},
      label: row.label ?? null,
    }))
    .filter((row) => row.cost > 0);
}

export function storedCostStackFromComponents(
  components: Array<{ type: string; cost: number; label?: string | null; config?: Record<string, unknown> | null }>,
  quote: ReturnType<typeof quoteBookingComponents>
): StoredCostStack {
  const byKind: Record<string, number> = {};
  for (const row of components) {
    const kind = componentTypeToCostStackKind(costStackKindToComponentType(row.type));
    byKind[kind] = (byKind[kind] ?? 0) + Math.round(Number(row.cost) || 0);
  }
  return buildStoredCostStack(
    {
      markupPercent: quote.markupPercent,
      accommodation: byKind.accommodation ?? null,
      transport: byKind.transport ?? null,
      parkFees: byKind.park_fees ?? null,
      transfers: byKind.transfers ?? null,
      activities: byKind.activities ?? null,
      other: byKind.other ?? null,
    },
    {
      currency: quote.currency,
      lines: quote.components.map((row) => ({
        kind: componentTypeToCostStackKind(row.type),
        amount: row.cost,
        label: row.label,
      })),
      costTotal: quote.costTotal,
      markupPercent: quote.markupPercent,
      markupAmount: quote.markupAmount,
      baseSellingPrice: quote.baseSellingPrice,
      sellingPrice: quote.sellingPrice,
      roundedUpBy: quote.roundedUpBy,
    }
  );
}

export async function listComponentsForBooking(bookingId: number): Promise<BookingComponentRow[]> {
  await ensureBookingComponentTables();
  return db
    .select()
    .from(bookingComponents)
    .where(eq(bookingComponents.bookingId, bookingId))
    .orderBy(asc(bookingComponents.sequence), asc(bookingComponents.id));
}

export async function listComponentsForBookings(
  bookingIds: number[]
): Promise<Map<number, BookingComponentRow[]>> {
  await ensureBookingComponentTables();
  const map = new Map<number, BookingComponentRow[]>();
  if (bookingIds.length === 0) return map;
  const rows = await db
    .select()
    .from(bookingComponents)
    .where(inArray(bookingComponents.bookingId, bookingIds))
    .orderBy(asc(bookingComponents.sequence), asc(bookingComponents.id));
  for (const row of rows) {
    const list = map.get(row.bookingId) ?? [];
    list.push(row);
    map.set(row.bookingId, list);
  }
  return map;
}

export async function replaceBookingComponents(
  bookingId: number,
  drafts: BookingComponentDraft[]
): Promise<BookingComponentRow[]> {
  await ensureBookingComponentTables();
  await db.delete(bookingComponents).where(eq(bookingComponents.bookingId, bookingId));
  const values = drafts
    .filter((row) => Math.round(Number(row.cost) || 0) > 0)
    .map((row, index) => ({
      bookingId,
      type: row.type,
      cost: Math.round(Number(row.cost)),
      sequence: row.sequence ?? index,
      config: {
        ...(row.config && typeof row.config === "object" ? row.config : {}),
        ...(row.label ? { label: row.label } : {}),
      },
    }));
  if (values.length === 0) return [];
  return db.insert(bookingComponents).values(values).returning();
}

export function quoteDrafts(
  drafts: BookingComponentDraft[],
  currency: CurrencyCode,
  markupPercent: number | null | undefined,
  travellerCounts?: Parameters<typeof PricingService.quoteComponents>[0]["travellerCounts"]
) {
  return PricingService.quoteComponents({
    components: drafts,
    currency,
    markupPercent,
    travellerCounts,
  });
}

export async function deleteComponentsForBooking(bookingId: number, companyId: string): Promise<void> {
  await ensureBookingComponentTables();
  const [row] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.companyId, companyId)))
    .limit(1);
  if (!row) return;
  await db.delete(bookingComponents).where(eq(bookingComponents.bookingId, bookingId));
}
