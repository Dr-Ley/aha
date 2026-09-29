import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let ensured = false;

/** Idempotent schema ensure for DBs that have not applied 0024 yet. */
export async function ensureSprint6Schema(): Promise<void> {
  if (ensured) return;

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "accommodation_provider_type" AS ENUM ('partner', 'tenant');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "vehicle_ownership" AS ENUM ('owned', 'outsourced');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "vehicle_status" AS ENUM ('available', 'assigned', 'maintenance', 'inactive');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "guide_type" AS ENUM ('employee', 'contractor');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "guide_status" AS ENUM ('active', 'inactive');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "destinations" (
      "id" serial PRIMARY KEY,
      "country" varchar(100) NOT NULL,
      "region" varchar(100),
      "name" varchar(255) NOT NULL,
      "slug" varchar(255) NOT NULL,
      "created_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "destinations_slug" ON "destinations" ("slug")
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "destinations_country_idx" ON "destinations" ("country")
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "attractions" (
      "id" serial PRIMARY KEY,
      "destination_id" integer NOT NULL REFERENCES "destinations"("id"),
      "name" varchar(255) NOT NULL,
      "type" varchar(50) NOT NULL,
      "duration" varchar(100),
      "best_time" varchar(255),
      "description" text,
      "created_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "attractions_destination_idx" ON "attractions" ("destination_id")
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "accommodation_providers" (
      "id" serial PRIMARY KEY,
      "name" varchar(255) NOT NULL,
      "contact" jsonb,
      "type" "accommodation_provider_type" NOT NULL,
      "company_id" varchar(32) REFERENCES "companies"("id"),
      "created_at" timestamp DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "properties" (
      "id" serial PRIMARY KEY,
      "provider_id" integer NOT NULL REFERENCES "accommodation_providers"("id"),
      "company_id" varchar(32) REFERENCES "companies"("id"),
      "destination_id" integer REFERENCES "destinations"("id"),
      "slug" varchar(255) NOT NULL,
      "name" varchar(255) NOT NULL,
      "location" varchar(255) NOT NULL,
      "country" varchar(50) NOT NULL,
      "amenities" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "description" text,
      "details" jsonb,
      "created_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "properties_company_slug" ON "properties" ("company_id", "slug")
  `);

  await db.execute(sql`
    ALTER TABLE "accommodations" ADD COLUMN IF NOT EXISTS "provider_id" integer REFERENCES "accommodation_providers"("id")
  `);
  await db.execute(sql`
    ALTER TABLE "accommodations" ADD COLUMN IF NOT EXISTS "property_id" integer REFERENCES "properties"("id")
  `);
  await db.execute(sql`
    ALTER TABLE "accommodations" ADD COLUMN IF NOT EXISTS "destination_id" integer REFERENCES "destinations"("id")
  `);

  await db.execute(sql`
    DO $$
    DECLARE
      conname text;
    BEGIN
      FOR conname IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'accommodations'
          AND con.contype = 'u'
          AND pg_get_constraintdef(con.oid) ILIKE '%slug%'
          AND pg_get_constraintdef(con.oid) NOT ILIKE '%company_id%'
      LOOP
        EXECUTE format('ALTER TABLE "accommodations" DROP CONSTRAINT %I', conname);
      END LOOP;
    END $$
  `);
  await db.execute(sql`DROP INDEX IF EXISTS "accommodations_slug_unique"`);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "accommodations_company_slug"
    ON "accommodations" ("company_id", "slug")
  `);

  await db.execute(sql`
    ALTER TABLE "room_types" ADD COLUMN IF NOT EXISTS "property_id" integer REFERENCES "properties"("id")
  `);
  await db.execute(sql`
    ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "property_id" integer REFERENCES "properties"("id")
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "vehicle_providers" (
      "id" serial PRIMARY KEY,
      "name" varchar(255) NOT NULL,
      "contact" jsonb,
      "created_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "vehicles" (
      "id" serial PRIMARY KEY,
      "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
      "ownership" "vehicle_ownership" NOT NULL,
      "type" varchar(50) NOT NULL,
      "capacity" integer NOT NULL,
      "registration" varchar(32) NOT NULL,
      "status" "vehicle_status" NOT NULL DEFAULT 'available',
      "provider_id" integer REFERENCES "vehicle_providers"("id"),
      "created_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "vehicles_company_registration"
    ON "vehicles" ("company_id", "registration")
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "vehicles_company_status_idx"
    ON "vehicles" ("company_id", "status")
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "guides" (
      "id" serial PRIMARY KEY,
      "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
      "name" varchar(255) NOT NULL,
      "type" "guide_type" NOT NULL,
      "languages" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "certifications" jsonb,
      "status" "guide_status" NOT NULL DEFAULT 'active',
      "created_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "guides_company_status_idx"
    ON "guides" ("company_id", "status")
  `);

  ensured = true;
}
