import { MongoClient, type Db, type MongoClientOptions } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoDbNamePromise?: Promise<string>;
  _mongoCountersReady?: Promise<void>;
};

function mongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }
  return uri;
}

function configuredDatabaseName(): string | null {
  const name = process.env.MONGODB_DB?.trim();
  return name && name.length > 0 ? name : null;
}

/** Database name from MONGODB_DB. The URI has no path, so the fallback is `aha`. */
export function mongoDatabaseName(): string {
  return configuredDatabaseName() ?? "aha";
}

/**
 * Compass imports landed in a database other than the app default.
 * When MONGODB_DB is unset, use the database that actually contains tours.
 */
async function detectDatabaseName(client: MongoClient): Promise<string> {
  const fallback = "aha";
  try {
    const { databases } = await client.db().admin().listDatabases();
    const names = new Set<string>([fallback, ...databases.map((entry) => entry.name)]);
    let best = fallback;
    let bestCount = 0;
    for (const name of names) {
      if (name === "admin" || name === "local" || name === "config") continue;
      const count = await client.db(name).collection("tours").estimatedDocumentCount();
      if (count > bestCount) {
        best = name;
        bestCount = count;
      }
    }
    return bestCount > 0 ? best : fallback;
  } catch (error) {
    console.error("Mongo database detection failed", error);
    return fallback;
  }
}

async function databaseName(client: MongoClient): Promise<string> {
  const configured = configuredDatabaseName();
  if (configured) return configured;
  if (!globalForMongo._mongoDbNamePromise) {
    globalForMongo._mongoDbNamePromise = detectDatabaseName(client).catch((error: unknown) => {
      globalForMongo._mongoDbNamePromise = undefined;
      throw error;
    });
  }
  return globalForMongo._mongoDbNamePromise;
}

/** Keep autoincrement ids above the numeric `_id` values from the JSON import. */
async function seedIdCounters(database: Db): Promise<void> {
  const collections = await database.listCollections({}, { nameOnly: true }).toArray();
  const counters = database.collection<{ seq: number }>("counters");
  for (const { name } of collections) {
    if (!name || name === "counters" || name.startsWith("system.")) continue;
    const [row] = await database
      .collection(name)
      .aggregate<{ max: number }>([
        {
          $project: {
            n: {
              $cond: [{ $isNumber: "$id" }, "$id", { $cond: [{ $isNumber: "$_id" }, "$_id", 0] }],
            },
          },
        },
        { $group: { _id: null, max: { $max: "$n" } } },
      ])
      .toArray();
    const seq = Number(row?.max ?? 0);
    if (!Number.isFinite(seq) || seq <= 0) continue;
    await counters.updateOne({ _id: name } as never, { $max: { seq } }, { upsert: true });
  }
}

async function ensureIdCounters(database: Db): Promise<void> {
  if (!globalForMongo._mongoCountersReady) {
    globalForMongo._mongoCountersReady = seedIdCounters(database)
      .catch((error: unknown) => {
        console.error("Unable to seed Mongo id counters", error);
      })
      .then(() => undefined);
  }
  await globalForMongo._mongoCountersReady;
}

function clientPromise(): Promise<MongoClient> {
  if (!globalForMongo._mongoClientPromise) {
    const options: MongoClientOptions = {};
    const client = new MongoClient(mongoUri(), options);
    globalForMongo._mongoClientPromise = client.connect().catch((error: unknown) => {
      globalForMongo._mongoClientPromise = undefined;
      throw error;
    });
  }
  return globalForMongo._mongoClientPromise;
}

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise();
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  const database = client.db(await databaseName(client));
  await ensureIdCounters(database);
  return database;
}
