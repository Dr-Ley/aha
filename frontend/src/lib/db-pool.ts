export type DatabaseConnectionMode = "transaction-pooler" | "session-pooler" | "direct";

export type DatabasePoolSettings = {
  mode: DatabaseConnectionMode;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  allowExitOnIdle: boolean;
};

/**
 * Shared Supavisor transaction mode is port 6543 on `*.pooler.supabase.com`.
 * The dedicated pooler also uses 6543, on `db.<ref>.supabase.co`.
 * Session mode is the same pooler host on port 5432.
 */
export function databaseConnectionMode(connectionString: string): DatabaseConnectionMode {
  const url = new URL(connectionString);
  const port = url.port || "5432";
  const host = url.hostname;
  const sharedPooler = host.includes("pooler.supabase.com");
  const transactionPort = port === "6543" || url.searchParams.get("pgbouncer") === "true";
  if (transactionPort && (sharedPooler || host.startsWith("db."))) return "transaction-pooler";
  if (sharedPooler && port === "5432") return "session-pooler";
  if (transactionPort) return "transaction-pooler";
  return "direct";
}

/**
 * One client connection per warm serverless instance.
 *
 * Supavisor transaction mode already multiplexes clients onto server backends.
 * node-pg's Pool is a second pool in front of that. `max` above 1 lets one
 * instance check out one backend per overlapping query. It does not change
 * shared_buffers or the host's committed memory.
 */
export function poolSettingsForDatabaseUrl(connectionString: string): DatabasePoolSettings {
  return {
    mode: databaseConnectionMode(connectionString),
    max: 1,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  };
}
