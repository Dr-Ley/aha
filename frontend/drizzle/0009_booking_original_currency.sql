ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "original_amount" integer;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "original_currency" varchar(10) DEFAULT 'KES' NOT NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "exchange_rate_to_kes" real DEFAULT 1 NOT NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "exchange_rate_date" date;

-- Existing dashboard rows already store KES in total_price.
UPDATE "bookings"
SET
  "original_amount" = COALESCE("original_amount", "total_price"),
  "original_currency" = COALESCE("original_currency", 'KES'),
  "exchange_rate_to_kes" = COALESCE("exchange_rate_to_kes", 1),
  "exchange_rate_date" = COALESCE("exchange_rate_date", CURRENT_DATE)
WHERE "original_amount" IS NULL;
