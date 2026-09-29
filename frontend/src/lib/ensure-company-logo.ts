import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let companyLogoEnsured = false;

/** Default same-origin logo paths for seeded tenants (DB remains source of truth). */
export const DEFAULT_COMPANY_LOGOS: Record<string, string> = {
  aha: "/AHA_logo.png",
};

/** Add `companies.logo` and backfill AHA if the column is still empty. */
export async function ensureCompanyLogoColumn(): Promise<void> {
  if (companyLogoEnsured) return;
  await db.execute(sql`
    ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "logo" varchar(1024)
  `);
  await db.execute(sql`
    ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "markup_percent" integer NOT NULL DEFAULT 20
  `);
  await db.execute(sql`
    UPDATE "companies"
    SET "logo" = ${DEFAULT_COMPANY_LOGOS.aha}
    WHERE "id" = 'aha' AND ("logo" IS NULL OR "logo" = '')
  `);
  companyLogoEnsured = true;
}
