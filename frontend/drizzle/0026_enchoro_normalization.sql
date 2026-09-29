-- Enzi / AHA: Enchoro is one physical property owned by EWC.
-- Historical hotel stays keep their room_id (composite rooms are deactivated, not deleted).
-- Destination 33 does not exist in this database — Lake Nakuru stays on destination 3.

BEGIN;

UPDATE "properties" SET "provider_id" = 1 WHERE "provider_id" = 4;
UPDATE "accommodations" SET "provider_id" = 1 WHERE "provider_id" = 4;

UPDATE "likes" SET "accommodation_id" = 11 WHERE "accommodation_id" = 178;

DELETE FROM "accommodations"
WHERE "id" = 178
   OR ("property_id" = 1 AND "slug" = 'enchoro-wildlife-camp' AND "id" <> 11)
   OR ("property_id" = 5 AND "slug" = 'enchoro-wildlife-camp');

UPDATE "room_types" SET "property_id" = 1 WHERE "property_id" = 5;
UPDATE "rooms" SET "property_id" = 1 WHERE "property_id" = 5;
UPDATE "accommodations"
SET "property_id" = 1, "provider_id" = 1
WHERE "property_id" = 5;

DELETE FROM "properties" WHERE "id" = 5;

UPDATE "properties"
SET "provider_id" = 1, "company_id" = 'ewc'
WHERE "id" = 1;

UPDATE "accommodations"
SET
  "company_id" = 'ewc',
  "provider_id" = 1,
  "property_id" = 1,
  "destination_id" = 1,
  "slug" = 'enchoro-wildlife-camp',
  "name" = 'Enchoro Wildlife Camp'
WHERE "id" = 11;

DELETE FROM "room_types"
WHERE "property_id" = 1
  AND "company_id" = 'aha';

DELETE FROM "accommodation_providers" WHERE "id" = 4;

INSERT INTO "room_types"
("company_id", "name", "description", "max_occupancy", "base_rate", "created_at", "property_id")
SELECT
  'ewc',
  v.name,
  v.description,
  v.max_occupancy,
  v.base_rate,
  CURRENT_TIMESTAMP,
  1
FROM (
  VALUES
    ('Standard Tent - Single', 'Standard canvas tent configured for single occupancy.', 1, 70),
    ('Standard Tent - Double', 'Standard canvas tent configured for double occupancy.', 2, 70),
    ('Standard Tent - Triple', 'Standard canvas tent configured for triple occupancy.', 3, NULL),
    ('Standard Tent - Family', 'Standard canvas tent configured for family occupancy.', 4, 220),
    ('Superior Tent - Single', 'Superior en-suite canvas tent configured for single occupancy.', 1, 105),
    ('Superior Tent - Double', 'Superior en-suite canvas tent configured for double occupancy.', 2, 105),
    ('Superior Tent - Triple', 'Superior en-suite canvas tent configured for triple occupancy.', 3, NULL),
    ('Superior Tent - Family', 'Superior en-suite canvas tent configured for family occupancy.', 4, NULL)
) AS v(name, description, max_occupancy, base_rate)
WHERE NOT EXISTS (
  SELECT 1
  FROM "room_types" rt
  WHERE rt."property_id" = 1
    AND rt."company_id" = 'ewc'
    AND LOWER(rt."name") = LOWER(v.name)
);

INSERT INTO "rooms"
("company_id", "room_type_id", "property_id", "code", "name", "is_active", "created_at")
SELECT
  'ewc',
  rt.id,
  1,
  v.code,
  v.name,
  true,
  CURRENT_TIMESTAMP
FROM (
  VALUES
    ('Standard Tent - Single', 'EWC-STD-S', 'Standard Tent - Single'),
    ('Standard Tent - Double', 'EWC-STD-D', 'Standard Tent - Double'),
    ('Standard Tent - Triple', 'EWC-STD-T', 'Standard Tent - Triple'),
    ('Standard Tent - Family', 'EWC-STD-F', 'Standard Tent - Family'),
    ('Superior Tent - Single', 'EWC-SUP-S', 'Superior Tent - Single'),
    ('Superior Tent - Double', 'EWC-SUP-D', 'Superior Tent - Double'),
    ('Superior Tent - Triple', 'EWC-SUP-T', 'Superior Tent - Triple'),
    ('Superior Tent - Family', 'EWC-SUP-F', 'Superior Tent - Family')
) AS v(type_name, code, name)
JOIN "room_types" rt
  ON rt."property_id" = 1
 AND rt."company_id" = 'ewc'
 AND LOWER(rt."name") = LOWER(v.type_name)
WHERE NOT EXISTS (
  SELECT 1 FROM "rooms" r
  WHERE r."property_id" = 1 AND LOWER(r."code") = LOWER(v.code)
);

UPDATE "rooms"
SET "is_active" = false
WHERE "property_id" = 1
  AND "company_id" = 'ewc'
  AND "code" NOT IN (
    'EWC-7',
    'EWC-STD-S', 'EWC-STD-D', 'EWC-STD-T', 'EWC-STD-F',
    'EWC-SUP-S', 'EWC-SUP-D', 'EWC-SUP-T', 'EWC-SUP-F'
  );

UPDATE "rooms"
SET "company_id" = 'ewc', "property_id" = 1, "is_active" = true
WHERE "id" = 2 AND "property_id" = 1;

UPDATE "attractions" SET
  "name" = 'Maasai Mara National Reserve',
  "type" = 'park',
  "duration" = 'Full day',
  "best_time" = 'Year-round; peak July–October'
WHERE "id" = 14;

UPDATE "attractions" SET
  "name" = 'Great Wildebeest Migration',
  "type" = 'natural_phenomenon',
  "duration" = 'Seasonal',
  "best_time" = 'July–September'
WHERE "id" = 15;

UPDATE "attractions" SET
  "name" = 'Maasai Village (Manyatta) Visit',
  "type" = 'cultural',
  "duration" = 'Half day (optional)',
  "best_time" = 'Year-round'
WHERE "id" = 16;

UPDATE "attractions" SET
  "name" = 'Hot Air Balloon Safari',
  "type" = 'activity',
  "duration" = 'Early morning (optional)',
  "best_time" = 'Year-round'
WHERE "id" = 17;

UPDATE "attractions" SET
  "name" = 'Guided Nature Walk',
  "type" = 'activity',
  "duration" = '1–2 hours (optional)',
  "best_time" = 'Year-round'
WHERE "id" = 18;

UPDATE "activity_offerings" SET "attraction_id" = 16 WHERE "attraction_id" = 21;
UPDATE "activity_offerings" SET "attraction_id" = 17 WHERE "attraction_id" = 22;
UPDATE "activity_offerings" SET "attraction_id" = 18 WHERE "attraction_id" = 23;

DELETE FROM "attractions" WHERE "id" IN (19, 20, 21, 22, 23);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_room_types_property_company_name"
ON "room_types" ("property_id", "company_id", LOWER("name"));

CREATE UNIQUE INDEX IF NOT EXISTS "uq_rooms_property_code"
ON "rooms" ("property_id", LOWER("code"));

CREATE UNIQUE INDEX IF NOT EXISTS "uq_properties_slug"
ON "properties" (LOWER("slug"));

CREATE UNIQUE INDEX IF NOT EXISTS "uq_accommodation_providers_name"
ON "accommodation_providers" (LOWER("name"));

CREATE TABLE IF NOT EXISTS "hotel_booking_rooms" (
  "id" serial PRIMARY KEY,
  "hotel_booking_id" integer NOT NULL REFERENCES "hotel_bookings"("id") ON DELETE CASCADE,
  "room_id" integer NOT NULL REFERENCES "rooms"("id"),
  "quantity" integer NOT NULL DEFAULT 1,
  "nightly_rate" integer,
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "hotel_booking_rooms_stay_room"
ON "hotel_booking_rooms" ("hotel_booking_id", "room_id");

INSERT INTO "hotel_booking_rooms" ("hotel_booking_id", "room_id", "quantity")
SELECT hb.id, hb.room_id, 1
FROM "hotel_bookings" hb
WHERE NOT EXISTS (
  SELECT 1 FROM "hotel_booking_rooms" x
  WHERE x."hotel_booking_id" = hb.id AND x."room_id" = hb.room_id
);

SELECT setval(pg_get_serial_sequence('"accommodation_providers"', 'id'), COALESCE((SELECT MAX("id") FROM "accommodation_providers"), 1), true);
SELECT setval(pg_get_serial_sequence('"properties"', 'id'), COALESCE((SELECT MAX("id") FROM "properties"), 1), true);
SELECT setval(pg_get_serial_sequence('"room_types"', 'id'), COALESCE((SELECT MAX("id") FROM "room_types"), 1), true);
SELECT setval(pg_get_serial_sequence('"rooms"', 'id'), COALESCE((SELECT MAX("id") FROM "rooms"), 1), true);
SELECT setval(pg_get_serial_sequence('"attractions"', 'id'), COALESCE((SELECT MAX("id") FROM "attractions"), 1), true);
SELECT setval(pg_get_serial_sequence('"accommodations"', 'id'), COALESCE((SELECT MAX("id") FROM "accommodations"), 1), true);

COMMIT;
