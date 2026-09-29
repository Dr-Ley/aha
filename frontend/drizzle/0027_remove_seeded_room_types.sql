-- Remove leftover "Seeded for dashboard" room types and keep only unique inventory types.

BEGIN;

UPDATE "rooms"
SET "room_type_id" = (
  SELECT id FROM "room_types"
  WHERE "company_id" = 'ewc' AND LOWER("name") = 'standard tent - double'
  LIMIT 1
)
WHERE "room_type_id" IN (
  SELECT id FROM "room_types"
  WHERE "company_id" = 'ewc'
    AND (
      "description" = 'Seeded for dashboard'
      OR LOWER("name") IN ('tented', 'standard')
    )
);

UPDATE "hotel_booking_rooms"
SET "room_id" = (
  SELECT id FROM "rooms" WHERE "company_id" = 'ewc' AND "code" = 'EWC-STD-D' LIMIT 1
)
WHERE "room_id" IN (
  SELECT id FROM "rooms" WHERE "company_id" = 'ewc' AND LOWER("code") = 'ewc-7'
);

UPDATE "hotel_bookings"
SET "room_id" = (
  SELECT id FROM "rooms" WHERE "company_id" = 'ewc' AND "code" = 'EWC-STD-D' LIMIT 1
)
WHERE "room_id" IN (
  SELECT id FROM "rooms" WHERE "company_id" = 'ewc' AND LOWER("code") = 'ewc-7'
);

UPDATE "rooms"
SET "is_active" = false
WHERE "company_id" = 'ewc'
  AND "code" NOT IN (
    'EWC-STD-S', 'EWC-STD-D', 'EWC-STD-T', 'EWC-STD-F',
    'EWC-SUP-S', 'EWC-SUP-D', 'EWC-SUP-T', 'EWC-SUP-F'
  );

DELETE FROM "room_types"
WHERE "company_id" = 'ewc'
  AND (
    "description" = 'Seeded for dashboard'
    OR LOWER("name") IN ('tented', 'standard')
  );

UPDATE "room_types"
SET "description" = CASE
  WHEN "company_id" = 'bth' AND LOWER("name") = 'deluxe' THEN 'Deluxe guest room'
  ELSE NULL
END
WHERE "description" = 'Seeded for dashboard';

COMMIT;
