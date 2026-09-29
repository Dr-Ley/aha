-- Per-company membership (Sprint 2). Global users.role is kept during the transition.

DO $$ BEGIN
  CREATE TYPE "membership_role" AS ENUM ('owner', 'admin', 'sales', 'operations', 'guide', 'finance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "membership_status" AS ENUM ('active', 'invited', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "company_memberships" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
  "role" "membership_role" NOT NULL,
  "status" "membership_status" NOT NULL DEFAULT 'active',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "company_memberships_user_company"
  ON "company_memberships" ("user_id", "company_id");
