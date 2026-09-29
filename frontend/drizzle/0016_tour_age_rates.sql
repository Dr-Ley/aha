-- Optional per-age USD rates for predefined safari packages.
-- Null child_price uses the adult price. Null infant_price is complimentary.

ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "child_price" integer;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "infant_price" integer;
