import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let ensured = false;

/** Idempotent schema ensure for DBs that have not applied 0023 yet. */
export async function ensureSprint5Schema(): Promise<void> {
  if (ensured) return;
  await db.execute(sql`
    ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider" varchar(32) NOT NULL DEFAULT 'manual'
  `);
  await db.execute(sql`
    ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(128)
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "payments_company_idempotency"
    ON "payments" ("company_id", "idempotency_key")
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "email_delivery_status" AS ENUM ('queued', 'sent', 'failed', 'skipped');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "email_deliveries" (
      "id" serial PRIMARY KEY,
      "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
      "template" varchar(64) NOT NULL,
      "recipient" varchar(255) NOT NULL,
      "subject" varchar(512) NOT NULL,
      "status" "email_delivery_status" NOT NULL DEFAULT 'queued',
      "provider_message_id" varchar(128),
      "error" text,
      "payload" jsonb,
      "created_at" timestamp DEFAULT now(),
      "sent_at" timestamp
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "email_deliveries_company_created_idx"
    ON "email_deliveries" ("company_id", "created_at")
  `);
  ensured = true;
}
