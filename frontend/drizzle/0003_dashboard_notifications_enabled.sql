ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dashboard_notifications_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'KES';
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending';
