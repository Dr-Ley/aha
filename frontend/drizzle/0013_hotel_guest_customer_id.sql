-- Sprint 3: hotel stay guests link to the same per-company customer as safari bookings.

ALTER TABLE "hotel_booking_guests" ADD COLUMN IF NOT EXISTS "customer_id" integer;

DO $$ BEGIN
  ALTER TABLE "hotel_booking_guests"
    ADD CONSTRAINT "hotel_booking_guests_customer_id_customers_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "customers" (
  "company_id", "first_name", "last_name", "email", "phone", "nationality", "country"
)
SELECT DISTINCT ON (hb.company_id, lower(g.email))
  hb.company_id,
  COALESCE(NULLIF(split_part(trim(g.full_name), ' ', 1), ''), 'Guest'),
  NULLIF(
    CASE
      WHEN position(' ' in trim(g.full_name)) > 0
      THEN trim(substring(trim(g.full_name) from position(' ' in trim(g.full_name)) + 1))
      ELSE NULL
    END,
    ''
  ),
  lower(g.email),
  g.phone,
  g.country,
  g.country
FROM "hotel_booking_guests" g
INNER JOIN "hotel_bookings" hb ON hb.id = g.hotel_booking_id
WHERE g.email IS NOT NULL AND g.email <> '' AND position('@' in g.email) > 0
ON CONFLICT ("company_id", "email") DO NOTHING;

UPDATE "hotel_booking_guests" g
SET "customer_id" = c.id
FROM "hotel_bookings" hb, "customers" c
WHERE g.customer_id IS NULL
  AND hb.id = g.hotel_booking_id
  AND c.company_id = hb.company_id
  AND g.email IS NOT NULL
  AND lower(g.email) = c.email;

UPDATE "customers" c
SET "last_name" = NULLIF(
  trim(substring(trim(g.full_name) from position(' ' in trim(g.full_name)) + 1)),
  ''
)
FROM "hotel_booking_guests" g
INNER JOIN "hotel_bookings" hb ON hb.id = g.hotel_booking_id
WHERE g.customer_id = c.id
  AND hb.company_id = c.company_id
  AND c.last_name = g.full_name;
