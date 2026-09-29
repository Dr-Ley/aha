-- Company letterhead logo: image URL or same-origin path (Sprint 5).
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "logo" varchar(1024);

UPDATE "companies"
SET "logo" = '/AHA_logo.png'
WHERE "id" = 'aha' AND ("logo" IS NULL OR "logo" = '');
