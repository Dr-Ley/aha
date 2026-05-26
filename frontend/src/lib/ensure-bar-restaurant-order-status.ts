import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

let ensuredPromise: Promise<void> | null = null;

/**
 * Idempotent: converts legacy enum columns to varchar(unpaid|partially_paid|paid).
 * Safe if columns are already varchar. Uses one statement per query (Neon HTTP).
 */
export function ensureBarRestaurantOrderStatusVarchar(): Promise<void> {
  if (!ensuredPromise) {
    ensuredPromise = runMigration().catch((e) => {
      ensuredPromise = null;
      throw e;
    });
  }
  return ensuredPromise;
}

function firstDataType(result: unknown): string | undefined {
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows: { dt?: string }[] }).rows;
    return r[0]?.dt;
  }
  if (Array.isArray(result) && result[0] && typeof result[0] === "object" && "dt" in result[0]) {
    return (result[0] as { dt: string }).dt;
  }
  return undefined;
}

async function runMigration(): Promise<void> {
  const check = await db.execute(sql`
    SELECT data_type::text AS dt
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bar_orders'
      AND column_name = 'status'
  `);
  const dt = firstDataType(check);
  if (dt === "character varying" || dt === "text") {
    return;
  }
  if (!dt) {
    return;
  }

  const barUsing = `CASE status::text
      WHEN 'closed' THEN 'paid'
      WHEN 'served' THEN 'partially_paid'
      WHEN 'ready' THEN 'partially_paid'
      WHEN 'preparing' THEN 'unpaid'
      WHEN 'submitted' THEN 'unpaid'
      WHEN 'draft' THEN 'unpaid'
      WHEN 'cancelled' THEN 'unpaid'
      ELSE 'unpaid' END`;

  const restaurantUsing = barUsing;

  await db.execute(sql.raw(`ALTER TABLE bar_orders ALTER COLUMN status DROP DEFAULT`));
  await db.execute(
    sql.raw(
      `ALTER TABLE bar_orders ALTER COLUMN status TYPE varchar(32) USING (${barUsing})`
    )
  );
  await db.execute(sql.raw(`ALTER TABLE bar_orders ALTER COLUMN status SET DEFAULT 'unpaid'`));

  await db.execute(sql.raw(`ALTER TABLE restaurant_orders ALTER COLUMN status DROP DEFAULT`));
  await db.execute(
    sql.raw(
      `ALTER TABLE restaurant_orders ALTER COLUMN status TYPE varchar(32) USING (${restaurantUsing})`
    )
  );
  await db.execute(
    sql.raw(`ALTER TABLE restaurant_orders ALTER COLUMN status SET DEFAULT 'unpaid'`)
  );

  try {
    await db.execute(sql`DROP TYPE IF EXISTS bar_order_status`);
  } catch {
    /* may already be dropped or still referenced in edge cases */
  }
  try {
    await db.execute(sql`DROP TYPE IF EXISTS restaurant_order_status`);
  } catch {
    /* same */
  }
}
