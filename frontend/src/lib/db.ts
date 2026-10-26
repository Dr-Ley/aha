import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/schema";

type Database = NodePgDatabase<typeof schema>;

const globalForPg = globalThis as typeof globalThis & {
  __ahaPgPool?: Pool;
  __ahaDb?: Database;
  __ahaDatabaseUrl?: string;
};

function databaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not defined. Set the Supabase Postgres connection string in frontend/.env.local. Use the transaction pooler URI from Project Settings → Database, not the publishable key."
    );
  }
  return url;
}

function createPool(connectionString: string): Pool {
  const url = new URL(connectionString);
  // Current node-pg treats sslmode=require as verify-full, which rejects Supabase's chain.
  url.searchParams.delete("sslmode");
  return new Pool({
    connectionString: url.toString(),
    max: 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false },
  });
}

function getDatabase(): Database {
  const url = databaseUrl();
  if (globalForPg.__ahaDb && globalForPg.__ahaDatabaseUrl === url) {
    return globalForPg.__ahaDb;
  }
  if (globalForPg.__ahaPgPool) {
    void globalForPg.__ahaPgPool.end();
  }
  const pool = createPool(url);
  const database = drizzle(pool, { schema });
  globalForPg.__ahaPgPool = pool;
  globalForPg.__ahaDb = database;
  globalForPg.__ahaDatabaseUrl = url;
  return database;
}

/**
 * Server-side Supabase Postgres client. The pool talks to the transaction
 * pooler as the database owner, which bypasses RLS. The publishable key must
 * not be used to query these tables; RLS blocks the Data API.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const database = getDatabase();
    const value = Reflect.get(database, prop, database);
    return typeof value === "function" ? value.bind(database) : value;
  },
});
