import { db } from "@/lib/db";

/** Financial writes use the same MongoDB client as the rest of the app. */
export function getFinanceDb() {
  return db;
}

export type FinanceDb = typeof db;
export type FinanceTx = typeof db;

export async function withFinanceTransaction<T>(fn: (tx: FinanceTx) => Promise<T>): Promise<T> {
  return db.transaction(fn);
}
