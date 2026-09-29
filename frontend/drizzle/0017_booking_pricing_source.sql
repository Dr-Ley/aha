-- Persist how a safari booking was priced, and the cost-stack breakdown when used.
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "pricing_source" varchar(32) DEFAULT 'manual';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cost_stack" jsonb;
