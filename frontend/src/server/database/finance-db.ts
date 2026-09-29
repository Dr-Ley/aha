/**
 * WebSocket Drizzle client for multi-step financial writes.
 * Neon HTTP (`@/lib/db`) cannot wrap Payment + Invoice + Booking in one transaction.
 */
import { neonConfig, Pool } from "@neondatabase/serverless";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { NeonTransaction } from "drizzle-orm/neon-serverless";
import * as schema from "@/lib/schema";

if (typeof globalThis.WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = globalThis.WebSocket;
}

let pool: Pool | null = null;
let financeDb: ReturnType<typeof createFinanceDb> | null = null;

function createFinanceDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not defined");
  }
  pool = new Pool({ connectionString: url });
  return drizzle(pool, { schema });
}

export function getFinanceDb() {
  if (!financeDb) financeDb = createFinanceDb();
  return financeDb;
}

export type FinanceDb = ReturnType<typeof getFinanceDb>;
export type FinanceTx = NeonTransaction<typeof schema, ExtractTablesWithRelations<typeof schema>>;

export async function withFinanceTransaction<T>(fn: (tx: FinanceTx) => Promise<T>): Promise<T> {
  return getFinanceDb().transaction(fn);
}
