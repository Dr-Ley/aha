-- Sprint 3: email is the automatic identity key, not a required customer field.
-- PostgreSQL unique (company_id, email) still allows multiple NULL emails.

ALTER TABLE "customers" ALTER COLUMN "email" DROP NOT NULL;
