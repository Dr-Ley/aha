-- Sprint 3: company-scoped customers. Booking guest columns remain as a historical snapshot.

CREATE TABLE IF NOT EXISTS "customers" (
  "id" serial PRIMARY KEY,
  "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
  "user_id" integer REFERENCES "users"("id"),
  "first_name" varchar(100) NOT NULL,
  "last_name" varchar(100),
  "email" varchar(255) NOT NULL,
  "phone" varchar(50),
  "nationality" varchar(100),
  "country" varchar(100),
  "notes" text,
  "preferences" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "customers_company_email"
  ON "customers" ("company_id", "email");

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customer_id" integer;

DO $$ BEGIN
  ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_customer_id_customers_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "customers" (
  "company_id", "first_name", "last_name", "email", "phone", "nationality", "country"
)
SELECT DISTINCT ON (b.company_id, lower(b.email))
  b.company_id,
  COALESCE(NULLIF(b.first_name, ''), 'Guest'),
  b.last_name,
  lower(b.email),
  b.phone,
  b.country,
  b.country
FROM "bookings" b
WHERE b.email IS NOT NULL AND b.email <> ''
ON CONFLICT ("company_id", "email") DO NOTHING;

UPDATE "bookings" b
SET "customer_id" = c.id
FROM "customers" c
WHERE b.customer_id IS NULL
  AND c.company_id = b.company_id
  AND lower(b.email) = c.email;
