import { MongoClient, type Db, type MongoClientOptions } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientCache?: MongoClientCache<MongoClient>;
};

/** Serverless pool: small, idle sockets close, fail fast when Atlas is unreachable. */
export const mongoClientOptions: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxConnecting: 2,
  maxIdleTimeMS: 60_000,
  waitQueueTimeoutMS: 5_000,
  serverSelectionTimeoutMS: 5_000,
  connectTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  retryWrites: true,
  appName: "aha",
};

type MongoEnv = {
  NODE_ENV?: string;
  MONGODB_URI?: string;
  MONGODB_DB?: string;
  MONGODB_ALLOW_REMOTE?: string;
};

const INVALID_DB_NAME = /[\s/\\."$*<>:|?\u0000]/;

export function createMongoClientCache<T>() {
  let currentUri: string | undefined;
  let current: Promise<T> | undefined;
  return {
    connect(uri: string, factory: (uri: string) => Promise<T>): Promise<T> {
      if (current && currentUri === uri) return current;
      currentUri = uri;
      const pending = factory(uri).catch((error: unknown) => {
        if (currentUri === uri) {
          current = undefined;
          currentUri = undefined;
        }
        throw error;
      });
      current = pending;
      return pending;
    },
  };
}

type MongoClientCache<T> = ReturnType<typeof createMongoClientCache<T>>;

function clientCache(): MongoClientCache<MongoClient> {
  if (!globalForMongo._mongoClientCache) {
    globalForMongo._mongoClientCache = createMongoClientCache<MongoClient>();
  }
  return globalForMongo._mongoClientCache;
}

export function databaseNameFromUri(uri: string): string | null {
  const trimmed = uri.trim();
  const scheme = trimmed.startsWith("mongodb+srv://")
    ? "mongodb+srv://"
    : trimmed.startsWith("mongodb://")
      ? "mongodb://"
      : null;
  if (!scheme) return null;
  const rest = trimmed.slice(scheme.length);
  const slash = rest.indexOf("/");
  if (slash === -1) return null;
  const path = rest.slice(slash + 1);
  const queryAt = path.indexOf("?");
  const name = (queryAt === -1 ? path : path.slice(0, queryAt)).replace(/\/+$/, "").trim();
  if (!name) return null;
  try {
    return decodeURIComponent(name);
  } catch {
    return null;
  }
}

export function assertValidDatabaseName(name: string, source: string): void {
  if (!name || name.length > 64 || INVALID_DB_NAME.test(name)) {
    throw new Error(
      `${source} must be a database name of 1–64 characters without spaces or / \\ . " $ * < > : | ?`
    );
  }
}

/** `MONGODB_DB` wins. Otherwise the path in `MONGODB_URI`. No silent default. */
export function resolveDatabaseName(uri: string, configuredName?: string | null): string {
  const configured = configuredName?.trim() ?? "";
  if (configured) {
    assertValidDatabaseName(configured, "MONGODB_DB");
    return configured;
  }
  const fromUri = databaseNameFromUri(uri);
  if (!fromUri) {
    throw new Error(
      "MongoDB database name is missing. Set MONGODB_DB or add a database name to MONGODB_URI (for example mongodb://127.0.0.1:27017/aha_dev)."
    );
  }
  assertValidDatabaseName(fromUri, "The database name in MONGODB_URI");
  return fromUri;
}

export function mongoDatabaseName(env: MongoEnv = process.env): string {
  return resolveDatabaseName(env.MONGODB_URI?.trim() ?? "", env.MONGODB_DB);
}

/** Hosts in a mongodb or mongodb+srv URI, without userinfo, port, or path. */
export function mongoHosts(uri: string): string[] {
  const trimmed = uri.trim();
  const scheme = trimmed.startsWith("mongodb+srv://")
    ? "mongodb+srv://"
    : trimmed.startsWith("mongodb://")
      ? "mongodb://"
      : null;
  if (!scheme) return [];
  const rest = trimmed.slice(scheme.length);
  const at = rest.lastIndexOf("@");
  const hostPart = at === -1 ? rest : rest.slice(at + 1);
  const slash = hostPart.indexOf("/");
  const authority = (slash === -1 ? hostPart : hostPart.slice(0, slash)).split("?")[0];
  return authority
    .split(",")
    .map((entry) => {
      const host = entry.trim();
      if (host.startsWith("[")) {
        const end = host.indexOf("]");
        return end === -1 ? host : host.slice(1, end);
      }
      return host.split(":")[0] ?? "";
    })
    .filter((host) => host.length > 0);
}

export function isLocalMongoHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function remoteOptIn(value: string | undefined): boolean {
  const flag = value?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

/**
 * `next dev` may not open Atlas unless MONGODB_ALLOW_REMOTE=true.
 * Production and test runs are unchanged.
 */
export function assertLocalMongoInDevelopment(uri: string, env: MongoEnv = process.env): void {
  if (env.NODE_ENV !== "development") return;
  if (remoteOptIn(env.MONGODB_ALLOW_REMOTE)) return;
  const hosts = mongoHosts(uri);
  if (hosts.length === 0 || hosts.some((host) => !isLocalMongoHost(host))) {
    throw new Error(
      "Development refused a non-local MongoDB host. Use 127.0.0.1, localhost, or ::1, or set MONGODB_ALLOW_REMOTE=true to opt in to a remote database."
    );
  }
}

function mongoUri(env: MongoEnv = process.env): string {
  const uri = env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is not defined");
  return uri;
}

function safeConnectionError(error: unknown): Error {
  const message = error instanceof Error ? error.message : "MongoDB connection failed";
  if (/mongodb(\+srv)?:\/\//i.test(message)) {
    return new Error("MongoDB connection failed");
  }
  return error instanceof Error ? error : new Error("MongoDB connection failed");
}

export async function getMongoClient(): Promise<MongoClient> {
  const uri = mongoUri();
  assertLocalMongoInDevelopment(uri);
  mongoDatabaseName();
  return clientCache().connect(uri, async (nextUri) => {
    try {
      return await new MongoClient(nextUri, mongoClientOptions).connect();
    } catch (error) {
      throw safeConnectionError(error);
    }
  });
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(mongoDatabaseName());
}
