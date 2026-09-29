-- Enchoro Wildlife Camp STO rates 2026: occupancy cards, park fees, safari vehicle.

CREATE TABLE IF NOT EXISTS "room_type_rates" (
  "id" serial PRIMARY KEY,
  "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
  "room_type_id" integer REFERENCES "room_types"("id"),
  "occupancy" varchar(32) NOT NULL,
  "season" varchar(16) NOT NULL,
  "guest_category" varchar(32) NOT NULL,
  "currency" varchar(10) NOT NULL,
  "amount" integer NOT NULL,
  "year" integer NOT NULL DEFAULT 2026,
  "meal_basis" varchar(32) NOT NULL DEFAULT 'full_board',
  "notes" text,
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "room_type_rates_company_card"
ON "room_type_rates" ("company_id", "occupancy", "season", "guest_category", "year");

CREATE INDEX IF NOT EXISTS "room_type_rates_company_idx" ON "room_type_rates" ("company_id");

ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "guest_category" varchar(32) DEFAULT 'resident';
ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "currency" varchar(10) DEFAULT 'KES' NOT NULL;

ALTER TABLE "park_fee_rates" ADD COLUMN IF NOT EXISTS "adult_usd_low" integer;
ALTER TABLE "park_fee_rates" ADD COLUMN IF NOT EXISTS "child_usd_low" integer;
ALTER TABLE "park_fee_rates" ADD COLUMN IF NOT EXISTS "adult_kes" integer;
ALTER TABLE "park_fee_rates" ADD COLUMN IF NOT EXISTS "child_kes" integer;
ALTER TABLE "park_fee_rates" ADD COLUMN IF NOT EXISTS "infant_kes" integer NOT NULL DEFAULT 0;

UPDATE "park_fee_rates"
SET "adult_usd_low" = COALESCE("adult_usd_low", "adult_usd"),
    "child_usd_low" = COALESCE("child_usd_low", "child_usd");
