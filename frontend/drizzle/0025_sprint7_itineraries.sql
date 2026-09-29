-- Sprint 7: AI itinerary engine + priced tourism catalogs + destination SEO fields.

ALTER TABLE "destinations" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "destinations" ADD COLUMN IF NOT EXISTS "image" varchar(1024);
ALTER TABLE "destinations" ADD COLUMN IF NOT EXISTS "seo_title" varchar(255);
ALTER TABLE "destinations" ADD COLUMN IF NOT EXISTS "meta_description" varchar(320);
ALTER TABLE "destinations" ADD COLUMN IF NOT EXISTS "canonical_path" varchar(255);
ALTER TABLE "destinations" ADD COLUMN IF NOT EXISTS "published" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "park_fee_rates" (
  "id" serial PRIMARY KEY,
  "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
  "destination_id" integer NOT NULL REFERENCES "destinations"("id"),
  "name" varchar(255) NOT NULL,
  "adult_usd" integer NOT NULL,
  "child_usd" integer NOT NULL,
  "infant_usd" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "park_fee_rates_company_destination"
  ON "park_fee_rates" ("company_id", "destination_id");
CREATE INDEX IF NOT EXISTS "park_fee_rates_company_idx" ON "park_fee_rates" ("company_id");

CREATE TABLE IF NOT EXISTS "activity_offerings" (
  "id" serial PRIMARY KEY,
  "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
  "destination_id" integer NOT NULL REFERENCES "destinations"("id"),
  "attraction_id" integer REFERENCES "attractions"("id"),
  "name" varchar(255) NOT NULL,
  "adult_usd" integer NOT NULL DEFAULT 0,
  "child_usd" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "activity_offerings_company_destination_idx"
  ON "activity_offerings" ("company_id", "destination_id");

CREATE TABLE IF NOT EXISTS "transfer_options" (
  "id" serial PRIMARY KEY,
  "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
  "name" varchar(255) NOT NULL,
  "from_label" varchar(255) NOT NULL,
  "to_label" varchar(255) NOT NULL,
  "destination_id" integer REFERENCES "destinations"("id"),
  "amount_usd" integer NOT NULL,
  "vehicle_type" varchar(50),
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "transfer_options_company_idx" ON "transfer_options" ("company_id");

CREATE TABLE IF NOT EXISTS "transport_options" (
  "id" serial PRIMARY KEY,
  "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
  "name" varchar(255) NOT NULL,
  "vehicle_type" varchar(50) NOT NULL,
  "daily_rate_usd" integer NOT NULL,
  "capacity" integer NOT NULL DEFAULT 6,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "transport_options_company_idx" ON "transport_options" ("company_id");

CREATE TABLE IF NOT EXISTS "itineraries" (
  "id" serial PRIMARY KEY,
  "public_token" varchar(64) NOT NULL,
  "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
  "customer_id" integer REFERENCES "customers"("id"),
  "user_id" integer REFERENCES "users"("id"),
  "booking_id" integer REFERENCES "bookings"("id"),
  "status" varchar(32) NOT NULL DEFAULT 'draft',
  "country" varchar(100),
  "start_date" varchar(50),
  "end_date" varchar(50),
  "duration_days" integer,
  "adults" integer NOT NULL DEFAULT 1,
  "children" integer NOT NULL DEFAULT 0,
  "infants" integer NOT NULL DEFAULT 0,
  "child_ages" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "requirements" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "title" varchar(255),
  "summary" text,
  "plan" jsonb,
  "quote" jsonb,
  "currency" varchar(10) NOT NULL DEFAULT 'USD',
  "cost_total" integer,
  "markup_percent" integer,
  "selling_price" integer,
  "current_version" integer NOT NULL DEFAULT 1,
  "guest_email" varchar(255),
  "guest_name" varchar(255),
  "guest_phone" varchar(50),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "itineraries_public_token" ON "itineraries" ("public_token");
CREATE INDEX IF NOT EXISTS "itineraries_company_created_idx" ON "itineraries" ("company_id", "created_at");
CREATE INDEX IF NOT EXISTS "itineraries_company_status_idx" ON "itineraries" ("company_id", "status");

CREATE TABLE IF NOT EXISTS "itinerary_components" (
  "id" serial PRIMARY KEY,
  "itinerary_id" integer NOT NULL REFERENCES "itineraries"("id") ON DELETE CASCADE,
  "type" "booking_component_type" NOT NULL,
  "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "cost" integer NOT NULL DEFAULT 0,
  "sequence" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "itinerary_components_itinerary_idx"
  ON "itinerary_components" ("itinerary_id", "sequence");

CREATE TABLE IF NOT EXISTS "itinerary_versions" (
  "id" serial PRIMARY KEY,
  "itinerary_id" integer NOT NULL REFERENCES "itineraries"("id") ON DELETE CASCADE,
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
CREATE UNIQUE INDEX IF NOT EXISTS "itinerary_versions_itinerary_version"
  ON "itinerary_versions" ("itinerary_id", "version");

CREATE TABLE IF NOT EXISTS "itinerary_generation_logs" (
  "id" serial PRIMARY KEY,
  "itinerary_id" integer NOT NULL REFERENCES "itineraries"("id") ON DELETE CASCADE,
  "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
  "request_id" varchar(64) NOT NULL,
  "provider" varchar(64) NOT NULL,
  "model" varchar(128),
  "status" varchar(32) NOT NULL,
  "validation_status" varchar(32),
  "failure_reason" text,
  "duration_ms" integer,
  "retry_count" integer NOT NULL DEFAULT 0,
  "estimated_cost_usd" real,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "itinerary_generation_logs_itinerary_idx"
  ON "itinerary_generation_logs" ("itinerary_id", "created_at");
CREATE INDEX IF NOT EXISTS "itinerary_generation_logs_company_idx"
  ON "itinerary_generation_logs" ("company_id", "created_at");
