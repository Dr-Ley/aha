-- Stay/booking party: customer is optional; extra people live on the transaction as names + age counts.

ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "customer_id" integer;
ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "primary_guest_name" varchar(255);
ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "primary_guest_phone" varchar(50);
ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "primary_guest_email" varchar(255);
ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "additional_occupants" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "adults" integer NOT NULL DEFAULT 1;
ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "children" integer NOT NULL DEFAULT 0;
ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "infants" integer NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE "hotel_bookings"
    ADD CONSTRAINT "hotel_bookings_customer_id_customers_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

UPDATE "hotel_bookings" hb
SET
  "customer_id" = COALESCE(hb.customer_id, g.customer_id),
  "primary_guest_name" = COALESCE(NULLIF(hb.primary_guest_name, ''), g.full_name),
  "primary_guest_phone" = COALESCE(hb.primary_guest_phone, g.phone),
  "primary_guest_email" = COALESCE(hb.primary_guest_email, g.email)
FROM "hotel_booking_guests" g
WHERE g.hotel_booking_id = hb.id
  AND g.is_primary = true;

UPDATE "hotel_bookings" hb
SET "additional_occupants" = COALESCE((
  SELECT jsonb_agg(trim(g.full_name) ORDER BY g.id)
  FROM "hotel_booking_guests" g
  WHERE g.hotel_booking_id = hb.id
    AND g.is_primary = false
    AND trim(g.full_name) <> ''
), hb.additional_occupants);

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "adults" integer NOT NULL DEFAULT 1;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "children" integer NOT NULL DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "infants" integer NOT NULL DEFAULT 0;

UPDATE "bookings"
SET "adults" = GREATEST("guests", 1)
WHERE "adults" = 1 AND "guests" > 1 AND "children" = 0 AND "infants" = 0;

UPDATE "hotel_bookings"
SET "adults" = GREATEST(
  1,
  1 + COALESCE(jsonb_array_length("additional_occupants"), 0)
)
WHERE "children" = 0 AND "infants" = 0 AND "adults" = 1
  AND COALESCE(jsonb_array_length("additional_occupants"), 0) > 0;
