-- Sprint 5: payment provider + idempotency, email delivery tracking.
-- Existing payment rows keep amounts/status; provider is backfilled from method.

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider" varchar(32) NOT NULL DEFAULT 'manual';
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(128);

UPDATE "payments"
SET "provider" = CASE
  WHEN lower(coalesce("method", '')) LIKE '%pesa%' THEN 'm-pesa'
  WHEN lower(coalesce("method", '')) = 'cash' THEN 'cash'
  WHEN lower(coalesce("method", '')) = 'bank' THEN 'bank'
  WHEN lower(coalesce("method", '')) = 'card' THEN 'card'
  ELSE 'manual'
END
WHERE "provider" IS NULL OR "provider" = 'manual';

CREATE UNIQUE INDEX IF NOT EXISTS "payments_company_idempotency"
  ON "payments" ("company_id", "idempotency_key");

DO $$ BEGIN
  CREATE TYPE "email_delivery_status" AS ENUM ('queued', 'sent', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
);

CREATE INDEX IF NOT EXISTS "email_deliveries_company_created_idx"
  ON "email_deliveries" ("company_id", "created_at");

CREATE INDEX IF NOT EXISTS "email_deliveries_company_template_idx"
  ON "email_deliveries" ("company_id", "template");
