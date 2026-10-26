/**
 * Load aha-neon-db.sql into the Supabase Postgres database in DATABASE_URL,
 * then lock the public tables so the Data API cannot read them.
 *
 * The app connects with this same URL through src/lib/db.ts. The publishable
 * key is not a database password and is not used here.
 *
 * Usage (from frontend/): npm run db:load
 */
import { spawn } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dumpPath = resolve(frontendRoot, "..", "aha-neon-db.sql");
const envPath = join(frontendRoot, ".env.local");

const lockDownSql = `
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
`;

function readDatabaseUrl(): string {
  const text = readFileSync(envPath, "utf8");
  const line = text.split(/\r?\n/).find((entry) => /^\s*DATABASE_URL=/.test(entry));
  if (!line) {
    throw new Error(
      "DATABASE_URL is not set in frontend/.env.local. Uncomment it and replace [YOUR-PASSWORD] with the database password from Supabase → Project Settings → Database."
    );
  }
  let value = line.replace(/^\s*DATABASE_URL=/, "").trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (!value || value.includes("[YOUR-PASSWORD]") || value.includes("YOUR-PASSWORD")) {
    throw new Error("DATABASE_URL still contains the password placeholder.");
  }
  if (!/^postgres(ql)?:\/\//i.test(value)) {
    throw new Error("DATABASE_URL must start with postgresql://");
  }
  return value;
}

/** Session-mode pooler (port 5432) accepts COPY and the dump's session settings. */
function restoreTarget(databaseUrl: string): URL {
  const url = new URL(databaseUrl);
  if (url.hostname.includes("pooler.supabase.com") && (url.port === "6543" || url.port === "")) {
    url.port = "5432";
  }
  if (!url.pathname || url.pathname === "/") url.pathname = "/postgres";
  return url;
}

function filteredDump(source: string): string {
  return source
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (/^CREATE DATABASE\b/i.test(trimmed)) return false;
      if (/^\\connect\b/i.test(trimmed)) return false;
      if (/^\\restrict\b/i.test(trimmed)) return false;
      if (/^\\unrestrict\b/i.test(trimmed)) return false;
      if (/^SET transaction_timeout\b/i.test(trimmed)) return false;
      if (/^SET row_security\b/i.test(trimmed)) return false;
      if (/^SET default_tablespace\b/i.test(trimmed)) return false;
      if (/^SET default_table_access_method\b/i.test(trimmed)) return false;
      return true;
    })
    .join("\n");
}

function runPsql(target: URL, args: string[]): Promise<void> {
  const conninfo = [
    `host=${target.hostname}`,
    `port=${target.port || "5432"}`,
    `dbname=${target.pathname.replace(/^\//, "") || "postgres"}`,
    `user=${decodeURIComponent(target.username)}`,
    "sslmode=require",
  ].join(" ");

  return new Promise((resolvePromise, reject) => {
    const child = spawn("psql", [conninfo, ...args], {
      env: {
        ...process.env,
        PGPASSWORD: decodeURIComponent(target.password),
        PGCHANNELBINDING: "disable",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
      if (stderr.length > 20_000) stderr = stderr.slice(-20_000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(new Error(stderr.trim() || `psql exited with code ${code}`));
    });
  });
}

async function verifyAppConnection(databaseUrl: string): Promise<void> {
  const url = new URL(databaseUrl);
  url.searchParams.delete("sslmode");
  const pool = new Pool({
    connectionString: url.toString(),
    max: 1,
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false },
  });
  try {
    const result = await pool.query<{
      companies: number;
      users: number;
      bookings: number;
      tables_without_rls: number;
    }>(`
      SELECT
        (SELECT count(*)::int FROM public.companies) AS companies,
        (SELECT count(*)::int FROM public.users) AS users,
        (SELECT count(*)::int FROM public.bookings) AS bookings,
        (
          SELECT count(*)::int
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
            AND c.relkind = 'r'
            AND NOT c.relrowsecurity
        ) AS tables_without_rls
    `);
    const row = result.rows[0];
    if (!row) throw new Error("Verification query returned no row.");
    console.log(
      `Connected. companies=${row.companies} users=${row.users} bookings=${row.bookings} tables_without_rls=${row.tables_without_rls}`
    );
    if (row.companies < 1) {
      throw new Error("companies is empty after the load.");
    }
    if (row.tables_without_rls !== 0) {
      throw new Error("Some public tables still do not have row level security enabled.");
    }
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  const databaseUrl = readDatabaseUrl();
  const target = restoreTarget(databaseUrl);
  const dump = filteredDump(readFileSync(dumpPath, "utf8"));
  const dumpFile = join(tmpdir(), `aha-supabase-load-${process.pid}.sql`);
  const lockFile = join(tmpdir(), `aha-supabase-rls-${process.pid}.sql`);
  writeFileSync(dumpFile, dump);
  writeFileSync(lockFile, lockDownSql);
  try {
    console.log(`Loading schema and data into ${target.hostname}:${target.port || "5432"}/${target.pathname.replace(/^\//, "")}`);
    await runPsql(target, ["-v", "ON_ERROR_STOP=1", "-f", dumpFile]);
    console.log("Enabling row level security on public tables.");
    await runPsql(target, ["-v", "ON_ERROR_STOP=1", "-f", lockFile]);
    await verifyAppConnection(databaseUrl);
  } finally {
    rmSync(dumpFile, { force: true });
    rmSync(lockFile, { force: true });
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
