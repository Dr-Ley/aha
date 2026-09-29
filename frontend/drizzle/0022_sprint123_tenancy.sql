-- Sprint 2/3: tenant-scope remaining catalogs + customers list index.

ALTER TABLE "contact_submissions" ADD COLUMN IF NOT EXISTS "company_id" varchar(32);
UPDATE "contact_submissions" SET "company_id" = 'aha' WHERE "company_id" IS NULL OR "company_id" = '';
ALTER TABLE "contact_submissions" ALTER COLUMN "company_id" SET DEFAULT 'aha';
DO $$ BEGIN
  ALTER TABLE "contact_submissions"
    ADD CONSTRAINT "contact_submissions_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE "contact_submissions" ALTER COLUMN "company_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "contact_submissions_company_created_idx"
  ON "contact_submissions" ("company_id", "created_at");
CREATE INDEX IF NOT EXISTS "contact_submissions_company_status_idx"
  ON "contact_submissions" ("company_id", "status");

ALTER TABLE "likes" ADD COLUMN IF NOT EXISTS "company_id" varchar(32);
UPDATE "likes" SET "company_id" = 'aha' WHERE "company_id" IS NULL OR "company_id" = '';
UPDATE "likes" l SET "company_id" = t.company_id FROM "tours" t WHERE l.tour_id = t.id AND t.company_id IS NOT NULL;
UPDATE "likes" l SET "company_id" = a.company_id FROM "accommodations" a WHERE l.accommodation_id = a.id AND a.company_id IS NOT NULL;
ALTER TABLE "likes" ALTER COLUMN "company_id" SET DEFAULT 'aha';
DO $$ BEGIN
  ALTER TABLE "likes"
    ADD CONSTRAINT "likes_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE "likes" ALTER COLUMN "company_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "likes_company_id_idx" ON "likes" ("company_id");

ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "company_id" varchar(32);
UPDATE "testimonials" tm
SET "company_id" = COALESCE(t.company_id, 'aha')
FROM "tours" t
WHERE tm.tour_id = t.id AND (tm.company_id IS NULL OR tm.company_id = '');
UPDATE "testimonials" SET "company_id" = 'aha' WHERE "company_id" IS NULL OR "company_id" = '';
ALTER TABLE "testimonials" ALTER COLUMN "company_id" SET DEFAULT 'aha';
DO $$ BEGIN
  ALTER TABLE "testimonials"
    ADD CONSTRAINT "testimonials_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE "testimonials" ALTER COLUMN "company_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "testimonials_company_created_idx"
  ON "testimonials" ("company_id", "created_at");

CREATE INDEX IF NOT EXISTS "customers_company_created_idx"
  ON "customers" ("company_id", "created_at");
