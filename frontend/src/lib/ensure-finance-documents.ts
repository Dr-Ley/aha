import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let voucherToCompanyEnsured = false;
let invoicesEnsured = false;

export async function ensureVoucherToCompanyColumn(): Promise<void> {
  if (voucherToCompanyEnsured) return;
  await db.execute(sql`
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "voucher_to_company" varchar(255)
  `);
  voucherToCompanyEnsured = true;
}

export async function ensureInvoiceTables(): Promise<void> {
  if (invoicesEnsured) return;
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "invoice_status" AS ENUM ('draft', 'issued', 'partial', 'paid', 'void');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "invoices" (
      "id" serial PRIMARY KEY,
      "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
      "reference_type" "financial_reference_type" NOT NULL,
      "reference_id" integer NOT NULL,
      "invoice_number" varchar(32) NOT NULL,
      "status" "invoice_status" DEFAULT 'issued' NOT NULL,
      "currency" varchar(10) DEFAULT 'KES' NOT NULL,
      "subtotal" integer DEFAULT 0 NOT NULL,
      "total" integer DEFAULT 0 NOT NULL,
      "amount_paid" integer DEFAULT 0 NOT NULL,
      "balance" integer DEFAULT 0 NOT NULL,
      "notes" text,
      "issued_at" timestamp DEFAULT now(),
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "invoices_company_number"
      ON "invoices" ("company_id", "invoice_number")
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "invoices_company_source"
      ON "invoices" ("company_id", "reference_type", "reference_id")
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "invoice_items" (
      "id" serial PRIMARY KEY,
      "invoice_id" integer NOT NULL REFERENCES "invoices"("id"),
      "description" varchar(512) NOT NULL,
      "quantity" integer DEFAULT 1 NOT NULL,
      "unit_amount" integer DEFAULT 0 NOT NULL,
      "line_total" integer DEFAULT 0 NOT NULL,
      "sequence" integer DEFAULT 0 NOT NULL
    )
  `);
  invoicesEnsured = true;
}
