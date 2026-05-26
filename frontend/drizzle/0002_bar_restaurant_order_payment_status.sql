-- Bar & restaurant orders: migrate lifecycle status enum to payment-style varchar.
-- Run once against Postgres before or with `drizzle-kit push` after schema change.

ALTER TABLE bar_orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE bar_orders
  ALTER COLUMN status TYPE varchar(32)
  USING (
    CASE status::text
      WHEN 'closed' THEN 'paid'
      WHEN 'served' THEN 'partially_paid'
      WHEN 'ready' THEN 'partially_paid'
      WHEN 'preparing' THEN 'unpaid'
      WHEN 'submitted' THEN 'unpaid'
      WHEN 'draft' THEN 'unpaid'
      WHEN 'cancelled' THEN 'unpaid'
      ELSE 'unpaid'
    END
  );
ALTER TABLE bar_orders ALTER COLUMN status SET DEFAULT 'unpaid';

ALTER TABLE restaurant_orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE restaurant_orders
  ALTER COLUMN status TYPE varchar(32)
  USING (
    CASE status::text
      WHEN 'closed' THEN 'paid'
      WHEN 'served' THEN 'partially_paid'
      WHEN 'ready' THEN 'partially_paid'
      WHEN 'preparing' THEN 'unpaid'
      WHEN 'submitted' THEN 'unpaid'
      WHEN 'draft' THEN 'unpaid'
      WHEN 'cancelled' THEN 'unpaid'
      ELSE 'unpaid'
    END
  );
ALTER TABLE restaurant_orders ALTER COLUMN status SET DEFAULT 'unpaid';

DROP TYPE IF EXISTS bar_order_status;
DROP TYPE IF EXISTS restaurant_order_status;