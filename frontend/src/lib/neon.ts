import { Pool } from "pg";

type GlobalNeon = typeof globalThis & { __neonPool?: Pool };

function connectionString(): string {
  const raw = process.env.NEON_DATABASE_URL?.trim();
  if (!raw) throw new Error("NEON_DATABASE_URL is not set");
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");
  return url.toString();
}

export function neonPool(): Pool {
  const g = globalThis as GlobalNeon;
  if (!g.__neonPool) {
    g.__neonPool = new Pool({
      connectionString: connectionString(),
      max: 1,
      ssl: { rejectUnauthorized: false },
    });
  }
  return g.__neonPool;
}
