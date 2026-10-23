/**
 * Load migrat/aha-neon-db-mongodb into local database aha_dev.
 *
 * The exporter wrote one JSON array per collection. Dates use relaxed
 * Extended JSON (`{ "$date": "<ISO-8601>" }`). This script parses that
 * with the official driver's EJSON parser, stores integers as BSON int,
 * fractional numbers as BSON double, and keeps every `_id` and field name.
 *
 * Safety:
 * - Does not read MONGODB_URI or MONGODB_DB from the environment.
 * - Default target is mongodb://127.0.0.1:27017/aha_dev.
 * - Refuses mongodb+srv, any host other than 127.0.0.1 / localhost / ::1,
 *   and any database name other than aha_dev.
 * - Inserts are ordered. A failed document aborts the run and is reported.
 * - Documents land in a scratch collection first. The real collection is
 *   renamed into place only after the scratch count matches the file.
 * - A non-empty target collection is left untouched unless
 *   --confirm-overwrite is passed. That flag replaces only the collections
 *   in this export, inside aha_dev. It does not drop the database.
 * - An empty existing collection is replaced, because it has no documents.
 * - A second run without --confirm-overwrite exits with an error once any
 *   target collection has documents. Scratch names `_import_tmp_*` left by
 *   a crashed run are dropped at the start of the next import.
 *
 * Usage from frontend/:
 *   npm run import:local
 *   npm run import:local -- --check
 *   npm run import:local -- --confirm-overwrite
 */
import { EJSON } from "bson";
import fs from "fs";
import {
  Double,
  Int32,
  Long,
  MongoBulkWriteError,
  MongoClient,
  type Document,
  type MongoClientOptions,
} from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import { databaseNameFromUri, isLocalMongoHost, mongoHosts } from "../src/lib/mongo-client";

const DATABASE = "aha_dev";
const DEFAULT_URI = "mongodb://127.0.0.1:27017/aha_dev";
const SCRATCH_PREFIX = "_import_tmp_";
const INT32_MIN = -2_147_483_648;
const INT32_MAX = 2_147_483_647;
const BATCH_SIZE = 500;

const REPRESENTATIVE = new Set([
  "bookings",
  "tours",
  "payments",
  "hotel_bookings",
  "expenses",
  "company_memberships",
  "companies",
]);

class ImportError extends Error {}

type RawDoc = Record<string, unknown>;

type LoadedCollection = {
  name: string;
  raw: RawDoc[];
  docs: Document[];
};

type Cli = {
  check: boolean;
  confirmOverwrite: boolean;
  uri: string;
};

function parseArgs(argv: string[]): Cli {
  let check = false;
  let confirmOverwrite = false;
  let uri = DEFAULT_URI;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") check = true;
    else if (arg === "--confirm-overwrite") confirmOverwrite = true;
    else if (arg === "--uri") {
      const value = argv[index + 1];
      if (!value) throw new ImportError("--uri requires a connection string");
      uri = value;
      index += 1;
    } else {
      throw new ImportError(`Unknown argument "${arg}". Expected --check, --confirm-overwrite, or --uri.`);
    }
  }
  if (check && confirmOverwrite) {
    throw new ImportError("Use either --check or --confirm-overwrite, not both.");
  }
  return { check, confirmOverwrite, uri };
}

function hostFromAddress(address: string): string {
  if (address.startsWith("[")) {
    const end = address.indexOf("]");
    return end === -1 ? address : address.slice(1, end);
  }
  return address.split(":")[0] ?? "";
}

function assertSafeUri(uri: string): void {
  const trimmed = uri.trim();
  if (!trimmed.startsWith("mongodb://")) {
    throw new ImportError("Refusing import: only a mongodb:// URI is accepted. mongodb+srv and Atlas hosts are refused.");
  }
  if (/mongodb\.net/i.test(trimmed)) {
    throw new ImportError("Refusing import: MongoDB Atlas hosts are not a local development target.");
  }
  const hosts = mongoHosts(trimmed);
  if (hosts.length !== 1 || !isLocalMongoHost(hosts[0] ?? "")) {
    throw new ImportError(
      `Refusing import: host must be 127.0.0.1, localhost, or ::1. Got ${hosts.join(", ") || "(none)"}.`
    );
  }
  const database = databaseNameFromUri(trimmed);
  if (database !== DATABASE) {
    throw new ImportError(
      `Refusing import: database must be ${DATABASE}. Got ${database ?? "(missing)"}.`
    );
  }
}

function connectedServers(client: MongoClient): string[] {
  const topology = (
    client as unknown as {
      topology?: { description?: { servers?: Map<string, unknown> } };
    }
  ).topology;
  return [...(topology?.description?.servers?.keys() ?? [])];
}

function assertConnectedLocally(client: MongoClient): string[] {
  const servers = connectedServers(client);
  if (servers.length === 0) {
    throw new ImportError("Refusing import: the driver did not report a connected server.");
  }
  const remote = servers.filter((address) => !isLocalMongoHost(hostFromAddress(address)));
  if (remote.length > 0) {
    throw new ImportError(`Refusing import: connected server is not local (${remote.join(", ")}).`);
  }
  return servers;
}

function exportDirectory(): string {
  const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(scriptsDir, "../../migrat/aha-neon-db-mongodb");
}

function isRecord(value: unknown): value is RawDoc {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function dateLiteral(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === "$date" && typeof value.$date === "string") return value.$date;
  return null;
}

function assertExtendedJson(value: unknown, label: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertExtendedJson(item, `${label}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  const keys = Object.keys(value);
  if (keys.some((key) => key.startsWith("$"))) {
    const iso = dateLiteral(value);
    if (!iso || Number.isNaN(Date.parse(iso))) {
      throw new ImportError(`${label} uses unsupported Extended JSON (${keys.join(", ")}).`);
    }
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    assertExtendedJson(nested, `${label}.${key}`);
  }
}

function numericBson(value: number): Int32 | Long | Double {
  if (!Number.isFinite(value)) throw new ImportError("Refusing a non-finite number.");
  if (Number.isInteger(value)) {
    if (!Number.isSafeInteger(value)) {
      throw new ImportError(`Refusing integer ${value} outside the safe integer range.`);
    }
    if (value >= INT32_MIN && value <= INT32_MAX) return new Int32(value);
    return Long.fromNumber(value);
  }
  return new Double(value);
}

function expectedNumericType(value: number): "int" | "long" | "double" {
  const stored = numericBson(value);
  if (stored instanceof Int32) return "int";
  if (stored instanceof Long) return "long";
  return "double";
}

function preserveValue(value: unknown, label: string): unknown {
  if (typeof value === "number") return numericBson(value);
  if (Array.isArray(value)) return value.map((item, index) => preserveValue(item, `${label}[${index}]`));
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new ImportError(`${label} is an invalid date.`);
    return value;
  }
  if (!isRecord(value)) return value;
  const preserved: RawDoc = {};
  for (const [key, nested] of Object.entries(value)) {
    preserved[key] = preserveValue(nested, `${label}.${key}`);
  }
  return preserved;
}

function loadExport(directory: string): { collections: LoadedCollection[]; fractionalFields: string[] } {
  if (!fs.existsSync(directory)) throw new ImportError(`Export directory not found: ${directory}`);
  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .sort();
  if (files.length === 0) throw new ImportError(`No JSON files in ${directory}`);

  const fractional = new Set<string>();
  const collections: LoadedCollection[] = [];

  for (const file of files) {
    if (!/^[a-z][a-z0-9_]*\.json$/.test(file)) {
      throw new ImportError(`Unexpected export file name: ${file}`);
    }
    const name = file.slice(0, -".json".length);
    const text = fs.readFileSync(path.join(directory, file), "utf8");
    let rawParsed: unknown;
    try {
      rawParsed = JSON.parse(text) as unknown;
    } catch (error) {
      const message = error instanceof Error ? error.message : "parse error";
      throw new ImportError(`${file} is not JSON: ${message}`);
    }
    if (!Array.isArray(rawParsed)) {
      throw new ImportError(`${file} is not a JSON array. This importer does not treat objects or newline-delimited JSON as a collection.`);
    }
    assertExtendedJson(rawParsed, name);

    let extended: unknown;
    try {
      extended = EJSON.parse(text, { relaxed: true }) as unknown;
    } catch (error) {
      const message = error instanceof Error ? error.message : "parse error";
      throw new ImportError(`${file} Extended JSON parse failed: ${message}`);
    }
    if (!Array.isArray(extended) || extended.length !== rawParsed.length) {
      throw new ImportError(`${file} Extended JSON did not produce one document per array element.`);
    }

    const seen = new Set<string>();
    const raw: RawDoc[] = [];
    const docs: Document[] = [];
    rawParsed.forEach((source, index) => {
      if (!isRecord(source)) throw new ImportError(`${name}[${index}] is not a document.`);
      if (!Object.prototype.hasOwnProperty.call(source, "_id")) {
        throw new ImportError(`${name}[${index}] is missing _id. Replacement ids are not generated.`);
      }
      const id = source._id;
      if (typeof id === "number") {
        if (!Number.isSafeInteger(id)) throw new ImportError(`${name}[${index}] _id is not a safe integer.`);
      } else if (typeof id !== "string" || id.length === 0) {
        throw new ImportError(`${name}[${index}] _id must be a string or integer.`);
      }
      const idKey = `${typeof id}:${String(id)}`;
      if (seen.has(idKey)) throw new ImportError(`${name} contains duplicate _id ${String(id)}.`);
      seen.add(idKey);
      for (const key of Object.keys(source)) {
        if (/[A-Z]/.test(key)) {
          throw new ImportError(`${name}[${index}] has top-level field ${key}. Import stopped so names are not rewritten.`);
        }
      }

      const parsed = extended[index];
      if (!isRecord(parsed)) throw new ImportError(`${name}[${index}] did not parse as a document.`);
      assertDates(source, parsed, `${name}[${index}]`);
      noteFractional(source, name, fractional);
      raw.push(source);
      docs.push(preserveValue(parsed, name) as Document);
    });
    collections.push({ name, raw, docs });
  }

  return { collections, fractionalFields: [...fractional].sort() };
}

function assertDates(source: unknown, parsed: unknown, label: string): void {
  const iso = dateLiteral(source);
  if (iso !== null) {
    if (!(parsed instanceof Date) || parsed.getTime() !== Date.parse(iso)) {
      throw new ImportError(`${label} date was not preserved.`);
    }
    return;
  }
  if (Array.isArray(source)) {
    if (!Array.isArray(parsed) || source.length !== parsed.length) {
      throw new ImportError(`${label} array shape changed during Extended JSON parse.`);
    }
    source.forEach((item, index) => assertDates(item, parsed[index], `${label}[${index}]`));
    return;
  }
  if (!isRecord(source)) return;
  if (!isRecord(parsed)) throw new ImportError(`${label} object shape changed during Extended JSON parse.`);
  for (const [key, nested] of Object.entries(source)) {
    assertDates(nested, parsed[key], `${label}.${key}`);
  }
}

function noteFractional(value: unknown, label: string, fractional: Set<string>): void {
  if (dateLiteral(value)) return;
  if (typeof value === "number") {
    if (!Number.isInteger(value)) fractional.add(label.replace(/\[\d+\]/g, ""));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => noteFractional(item, `${label}[${index}]`, fractional));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    noteFractional(nested, `${label}.${key}`, fractional);
  }
}

function unwrapBson(value: unknown): unknown {
  const numeric = bsonNumber(value);
  return numeric ? numeric.value : value;
}

/** `promoteValues: false` leaves command results such as counts as BSON numbers. */
function asNumber(value: unknown): number {
  const unwrapped = unwrapBson(value);
  if (typeof unwrapped !== "number" || !Number.isFinite(unwrapped)) {
    throw new ImportError("Expected a numeric count from MongoDB.");
  }
  return unwrapped;
}

function bsonNumber(value: unknown): { type: "int" | "long" | "double"; value: number } | null {
  if (value instanceof Int32) return { type: "int", value: value.value };
  if (value instanceof Long) return { type: "long", value: value.toNumber() };
  if (value instanceof Double) return { type: "double", value: value.value };
  return null;
}

function idKey(value: unknown): string {
  const numeric = bsonNumber(value);
  if (numeric) return `n:${numeric.value}`;
  if (typeof value === "number") return `n:${value}`;
  if (typeof value === "string") return `s:${value}`;
  throw new ImportError(`Unusable _id type ${value === null ? "null" : typeof value}.`);
}

function valuesEqual(source: unknown, actual: unknown, label: string, diffs: string[]): void {
  if (diffs.length >= 20) return;
  const iso = dateLiteral(source);
  if (iso !== null) {
    if (!(actual instanceof Date) || actual.getTime() !== Date.parse(iso)) diffs.push(`${label}: date mismatch`);
    return;
  }
  if (typeof source === "number") {
    const stored = bsonNumber(actual);
    const expectedType = expectedNumericType(source);
    if (!stored || stored.type !== expectedType || !Object.is(stored.value, source)) {
      diffs.push(
        `${label}: expected ${expectedType} ${source}, got ${stored ? `${stored.type} ${stored.value}` : typeof actual}`
      );
    }
    return;
  }
  if (Array.isArray(source)) {
    if (!Array.isArray(actual) || actual.length !== source.length) {
      diffs.push(`${label}: array mismatch`);
      return;
    }
    source.forEach((item, index) => valuesEqual(item, actual[index], `${label}[${index}]`, diffs));
    return;
  }
  if (isRecord(source)) {
    if (!isRecord(actual)) {
      diffs.push(`${label}: expected object`);
      return;
    }
    const sourceKeys = Object.keys(source).sort();
    const actualKeys = Object.keys(actual).sort();
    if (sourceKeys.join("\0") !== actualKeys.join("\0")) {
      diffs.push(`${label}: fields ${sourceKeys.join(",")} vs ${actualKeys.join(",")}`);
    }
    for (const key of sourceKeys) {
      if (!Object.prototype.hasOwnProperty.call(actual, key)) continue;
      const next = `${label}.${key}`;
      if (key.includes("password")) {
        if (source[key] !== actual[key]) diffs.push(`${next}: mismatch`);
        continue;
      }
      valuesEqual(source[key], actual[key], next, diffs);
    }
    return;
  }
  if (!Object.is(source, actual)) {
    diffs.push(label.includes("password") ? `${label}: mismatch` : `${label}: value mismatch`);
  }
}

function findRaw(raw: RawDoc[], id: number | string): RawDoc | undefined {
  return raw.find((doc) => doc._id === id);
}

async function collectionState(
  db: ReturnType<MongoClient["db"]>,
  name: string
): Promise<{ exists: boolean; count: number }> {
  const listed = await db.listCollections({ name }).toArray();
  if (listed.length === 0) return { exists: false, count: 0 };
  return { exists: true, count: asNumber(await db.collection(name).countDocuments()) };
}

async function dropScratch(db: ReturnType<MongoClient["db"]>): Promise<string[]> {
  const dropped: string[] = [];
  const listed = await db.listCollections().toArray();
  for (const entry of listed) {
    if (!entry.name.startsWith(SCRATCH_PREFIX)) continue;
    await db.collection(entry.name).drop();
    dropped.push(entry.name);
  }
  return dropped;
}

async function insertScratch(
  db: ReturnType<MongoClient["db"]>,
  loaded: LoadedCollection
): Promise<void> {
  const scratchName = `${SCRATCH_PREFIX}${loaded.name}`;
  const scratch = db.collection(scratchName);
  try {
    for (let offset = 0; offset < loaded.docs.length; offset += BATCH_SIZE) {
      const batch = loaded.docs.slice(offset, offset + BATCH_SIZE);
      let inserted = 0;
      try {
        const result = await scratch.insertMany(batch, { ordered: true });
        inserted = asNumber(result.insertedCount);
      } catch (error) {
        const written = asNumber(await scratch.countDocuments());
        const writeErrors = error instanceof MongoBulkWriteError ? error.writeErrors : undefined;
        const detail = writeErrors
          ? `writeErrors=${Array.isArray(writeErrors) ? writeErrors.length : 1}`
          : "";
        const message = error instanceof Error ? error.message : "insert failed";
        throw new ImportError(
          `${loaded.name}: insert stopped after ${written} of ${loaded.docs.length} documents. ${detail} ${message}`.trim()
        );
      }
      if (inserted !== batch.length) {
        const written = asNumber(await scratch.countDocuments());
        throw new ImportError(
          `${loaded.name}: batch inserted ${inserted} of ${batch.length} (scratch total ${written} of ${loaded.docs.length}). Failed documents were not skipped.`
        );
      }
    }
    const actual = asNumber(await scratch.countDocuments());
    if (actual !== loaded.docs.length) {
      throw new ImportError(`${loaded.name}: scratch count ${actual} does not match source ${loaded.docs.length}.`);
    }
  } catch (error) {
    await scratch.drop().catch(() => undefined);
    throw error;
  }
}

async function importCollections(
  db: ReturnType<MongoClient["db"]>,
  collections: LoadedCollection[],
  confirmOverwrite: boolean
): Promise<string[]> {
  const states = new Map<string, { exists: boolean; count: number }>();
  const blocked: string[] = [];
  for (const loaded of collections) {
    const state = await collectionState(db, loaded.name);
    states.set(loaded.name, state);
    if (state.count > 0) blocked.push(`${loaded.name} (${state.count})`);
  }
  if (blocked.length > 0 && !confirmOverwrite) {
    throw new ImportError(
      `Refusing import: these aha_dev collections already have documents: ${blocked.join(", ")}. No collections were changed. Re-run with --confirm-overwrite to drop and replace only the export collections in ${DATABASE}.`
    );
  }
  if (confirmOverwrite && blocked.length > 0) {
    console.log(`--confirm-overwrite: replacing non-empty collections in ${DATABASE}: ${blocked.join(", ")}`);
  }

  const droppedScratch = await dropScratch(db);
  if (droppedScratch.length > 0) {
    console.log(`Removed leftover scratch collections: ${droppedScratch.join(", ")}`);
  }

  const replaced: string[] = [];
  try {
    for (const loaded of collections) {
      await insertScratch(db, loaded);
    }
    for (const loaded of collections) {
      const state = states.get(loaded.name);
      const scratch = db.collection(`${SCRATCH_PREFIX}${loaded.name}`);
      await scratch.rename(loaded.name, { dropTarget: Boolean(state?.exists) });
      const count = asNumber(await db.collection(loaded.name).countDocuments());
      if (count !== loaded.docs.length) {
        throw new ImportError(
          `${loaded.name}: count after rename is ${count}, source is ${loaded.docs.length}. Already replaced: ${replaced.join(", ") || "(none)"}.`
        );
      }
      replaced.push(loaded.name);
      console.log(`imported ${loaded.name} ${count}`);
    }
  } catch (error) {
    const leftover = await dropScratch(db);
    const message = error instanceof Error ? error.message : "import failed";
    throw new ImportError(
      `${message} Scratch collections removed: ${leftover.join(", ") || "(none)"}. Replaced before the failure: ${replaced.join(", ") || "(none)"}.`
    );
  }
  return replaced;
}

async function validate(db: ReturnType<MongoClient["db"]>, collections: LoadedCollection[]): Promise<string[]> {
  const lines: string[] = [];
  const failures: string[] = [];
  let sourceTotal = 0;
  let databaseTotal = 0;

  for (const loaded of collections) {
    sourceTotal += loaded.raw.length;
    const state = await collectionState(db, loaded.name);
    databaseTotal += state.count;
    if (state.count !== loaded.raw.length) {
      failures.push(`${loaded.name}: database ${state.count}, source ${loaded.raw.length}`);
      lines.push(`FAIL ${loaded.name} db=${state.count} source=${loaded.raw.length}`);
      continue;
    }
    const stored = await db.collection(loaded.name).find({}).toArray();
    if (stored.length !== loaded.raw.length) {
      failures.push(`${loaded.name}: read ${stored.length}, source ${loaded.raw.length}`);
      continue;
    }
    const byId = new Map<string, Document>();
    for (const doc of stored) {
      const key = idKey(doc._id);
      if (byId.has(key)) failures.push(`${loaded.name}: duplicate stored _id ${key}`);
      byId.set(key, doc);
    }
    for (const source of loaded.raw) {
      const actual = byId.get(idKey(source._id));
      if (!actual) {
        failures.push(`${loaded.name}: missing _id ${String(source._id)}`);
        continue;
      }
      const diffs: string[] = [];
      valuesEqual(source, actual, loaded.name, diffs);
      for (const diff of diffs) failures.push(diff);
      byId.delete(idKey(source._id));
    }
    for (const extra of byId.keys()) failures.push(`${loaded.name}: extra document ${extra}`);
    lines.push(`ok ${loaded.name} ${state.count}`);
  }

  lines.push(`source documents ${sourceTotal}`);
  lines.push(`database documents ${databaseTotal}`);
  if (sourceTotal !== databaseTotal) failures.push(`total documents differ: database ${databaseTotal}, source ${sourceTotal}`);

  const representativeFailures = verifyRepresentative(collections, db);
  failures.push(...(await representativeFailures));

  if (failures.length > 0) {
    lines.push("discrepancies:");
    for (const failure of failures.slice(0, 40)) lines.push(`- ${failure}`);
    if (failures.length > 40) lines.push(`- ${failures.length - 40} more`);
  } else {
    lines.push("discrepancies: none");
  }
  return lines.concat(failures.length > 0 ? ["__FAILED__"] : []);
}

async function verifyRepresentative(
  collections: LoadedCollection[],
  db: ReturnType<MongoClient["db"]>
): Promise<string[]> {
  const failures: string[] = [];
  const byName = new Map(collections.map((collection) => [collection.name, collection]));

  function requireDoc(name: string, id: number | string): RawDoc {
    const loaded = byName.get(name);
    const doc = loaded ? findRaw(loaded.raw, id) : undefined;
    if (!doc) {
      failures.push(`${name} sample _id ${String(id)} is missing from the export`);
      return { _id: id };
    }
    return doc;
  }

  const booking = requireDoc("bookings", 7);
  const rated = byName.get("bookings")?.raw.find((doc) => doc.exchange_rate_to_kes === 129.5);
  if (!rated) failures.push("bookings sample with exchange_rate_to_kes 129.5 is missing from the export");
  const tour = requireDoc("tours", 4);
  const payment = requireDoc("payments", 16);
  const stay = requireDoc("hotel_bookings", 192);
  const expense = requireDoc("expenses", 2);
  const owners = (byName.get("company_memberships")?.raw ?? []).filter((doc) => doc.role === "owner");
  if (owners.length === 0) failures.push("company_memberships has no owner rows in the export");

  const checks: Array<{ collection: string; id: unknown; field: string; expected: unknown }> = [
    { collection: "bookings", id: booking._id, field: "company_id", expected: booking.company_id },
    { collection: "bookings", id: booking._id, field: "total_price", expected: booking.total_price },
    { collection: "bookings", id: booking._id, field: "customer_id", expected: booking.customer_id },
    { collection: "bookings", id: booking._id, field: "tour_id", expected: booking.tour_id },
    { collection: "tours", id: tour._id, field: "price", expected: tour.price },
    { collection: "tours", id: tour._id, field: "rating", expected: tour.rating },
    { collection: "tours", id: tour._id, field: "slug", expected: tour.slug },
    { collection: "payments", id: payment._id, field: "amount", expected: payment.amount },
    { collection: "payments", id: payment._id, field: "booking_id", expected: payment.booking_id },
    { collection: "payments", id: payment._id, field: "company_id", expected: payment.company_id },
    { collection: "hotel_bookings", id: stay._id, field: "company_id", expected: stay.company_id },
    { collection: "hotel_bookings", id: stay._id, field: "room_id", expected: stay.room_id },
    { collection: "hotel_bookings", id: stay._id, field: "total_amount", expected: stay.total_amount },
    { collection: "expenses", id: expense._id, field: "company_id", expected: expense.company_id },
    { collection: "expenses", id: expense._id, field: "amount", expected: expense.amount },
    { collection: "expenses", id: expense._id, field: "category", expected: expense.category },
  ];
  if (rated) {
    checks.push({
      collection: "bookings",
      id: rated._id,
      field: "exchange_rate_to_kes",
      expected: rated.exchange_rate_to_kes,
    });
  }

  for (const check of checks) {
    const idFilter = typeof check.id === "number" ? new Int32(check.id) : check.id;
    const [row] = await db
      .collection(check.collection)
      .aggregate<{ value: unknown; valueType: string }>([
        { $match: { _id: idFilter } },
        { $project: { _id: 0, value: `$${check.field}`, valueType: { $type: `$${check.field}` } } },
      ])
      .toArray();
    if (!row) {
      failures.push(`${check.collection} _id ${String(check.id)} was not found for ${check.field}`);
      continue;
    }
    const expectedType =
      typeof check.expected === "number"
        ? expectedNumericType(check.expected)
        : check.expected === null
          ? "null"
          : typeof check.expected === "string"
            ? "string"
            : "other";
    const actualValue = unwrapBson(row.value);
    if (row.valueType !== expectedType || !Object.is(actualValue, check.expected)) {
      failures.push(
        `${check.collection}.${check.field} _id ${String(check.id)}: expected ${expectedType} ${String(check.expected)}, got ${row.valueType} ${String(actualValue)}`
      );
    }
  }

  for (const name of REPRESENTATIVE) {
    const loaded = byName.get(name);
    if (!loaded) failures.push(`representative collection ${name} was not in the export`);
  }

  const companyNames = ["aha", "ewc", "bth"];
  for (const companyId of companyNames) {
    const source = findRaw(byName.get("companies")?.raw ?? [], companyId);
    const [row] = await db
      .collection("companies")
      .aggregate<{ name: string; idType: string }>([
        { $match: { _id: companyId } },
        { $project: { _id: 0, name: "$name", idType: { $type: "$_id" } } },
      ])
      .toArray();
    if (!source || !row || row.idType !== "string" || row.name !== source.name) {
      failures.push(`companies _id ${companyId} was not preserved as a string id`);
    }
  }

  for (const owner of owners) {
    const idFilter = new Int32(owner._id as number);
    const [row] = await db
      .collection("company_memberships")
      .aggregate<{ role: string; companyId: string; userId: number; idType: string }>([
        { $match: { _id: idFilter } },
        {
          $project: {
            _id: 0,
            role: "$role",
            companyId: "$company_id",
            userId: "$user_id",
            idType: { $type: "$_id" },
          },
        },
      ])
      .toArray();
    const userId = unwrapBson(row?.userId);
    if (!row || row.idType !== "int" || row.role !== "owner" || row.companyId !== owner.company_id || userId !== owner.user_id) {
      failures.push(
        `company_memberships owner _id ${String(owner._id)} company ${String(owner.company_id)} was not preserved`
      );
    }
  }

  const dateChecks: Array<{ collection: string; id: number; field: string }> = [
    { collection: "bookings", id: 7, field: "created_at" },
    { collection: "payments", id: 16, field: "recorded_at" },
    { collection: "hotel_bookings", id: 192, field: "check_in_date" },
    { collection: "expenses", id: 2, field: "incurred_at" },
  ];
  for (const check of dateChecks) {
    const source = requireDoc(check.collection, check.id);
    const iso = dateLiteral(source[check.field]);
    const [row] = await db
      .collection(check.collection)
      .aggregate<{ value: Date; valueType: string }>([
        { $match: { _id: new Int32(check.id) } },
        { $project: { _id: 0, value: `$${check.field}`, valueType: { $type: `$${check.field}` } } },
      ])
      .toArray();
    if (!iso || !row || row.valueType !== "date" || !(row.value instanceof Date) || row.value.getTime() !== Date.parse(iso)) {
      failures.push(`${check.collection}.${check.field} _id ${check.id} is not the source date`);
    }
  }

  return failures;
}

function printRepresentative(collections: LoadedCollection[]): void {
  const byName = new Map(collections.map((collection) => [collection.name, collection]));
  const booking = findRaw(byName.get("bookings")?.raw ?? [], 7);
  const rated = byName.get("bookings")?.raw.find((doc) => doc.exchange_rate_to_kes === 129.5);
  const tour = findRaw(byName.get("tours")?.raw ?? [], 4);
  const payment = findRaw(byName.get("payments")?.raw ?? [], 16);
  const stay = findRaw(byName.get("hotel_bookings")?.raw ?? [], 192);
  const expense = findRaw(byName.get("expenses")?.raw ?? [], 2);
  const owners = (byName.get("company_memberships")?.raw ?? []).filter((doc) => doc.role === "owner");
  console.log(
    `sample booking _id ${String(booking?._id)} company_id=${String(booking?.company_id)} total_price=${String(booking?.total_price)} customer_id=${String(booking?.customer_id)} tour_id=${String(booking?.tour_id)}`
  );
  console.log(
    `sample exchange rate booking _id ${String(rated?._id)} exchange_rate_to_kes=${String(rated?.exchange_rate_to_kes)}`
  );
  console.log(`sample tour _id ${String(tour?._id)} price=${String(tour?.price)} rating=${String(tour?.rating)}`);
  console.log(
    `sample payment _id ${String(payment?._id)} amount=${String(payment?.amount)} booking_id=${String(payment?.booking_id)} company_id=${String(payment?.company_id)}`
  );
  console.log(
    `sample hotel stay _id ${String(stay?._id)} company_id=${String(stay?.company_id)} room_id=${String(stay?.room_id)} total_amount=${String(stay?.total_amount)}`
  );
  console.log(
    `sample expense _id ${String(expense?._id)} company_id=${String(expense?.company_id)} amount=${String(expense?.amount)} category=${String(expense?.category)}`
  );
  for (const owner of owners) {
    console.log(
      `sample owner membership _id ${String(owner._id)} user_id=${String(owner.user_id)} company_id=${String(owner.company_id)} role=${String(owner.role)}`
    );
  }
  console.log("sample companies aha, ewc, bth use string _id values");
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  assertSafeUri(cli.uri);
  if (process.env.MONGODB_URI || process.env.MONGODB_DB) {
    console.log("MONGODB_URI and MONGODB_DB from the environment are ignored by this importer.");
  }
  const directory = exportDirectory();
  const { collections, fractionalFields } = loadExport(directory);
  const documents = collections.reduce((sum, collection) => sum + collection.docs.length, 0);
  console.log(`export ${directory}`);
  console.log(`collections ${collections.length}`);
  console.log(`documents ${documents}`);
  console.log(`fractional fields ${fractionalFields.join(", ") || "(none)"}`);
  console.log(`target ${DATABASE} via ${DEFAULT_URI === cli.uri ? DEFAULT_URI : "explicit --uri"}`);

  const options: MongoClientOptions = {
    promoteValues: false,
    promoteLongs: false,
    serverSelectionTimeoutMS: 5_000,
    connectTimeoutMS: 10_000,
  };
  const client = new MongoClient(cli.uri, options);
  try {
    try {
      await client.connect();
    } catch (error) {
      const message = error instanceof Error ? error.message : "connection failed";
      throw new ImportError(
        `Cannot connect to local MongoDB. Start the Windows service with: Start-Service MongoDB. ${message}`
      );
    }
    const servers = assertConnectedLocally(client);
    const db = client.db(DATABASE);
    if (db.databaseName !== DATABASE) {
      throw new ImportError(`Refusing import: client selected database ${db.databaseName}.`);
    }
    console.log(`connected ${servers.join(", ")} database ${db.databaseName}`);

    if (!cli.check) {
      await importCollections(db, collections, cli.confirmOverwrite);
    }

    const report = await validate(db, collections);
    const failed = report.includes("__FAILED__");
    for (const line of report) {
      if (line !== "__FAILED__") console.log(line);
    }
    if (!failed) printRepresentative(collections);
    if (failed) {
      throw new ImportError("Validation failed. Counts or document values do not match the export.");
    }
    console.log(cli.check ? "check passed" : "import passed");
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "import failed";
  console.error(message);
  if (!(error instanceof ImportError) && error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exitCode = 1;
});
