import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let ready = false;

/** Adds company_id to contact_submissions, likes, and testimonials; backfills AHA. */
export async function ensurePendingTenantColumns(): Promise<void> {
  if (ready) return;
  for (const table of ["contact_submissions", "likes", "testimonials"] as const) {
    await db.execute(sql.raw(`
      ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "company_id" varchar(32)
    `));
    await db.execute(sql.raw(`
      UPDATE "${table}" SET "company_id" = 'aha' WHERE "company_id" IS NULL OR "company_id" = ''
    `));
    await db.execute(sql.raw(`
      ALTER TABLE "${table}" ALTER COLUMN "company_id" SET DEFAULT 'aha'
    `));
    await db.execute(sql.raw(`
      ALTER TABLE "${table}" ALTER COLUMN "company_id" SET NOT NULL
    `));
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS "${table}_company_id_idx" ON "${table}" ("company_id")
    `));
  }
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "customers_company_created_idx"
    ON "customers" ("company_id", "created_at")
  `);
  ready = true;
}
