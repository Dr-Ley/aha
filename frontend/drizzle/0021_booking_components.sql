-- Sprint 4: component-based bookings + immutable versions. Live booking id is unchanged
-- so payment/invoice FKs stay valid. Existing selling prices are not recalculated.

DO $$ BEGIN
  CREATE TYPE "booking_component_type" AS ENUM (
    'accommodation', 'transport', 'park_fee', 'activity', 'transfer', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "markup_percent" integer NOT NULL DEFAULT 20;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "current_version" integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "booking_components" (
  "id" serial PRIMARY KEY,
  "booking_id" integer NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "type" "booking_component_type" NOT NULL,
  "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "cost" integer NOT NULL DEFAULT 0,
  "sequence" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "booking_components_booking_id_idx"
  ON "booking_components" ("booking_id", "sequence");

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
);

CREATE UNIQUE INDEX IF NOT EXISTS "booking_versions_booking_version"
  ON "booking_versions" ("booking_id", "version");

CREATE INDEX IF NOT EXISTS "booking_versions_booking_current_idx"
  ON "booking_versions" ("booking_id") WHERE "is_current" = true;

-- Cost-stack bookings: one component row per positive kind (costs only; markup stays on snapshot).
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
  AND NOT EXISTS (
    SELECT 1 FROM "booking_components" c WHERE c.booking_id = b.id
  );

-- Package / manual / leftover rows: single component at the already-quoted selling price (markup 0)
-- so sum(cost)+markup equals the stored total.
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
WHERE NOT EXISTS (
  SELECT 1 FROM "booking_components" c WHERE c.booking_id = b.id
);

INSERT INTO "booking_versions" (
  "booking_id", "version", "is_current", "snapshot", "selling_price", "currency", "change_summary"
)
SELECT
  b.id,
  1,
  true,
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
WHERE NOT EXISTS (
  SELECT 1 FROM "booking_versions" v WHERE v.booking_id = b.id
);
