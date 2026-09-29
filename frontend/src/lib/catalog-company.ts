import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let catalogCompanyEnsured = false;
let tourAgeRatesEnsured = false;

/** Optional per-age USD rates on predefined safari packages. */
export async function ensureTourAgeRateColumns(): Promise<void> {
  if (tourAgeRatesEnsured) return;
  await db.execute(sql`
    ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "child_price" integer
  `);
  await db.execute(sql`
    ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "infant_price" integer
  `);
  tourAgeRatesEnsured = true;
}

/** Add `company_id` to tours and accommodations; backfill existing rows to AHA. */
export async function ensureCatalogCompanyColumns(): Promise<void> {
  await ensureTourAgeRateColumns();
  if (catalogCompanyEnsured) return;
  for (const table of ["tours", "accommodations"] as const) {
    await db.execute(sql.raw(`
      ALTER TABLE "${table}"
      ADD COLUMN IF NOT EXISTS "company_id" varchar(32)
    `));
    await db.execute(sql.raw(`
      UPDATE "${table}" SET "company_id" = 'aha'
      WHERE "company_id" IS NULL OR "company_id" = ''
    `));
    await db.execute(sql.raw(`
      ALTER TABLE "${table}"
      ALTER COLUMN "company_id" SET DEFAULT 'aha'
    `));
    await db.execute(sql.raw(`
      ALTER TABLE "${table}"
      ALTER COLUMN "company_id" SET NOT NULL
    `));
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS "${table}_company_id_idx"
      ON "${table}" ("company_id")
    `));
  }
  catalogCompanyEnsured = true;
}
