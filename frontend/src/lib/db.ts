import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { poolSettingsForDatabaseUrl } from "@/lib/db-pool";
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
  const settings = poolSettingsForDatabaseUrl(connectionString);
  return new Pool({
    connectionString: url.toString(),
    max: settings.max,
    idleTimeoutMillis: settings.idleTimeoutMillis,
    connectionTimeoutMillis: settings.connectionTimeoutMillis,
    allowExitOnIdle: settings.allowExitOnIdle,
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
 * Server-side Supabase Postgres client. The Pool is created on first use and
 * kept on globalThis, so a warm serverless instance reuses it. The production
 * URL is the shared transaction pooler (port 6543). The pool talks to Postgres
 * as the database owner, which bypasses RLS. The publishable key must not be
 * used to query these tables; RLS blocks the Data API.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const database = getDatabase();
    const value = Reflect.get(database, prop, database);
    return typeof value === "function" ? value.bind(database) : value;
  },
});
