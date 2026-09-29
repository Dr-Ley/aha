-- Hotel stay rate pricing source; safari booking product kind (E5.1).
ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "pricing_source" varchar(32) DEFAULT 'manual';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "booking_kind" varchar(32) DEFAULT 'customized_safari';
