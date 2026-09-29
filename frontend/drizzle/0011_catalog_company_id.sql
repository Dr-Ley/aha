-- Tenant-scope catalog rows (Sprint 2). Existing tours/lodges belong to AHA.

ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "company_id" varchar(32);
UPDATE "tours" SET "company_id" = 'aha' WHERE "company_id" IS NULL OR "company_id" = '';
ALTER TABLE "tours" ALTER COLUMN "company_id" SET DEFAULT 'aha';
ALTER TABLE "tours" ALTER COLUMN "company_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "tours_company_id_idx" ON "tours" ("company_id");

ALTER TABLE "accommodations" ADD COLUMN IF NOT EXISTS "company_id" varchar(32);
UPDATE "accommodations" SET "company_id" = 'aha' WHERE "company_id" IS NULL OR "company_id" = '';
ALTER TABLE "accommodations" ALTER COLUMN "company_id" SET DEFAULT 'aha';
ALTER TABLE "accommodations" ALTER COLUMN "company_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "accommodations_company_id_idx" ON "accommodations" ("company_id");
