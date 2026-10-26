/**
 * Create the dashboard indexes approved for performance stages 1–4.
 *
 * Local `aha_dev` on a loopback host is allowed with no extra flag.
 * A staging database (name `aha_staging` or ending in `_staging`) is allowed
 * only with `--staging`. Any other database is refused unless
 * `--allow-database <exact name>` matches the URI database.
 *
 * Unique indexes are not built until a duplicate check on the partial
 * population passes. A failed check skips that unique index and leaves the
 * collection data unchanged.
 *
 * Usage from frontend/:
 *   npm run indexes:dashboard -- --check
 *   npm run indexes:dashboard
 *   npm run indexes:dashboard -- --staging --uri mongodb://host/aha_staging
 *   npm run indexes:dashboard -- --allow-database aha_dev --uri mongodb://127.0.0.1:27017/aha_dev
 */
import { MongoClient, type Collection, type Document, type IndexSpecification } from "mongodb";
import { databaseNameFromUri, isLocalMongoHost, mongoHosts } from "../src/lib/mongo-client";

const LOCAL_DATABASE = "aha_dev";
const DEFAULT_URI = "mongodb://127.0.0.1:27017/aha_dev";

type IndexPlan = {
  collection: string;
  name: string;
  key: IndexSpecification;
  unique?: boolean;
  partial?: Document;
};

const LIST_INDEXES: IndexPlan[] = [
  { collection: "payments", name: "payments_company_recorded_id", key: { company_id: 1, recorded_at: -1, _id: -1 } },
  { collection: "expenses", name: "expenses_company_incurred_id", key: { company_id: 1, incurred_at: -1, _id: -1 } },
  { collection: "revenue_entries", name: "revenue_company_recognized_id", key: { company_id: 1, recognized_at: -1, _id: -1 } },
  { collection: "hotel_bookings", name: "hotel_bookings_company_checkin_id", key: { company_id: 1, check_in_date: -1, _id: -1 } },
  { collection: "bookings", name: "bookings_company_created_id", key: { company_id: 1, created_at: -1, _id: -1 } },
  { collection: "bar_orders", name: "bar_orders_company_created_id", key: { company_id: 1, created_at: -1, _id: -1 } },
  { collection: "restaurant_orders", name: "restaurant_orders_company_created_id", key: { company_id: 1, created_at: -1, _id: -1 } },
  { collection: "notifications", name: "notifications_company_created_id", key: { company_id: 1, created_at: -1, _id: -1 } },
  { collection: "notifications", name: "notifications_company_read", key: { company_id: 1, is_read: 1 } },
  { collection: "itineraries", name: "itineraries_company_created_id", key: { company_id: 1, created_at: -1, _id: -1 } },
  { collection: "bar_order_items", name: "bar_order_items_order", key: { order_id: 1 } },
  { collection: "restaurant_order_items", name: "restaurant_order_items_order", key: { order_id: 1 } },
];

const UNIQUE_INDEXES: IndexPlan[] = [
  {
    collection: "hotel_booking_rooms",
    name: "hotel_booking_rooms_stay_room",
    key: { hotel_booking_id: 1, room_id: 1 },
    unique: true,
  },
  {
    collection: "itineraries",
    name: "itineraries_public_token",
    key: { public_token: 1 },
    unique: true,
  },
  {
    collection: "payments",
    name: "payments_company_idempotency",
    key: { company_id: 1, idempotency_key: 1 },
    unique: true,
    partial: { idempotency_key: { $type: "string" } },
  },
  {
    collection: "customers",
    name: "customers_company_email",
    key: { company_id: 1, email: 1 },
    unique: true,
    partial: { email: { $type: "string" } },
  },
];

type Cli = {
  check: boolean;
  staging: boolean;
  allowDatabase: string | null;
  uri: string;
};

function parseArgs(argv: string[]): Cli {
  let check = false;
  let staging = false;
  let allowDatabase: string | null = null;
  let uri = DEFAULT_URI;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--check") check = true;
    else if (arg === "--staging") staging = true;
    else if (arg === "--allow-database") {
      allowDatabase = argv[i + 1] ?? "";
      i++;
    } else if (arg === "--uri") {
      uri = argv[i + 1] ?? "";
      i++;
    } else if (arg.startsWith("--uri=")) uri = arg.slice("--uri=".length);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return { check, staging, allowDatabase, uri };
}

function assertAuthorised(cli: Cli): string {
  const database = databaseNameFromUri(cli.uri);
  const hosts = mongoHosts(cli.uri);
  if (!database || hosts.length === 0) {
    throw new Error("Refused: the URI needs a host and a database name.");
  }
  const local = hosts.every((host) => isLocalMongoHost(host)) && database === LOCAL_DATABASE;
  const stagingName = database === "aha_staging" || database.endsWith("_staging");
  const staging = cli.staging && stagingName && !/prod/i.test(database);
  const explicit = cli.allowDatabase != null && cli.allowDatabase === database;
  if (local || staging || explicit) return database;
  const reason = cli.staging && !stagingName
    ? `--staging only allows aha_staging or a name ending in _staging, not ${database}`
    : "Pass --staging for a staging database, or --allow-database with the exact database name.";
  throw new Error(`Refused indexes on ${hosts.join(",")} / ${database}. ${reason}`);
}

function sameKey(left: Document, right: IndexSpecification): boolean {
  const rightDoc = right as Document;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(rightDoc);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key, index) => key === rightKeys[index] && left[key] === rightDoc[key]);
}

async function duplicateGroups(collection: Collection, plan: IndexPlan): Promise<number> {
  const groupId: Document = {};
  for (const field of Object.keys(plan.key)) groupId[field] = `$${field}`;
  const pipeline: Document[] = [];
  if (plan.partial) pipeline.push({ $match: plan.partial });
  pipeline.push({ $group: { _id: groupId, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }, { $count: "groups" });
  const rows = await collection.aggregate(pipeline).toArray();
  return Number(rows[0]?.groups ?? 0);
}

type ExplainSummary = {
  query: string;
  nReturned: number;
  totalDocsExamined: number;
  totalKeysExamined: number;
  executionTimeMillis: number;
  indexName: string | null;
};

async function explainQuery(
  collection: Collection,
  label: string,
  filter: Document,
  sort?: Document,
  limit?: number
): Promise<ExplainSummary> {
  let cursor = collection.find(filter);
  if (sort) cursor = cursor.sort(sort);
  if (limit != null) cursor = cursor.limit(limit);
  const explained = await cursor.explain("executionStats");
  const stats = explained.executionStats ?? {};
  const stages: string[] = [];
  let indexName: string | null = null;
  const walk = (node: { stage?: string; indexName?: string; inputStage?: unknown; inputStages?: unknown[] } | null) => {
    if (!node) return;
    if (node.stage) stages.push(node.stage);
    if (node.indexName) indexName = node.indexName;
    if (node.inputStage) walk(node.inputStage as typeof node);
    for (const child of node.inputStages ?? []) walk(child as typeof node);
  };
  walk(stats.executionStages);
  return {
    query: label,
    nReturned: Number(stats.nReturned ?? 0),
    totalDocsExamined: Number(stats.totalDocsExamined ?? 0),
    totalKeysExamined: Number(stats.totalKeysExamined ?? 0),
    executionTimeMillis: Number(stats.executionTimeMillis ?? 0),
    indexName: indexName ?? (stages.includes("COLLSCAN") ? "COLLSCAN" : stages.join(">")),
  };
}

async function sampleExplains(dbName: string, client: MongoClient): Promise<ExplainSummary[]> {
  const db = client.db(dbName);
  const companies = ["aha", "ewc", "bth"] as const;
  const summaries: ExplainSummary[] = [];
  for (const company of companies) {
    summaries.push(
      await explainQuery(db.collection("payments"), `${company} payments`, { company_id: company }, { recorded_at: -1, _id: -1 }),
      await explainQuery(db.collection("revenue_entries"), `${company} revenue`, { company_id: company }, { recognized_at: -1, _id: -1 }),
      await explainQuery(db.collection("hotel_bookings"), `${company} hotel`, { company_id: company }),
      await explainQuery(
        db.collection("notifications"),
        `${company} notifications`,
        { company_id: company },
        { created_at: -1, _id: -1 },
        80
      )
    );
  }
  const stayIds = await db.collection("hotel_bookings").find({ company_id: "bth" }, { projection: { _id: 1 } }).limit(50).toArray();
  summaries.push(
    await explainQuery(db.collection("hotel_booking_rooms"), "bth stay rooms $in 50", {
      hotel_booking_id: { $in: stayIds.map((row) => row._id) },
    })
  );
  return summaries;
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const database = assertAuthorised(cli);
  const client = new MongoClient(cli.uri, { serverSelectionTimeoutMS: 4000 });
  await client.connect();
  try {
    const actual = client.db(database).databaseName;
    if (actual !== database) throw new Error(`Refused: connected database is ${actual}, expected ${database}.`);
    console.log(`Target ${mongoHosts(cli.uri).join(",")} / ${database} (${cli.check ? "check only" : "create"})`);
    const before = await sampleExplains(database, client);
    console.log("Before:");
    console.log(JSON.stringify(before, null, 2));
    if (cli.check) return;

    const db = client.db(database);
    const skipped: string[] = [];
    const uniquePlans: IndexPlan[] = [];
    for (const plan of UNIQUE_INDEXES) {
      const groups = await duplicateGroups(db.collection(plan.collection), plan);
      if (groups > 0) {
        skipped.push(`${plan.name}: ${groups} duplicate groups`);
        console.error(`Skipped unique index ${plan.name}: ${groups} duplicate groups. Data was not modified.`);
        continue;
      }
      uniquePlans.push(plan);
    }

    const plans = [...LIST_INDEXES, ...uniquePlans];
    for (const plan of plans) {
      const collection = db.collection(plan.collection);
      const existing = await collection.indexes();
      const found = existing.find((index) => index.name === plan.name);
      if (found) {
        if (!sameKey(found.key, plan.key)) {
          throw new Error(`Index ${plan.name} already exists with a different key. Nothing further was changed after this check.`);
        }
        console.log(`exists ${plan.name}`);
        continue;
      }
      await collection.createIndex(plan.key, {
        name: plan.name,
        unique: plan.unique ?? false,
        ...(plan.partial ? { partialFilterExpression: plan.partial } : {}),
      });
      console.log(`created ${plan.name}`);
    }

    const after = await sampleExplains(database, client);
    console.log("After:");
    console.log(JSON.stringify(after, null, 2));
    if (skipped.length > 0) {
      throw new Error(`Unique indexes skipped:\n${skipped.join("\n")}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
