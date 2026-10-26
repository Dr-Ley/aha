import { getTableColumns, getTableName, is } from "drizzle-orm";
import { Table } from "drizzle-orm";
import { getDb } from "@/lib/mongo-client";
import { allocateIntegerId, readMaxIntegerId, storeIdentity } from "@/lib/mongo-ids";

type SqlNode = { queryChunks: unknown[] };
type ColumnLike = { name: string; table: object; keyAsName?: boolean };
type Row = Record<string, unknown>;

type Join = {
  table: object;
  on: unknown;
  kind: "inner" | "left";
};

function isSql(value: unknown): value is SqlNode {
  return Boolean(value && typeof value === "object" && Array.isArray((value as SqlNode).queryChunks));
}

function isColumn(value: unknown): value is ColumnLike {
  return Boolean(
    value &&
      typeof value === "object" &&
      "name" in value &&
      "table" in value &&
      "config" in value
  );
}

function isParam(value: unknown): value is { value: unknown } {
  return Boolean(value && typeof value === "object" && value.constructor?.name === "Param");
}

function isStringChunk(value: unknown): value is { value: string[] } {
  return Boolean(value && typeof value === "object" && value.constructor?.name === "StringChunk");
}

function chunkText(value: unknown): string {
  return isStringChunk(value) ? value.value.join("") : "";
}

function columnKey(column: ColumnLike): string {
  try {
    const columns = getTableColumns(column.table as never) as Record<string, { name: string }>;
    for (const [key, candidate] of Object.entries(columns)) {
      if (candidate === (column as object) || candidate.name === column.name) return key;
    }
  } catch {
    /* fall through */
  }
  return column.name.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function tableName(table: object): string {
  return getTableName(table as never);
}

/**
 * Stored documents use the Postgres column name (`company_id`) and keep the
 * primary key in `_id`. Drizzle keys (`companyId`, `id`) exist only in memory.
 * Filters and writes name exactly one stored field. They do not $or a
 * camelCase twin, so two disagreeing company fields cannot both match.
 */
export type FindOptions = {
  /** Inclusion projection. `_id` is listed explicitly when the caller needs it. */
  projection?: Record<string, 1>;
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
};

export type DocumentCollection = {
  find(filter: Row, options?: FindOptions): { toArray(): Promise<Row[]> };
  insertOne(doc: Row): Promise<unknown>;
  updateOne(
    filter: Row,
    update: { $set?: Row; $max?: Row },
    options?: { upsert?: boolean }
  ): Promise<unknown>;
  deleteMany(filter: Row): Promise<unknown>;
  findOneAndUpdate(
    filter: Row,
    update: { $inc?: Record<string, number>; $set?: Row },
    options: { upsert?: boolean; returnDocument?: "before" | "after" }
  ): Promise<Row | null>;
  aggregate?(pipeline: Row[]): { toArray(): Promise<Row[]> };
};

export type DocumentStore = {
  collection(name: string): DocumentCollection;
  /** Stable per database so id floors are not repeated or mixed across databases. */
  idScope?: string;
};

const MONGO_ID = Symbol("mongoId");

type StoredColumn = { name: string; columnType?: string };

function tableColumns(table: object): Record<string, StoredColumn> {
  return getTableColumns(table as never) as Record<string, StoredColumn>;
}

function columnForField(columns: Record<string, StoredColumn>, field: string): StoredColumn | undefined {
  const direct = columns[field];
  if (direct) return direct;
  for (const column of Object.values(columns)) {
    if (column.name === field) return column;
  }
  return undefined;
}

/** SQL `date` columns are calendar days. BSON dates from the import stay on that UTC day. */
function presentStoredValue(column: StoredColumn | undefined, value: unknown): unknown {
  const unwrapped = unwrapExtended(value);
  if (
    column?.columnType === "PgDateString" &&
    unwrapped instanceof Date &&
    !Number.isNaN(unwrapped.getTime())
  ) {
    return unwrapped.toISOString().slice(0, 10);
  }
  return unwrapped;
}

/** One stored name for a Drizzle key. `id` is `_id`, never a second `id` field. */
function storedFieldName(table: object, key: string): string {
  if (key === "id" || key === "_id") return "_id";
  const column = tableColumns(table)[key];
  if (column?.name) return column.name;
  return key;
}

function columnMap(table: object): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, column] of Object.entries(tableColumns(table))) {
    map.set(column.name, key);
    map.set(key, key);
  }
  return map;
}

function camelizeKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || value instanceof Date) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Compass imports of extended JSON keep dates as `{ $date: "..." }`. */
function unwrapExtended(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(unwrapExtended);
  if (value instanceof Date || !isPlainObject(value)) return value;
  if (Object.keys(value).length === 1 && "$date" in value) {
    const raw = value.$date;
    if (typeof raw === "string" || typeof raw === "number") return new Date(raw);
    if (isPlainObject(raw) && typeof raw.$numberLong === "string") return new Date(Number(raw.$numberLong));
  }
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) out[key] = unwrapExtended(nested);
  return out;
}

function isScalarId(value: unknown): value is string | number {
  return typeof value === "string" || typeof value === "number";
}

/**
 * App-facing row. Canonical SQL names win when a camelCase twin is also present.
 * A scalar `_id` is the record id, including when a stale `id` field disagrees.
 */
function normalizeDocument(doc: Row | null | undefined, table?: object): Row | null {
  if (!doc) return null;
  const columns = table ? columnMap(table) : new Map<string, string>();
  const stored = table ? tableColumns(table) : {};
  const row: Row = {};
  for (const [key, value] of Object.entries(doc)) {
    if (key === "_id") continue;
    const mapped = columns.get(key);
    if (mapped && mapped !== key) row[mapped] = presentStoredValue(columnForField(stored, key), value);
  }
  for (const [key, value] of Object.entries(doc)) {
    if (key === "_id") continue;
    if (columns.get(key) === key) {
      if (!(key in row)) row[key] = presentStoredValue(columnForField(stored, key), value);
      continue;
    }
    if (!columns.has(key)) {
      const camel = camelizeKey(key);
      if (!(camel in row)) row[camel] = unwrapExtended(value);
    }
  }
  if (isScalarId(doc._id)) row.id = doc._id;
  else if (!isScalarId(row.id) && isScalarId(doc._id)) row.id = doc._id;
  Object.defineProperty(row, MONGO_ID, { value: doc._id, enumerable: false });
  return row;
}

function mongoIdOf(row: Row): unknown {
  const tagged = (row as Row & { [MONGO_ID]?: unknown })[MONGO_ID];
  return tagged !== undefined ? tagged : row.id;
}

/** Persist Drizzle keys under their SQL names. Does not write camelCase aliases. */
function toStoredDocument(value: Row, table: object): Row {
  const columns = tableColumns(table);
  const stored: Row = {};
  for (const [key, val] of Object.entries(value)) {
    if (val === undefined) continue;
    if (key === "id" || key === "_id") {
      if (stored._id == null && isScalarId(val)) stored._id = val;
      continue;
    }
    const sqlName = columns[key]?.name;
    if (sqlName) {
      stored[sqlName] = val;
      continue;
    }
    if (!(key in stored)) stored[key] = val;
  }
  return stored;
}

/** Rename filter keys to stored names. One field per key — no alias $or. */
function toStoredFilter(filter: Row, table: object): Row {
  const parts: Row[] = [];
  for (const [key, expected] of Object.entries(filter)) {
    if ((key === "$and" || key === "$or") && Array.isArray(expected)) {
      parts.push({ [key]: expected.map((part) => toStoredFilter(part as Row, table)) });
      continue;
    }
    parts.push({ [storedFieldName(table, key)]: expected });
  }
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

type Token =
  | { kind: "col"; column: ColumnLike }
  | { kind: "val"; value: unknown }
  | { kind: "list"; value: unknown[] }
  | { kind: "text"; text: string }
  | { kind: "sql"; node: SqlNode };

function tokenize(node: SqlNode): Token[] {
  const tokens: Token[] = [];
  for (const chunk of node.queryChunks) {
    if (isStringChunk(chunk)) {
      const text = chunk.value.join("");
      if (text.trim()) tokens.push({ kind: "text", text: text.trim() });
    } else if (isColumn(chunk)) {
      tokens.push({ kind: "col", column: chunk });
    } else if (isParam(chunk)) {
      tokens.push({ kind: "val", value: chunk.value });
    } else if (Array.isArray(chunk)) {
      tokens.push({
        kind: "list",
        value: chunk.map((item) => (isParam(item) ? item.value : item)),
      });
    } else if (isSql(chunk)) {
      tokens.push({ kind: "sql", node: chunk });
    }
  }
  return tokens;
}

function comparison(op: string, key: string, value: unknown): Row {
  const normalized = op.replace(/\s+/g, " ").trim();
  if (normalized === "=" || normalized === "::text =") return { [key]: value };
  if (normalized === "<>" || normalized === "!=" || normalized === "::text <>") return { [key]: { $ne: value } };
  if (normalized === ">") return { [key]: { $gt: value } };
  if (normalized === ">=") return { [key]: { $gte: value } };
  if (normalized === "<") return { [key]: { $lt: value } };
  if (normalized === "<=") return { [key]: { $lte: value } };
  if (normalized === "in") return { [key]: { $in: Array.isArray(value) ? value : [value] } };
  if (normalized === "not in") return { [key]: { $nin: Array.isArray(value) ? value : [value] } };
  if (normalized === "is null") return { [key]: null };
  if (normalized === "is not null") return { [key]: { $ne: null } };
  if (normalized === "like" && typeof value === "string") {
    const pattern = `^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".")}$`;
    return { [key]: { $regex: pattern, $options: "i" } };
  }
  return { __unparsed: normalized };
}

type RowPredicate = ((row: Row) => boolean) & { retainedFields?: string[] };

function arrivalPredicate(node: SqlNode): RowPredicate | null {
  const text = node.queryChunks.map((chunk) => (isStringChunk(chunk) ? chunk.value.join("") : "")).join("");
  if (!text.includes("left(trim")) return null;
  let embedded: unknown;
  for (const chunk of node.queryChunks) {
    if (isParam(chunk)) embedded = chunk.value;
    else if (typeof chunk === "string") embedded = chunk;
  }
  const today = embedded == null ? "" : String(embedded);
  const predicate: RowPredicate = (row) => {
    const start = String(row.startDate ?? "").trim();
    const travel = String(row.travelDate ?? "").trim();
    const day = start.length >= 10 ? start.slice(0, 10) : travel.slice(0, 10);
    return day === today;
  };
  predicate.retainedFields = ["startDate", "travelDate"];
  return predicate;
}

function conditionToFilter(node: unknown): Row | ((row: Row) => boolean) {
  if (!node) return {};
  if (!isSql(node)) return {};
  const special = arrivalPredicate(node);
  if (special) return special;
  let tokens = tokenize(node);
  if (tokens.length === 1 && tokens[0].kind === "sql") return conditionToFilter(tokens[0].node);
  if (tokens.length === 1 && tokens[0].kind === "text") {
    if (tokens[0].text === "false") return () => false;
    if (tokens[0].text === "true") return {};
  }
  const open = tokens[0];
  const close = tokens.at(-1);
  if (
    open?.kind === "text" &&
    open.text === "(" &&
    close?.kind === "text" &&
    close.text === ")"
  ) {
    const inner = tokens.slice(1, -1);
    if (inner.length === 1 && inner[0]?.kind === "sql") return conditionToFilter(inner[0].node);
    tokens = inner;
  }
  const joiner = tokens.find((token) => token.kind === "text" && (token.text === "and" || token.text === "or"));
  if (joiner && joiner.kind === "text") {
    const parts = tokens.filter((token) => token.kind === "sql").map((token) => conditionToFilter(token.node));
    if (parts.length > 0) return joinFilters(joiner.text === "or" ? "$or" : "$and", parts);
  }
  if (tokens[0]?.kind === "text" && tokens[0].text === "not" && tokens[1]?.kind === "sql") {
    const inner = conditionToFilter(tokens[1].node);
    return (row) => !matches(row, inner);
  }
  const columns = tokens.filter((token) => token.kind === "col");
  const operator = tokens.find((token) => token.kind === "text");
  const list = tokens.find((token) => token.kind === "list");
  const value = tokens.find((token) => token.kind === "val");
  if (columns.length === 2 && columns[0].kind === "col" && columns[1].kind === "col" && operator?.kind === "text" && operator.text === "=") {
    const left = columns[0].column;
    const right = columns[1].column;
    return (row) => row[columnKey(left)] === row[columnKey(right)] || row[`__${tableName(left)}.${columnKey(left)}`] === row[`__${tableName(right)}.${columnKey(right)}`];
  }
  if (columns[0]?.kind === "col" && operator?.kind === "text") {
    const cast = operator.text.match(/^(?:::text\s*)?(<>|=|!=)\s+'([^']*)'$/i);
    if (cast) {
      return comparison(cast[1] === "=" ? "=" : "<>", columnKey(columns[0].column), cast[2]);
    }
    const rhs = list?.kind === "list" ? list.value : value?.kind === "val" ? value.value : null;
    if (operator.text === "is null" || operator.text === "is not null" || rhs !== undefined) {
      return comparison(operator.text, columnKey(columns[0].column), rhs);
    }
  }
  return () => true;
}

function joinFilters(op: "$and" | "$or", parts: Array<Row | ((row: Row) => boolean)>): Row | ((row: Row) => boolean) {
  const predicates = parts.filter((part): part is (row: Row) => boolean => typeof part === "function");
  const objects = parts.filter((part): part is Row => typeof part !== "function");
  if (predicates.length === 0) {
    if (objects.length === 1) return objects[0];
    return { [op]: objects };
  }
  // $or cannot drop a branch. $and can send the object branches to MongoDB
  // and still evaluate functions after the documents are read.
  if (op === "$and") return { $and: [...objects, ...predicates] };
  return (row) => {
    const objectOk = objects.length === 0 || matches(row, { [op]: objects });
    const predOk = predicates.some((predicate) => predicate(row));
    return objectOk || predOk;
  };
}

function matches(row: Row, filter: Row | ((row: Row) => boolean)): boolean {
  if (typeof filter === "function") return filter(row);
  const entries = Object.entries(filter);
  if (entries.length === 0) return true;
  return entries.every(([key, expected]) => {
    if (key === "$and" && Array.isArray(expected)) return expected.every((part) => matches(row, part as Row));
    if (key === "$or" && Array.isArray(expected)) return expected.some((part) => matches(row, part as Row));
    if (key === "__unparsed") return true;
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      const ops = expected as Record<string, unknown>;
      if ("$ne" in ops) return row[key] !== ops.$ne;
      if ("$gt" in ops) return (row[key] as number) > (ops.$gt as number);
      if ("$gte" in ops) return (row[key] as number) >= (ops.$gte as number);
      if ("$lt" in ops) return (row[key] as number) < (ops.$lt as number);
      if ("$lte" in ops) return (row[key] as number) <= (ops.$lte as number);
      if ("$in" in ops) return (ops.$in as unknown[]).some((item) => item === row[key]);
      if ("$nin" in ops) return !(ops.$nin as unknown[]).some((item) => item === row[key]);
      if ("$regex" in ops) return new RegExp(String(ops.$regex), "i").test(String(row[key] ?? ""));
    }
    return row[key] === expected;
  });
}

function mongoFilter(filter: Row | ((row: Row) => boolean)): Row | null {
  if (typeof filter === "function") return null;
  if ("__unparsed" in filter) return null;
  if ("$and" in filter || "$or" in filter) {
    const key = "$and" in filter ? "$and" : "$or";
    const parts = filter[key] as Array<Row | ((row: Row) => boolean)>;
    if (key === "$or") {
      const translated = parts.map((part) => (typeof part === "function" ? null : mongoFilter(part)));
      if (translated.some((part) => part == null)) return null;
      return { $or: translated };
    }
    const pushed: Row[] = [];
    for (const part of parts) {
      if (typeof part === "function") continue;
      const translated = mongoFilter(part);
      if (translated) pushed.push(translated);
    }
    if (pushed.length === 0) return null;
    if (pushed.length === 1) return pushed[0];
    return { $and: pushed };
  }
  return filter;
}

function hasResidualPredicate(filter: Row | ((row: Row) => boolean)): boolean {
  if (typeof filter === "function") return true;
  if (!filter || typeof filter !== "object") return false;
  if ("__unparsed" in filter) return true;
  for (const [key, value] of Object.entries(filter)) {
    if ((key === "$and" || key === "$or") && Array.isArray(value)) {
      if (value.some((part) => hasResidualPredicate(part as Row))) return true;
    }
  }
  return false;
}

function predicateNeedsFullDocument(filter: Row | RowPredicate): boolean {
  if (typeof filter === "function") return filter.retainedFields == null;
  if (!filter || typeof filter !== "object") return false;
  for (const [key, value] of Object.entries(filter)) {
    if ((key === "$and" || key === "$or") && Array.isArray(value)) {
      if (value.some((part) => predicateNeedsFullDocument(part as Row))) return true;
    }
  }
  return false;
}

function sqlText(node: unknown): string {
  if (!isSql(node)) return "";
  return node.queryChunks
    .map((chunk) => {
      if (isStringChunk(chunk)) return chunk.value.join("");
      if (isColumn(chunk)) return chunk.name;
      if (isSql(chunk)) return sqlText(chunk);
      return "";
    })
    .join("");
}

function aggregateOf(value: unknown): "count" | "sum" | null {
  const text = sqlText(value).replace(/\s+/g, "").toLowerCase();
  if (text.startsWith("count(")) return "count";
  if (text.startsWith("sum(")) return "sum";
  return null;
}

function sumColumn(value: unknown): ColumnLike | null {
  if (!isSql(value)) return null;
  return value.queryChunks.find(isColumn) ?? null;
}

function orderSpec(value: unknown): { key: string; dir: 1 | -1 } | null {
  if (isColumn(value)) return { key: columnKey(value), dir: 1 };
  if (!isSql(value)) return null;
  const column = value.queryChunks.find(isColumn);
  if (!column) return null;
  const text = sqlText(value).toLowerCase();
  return { key: columnKey(column), dir: text.includes("desc") ? -1 : 1 };
}

function assignment(value: unknown, current: Row): unknown {
  if (!isSql(value)) return value;
  const text = sqlText(value).replace(/\s+/g, "");
  const column = value.queryChunks.find(isColumn);
  if (!column) return value;
  const currentValue = Number(current[columnKey(column)] ?? 0);
  if (text.includes("GREATEST(") && text.includes("-1,0)")) return Math.max(0, currentValue - 1);
  if (text.endsWith("+1")) return currentValue + 1;
  if (text.endsWith("-1")) return currentValue - 1;
  return value;
}

class Query implements Promise<any[]> {
  readonly [Symbol.toStringTag] = "Query";
  private table?: object;
  private selection?: Record<string, unknown> | null;
  private filter: Row | ((row: Row) => boolean) = {};
  private joins: Join[] = [];
  private orders: Array<{ key: string; dir: 1 | -1 }> = [];
  private lim?: number;
  private off = 0;
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private pendingValues?: Row | Row[];
  private setValues?: Row;
  private returnShape?: Record<string, unknown> | null;
  private source: () => Promise<DocumentStore>;

  constructor(
    mode: Query["mode"],
    table: object | undefined,
    selection: Record<string, unknown> | null | undefined,
    source: () => Promise<DocumentStore>
  ) {
    this.mode = mode;
    this.table = table;
    this.selection = selection;
    this.source = source;
  }

  private async collectionFor(table: object): Promise<DocumentCollection> {
    const store = await this.source();
    return store.collection(tableName(table));
  }

  private async nextId(name: string): Promise<number> {
    const store = await this.source();
    return allocateIntegerId(
      store.collection("counters"),
      name,
      () => readMaxIntegerId(store.collection(name)),
      storeIdentity(store, store.idScope)
    );
  }

  from(table: object) {
    this.table = table;
    return this;
  }

  where(condition?: unknown) {
    this.filter = conditionToFilter(condition);
    return this;
  }

  orderBy(...values: unknown[]) {
    this.orders = values.map(orderSpec).filter((item): item is { key: string; dir: 1 | -1 } => item != null);
    return this;
  }

  limit(count: number) {
    this.lim = count;
    return this;
  }

  offset(count: number) {
    this.off = count;
    return this;
  }

  innerJoin(table: object, on: unknown) {
    this.joins.push({ table, on, kind: "inner" });
    return this;
  }

  leftJoin(table: object, on: unknown) {
    this.joins.push({ table, on, kind: "left" });
    return this;
  }

  values(values: Row | Row[]) {
    this.pendingValues = values;
    return this;
  }

  set(values: Row) {
    this.setValues = values;
    return this;
  }

  returning(shape?: Record<string, unknown>) {
    this.returnShape = shape ?? null;
    return this;
  }

  catch<TResult = never>(
    onRejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<any[] | TResult> {
    return this.run().catch(onRejected);
  }

  finally(onFinally?: (() => void) | null): Promise<any[]> {
    return this.run().finally(onFinally);
  }

  then<TResult1 = any[], TResult2 = never>(
    onFulfilled?: ((value: any[]) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.run().then(onFulfilled, onRejected);
  }

  private async run(): Promise<any[]> {
    if (!this.table) return [];
    if (this.mode === "select") return this.runSelect();
    if (this.mode === "insert") return this.runInsert();
    if (this.mode === "update") return this.runUpdate();
    return this.runDelete();
  }

  private async matchedDocs(page: FindOptions | null = null): Promise<Row[]> {
    const collection = await this.collectionFor(this.table!);
    const translated = mongoFilter(this.filter);
    const query = translated ? toStoredFilter(translated, this.table!) : null;
    const projection =
      this.mode === "select"
        ? columnProjection(this.table!, this.selection, this.filter, this.retainedKeys(this.table!))
        : undefined;
    const options = findOptions(projection, page);
    const docs = (query ? await collection.find(query, options).toArray() : await collection.find({}, options).toArray())
      .map((doc) => normalizeDocument(doc, this.table!)!)
      .filter((row) => matches(row, this.filter));
    return docs;
  }

  private project(bundle: Map<string, Row | null>): Row {
    if (!this.selection) {
      if (this.joins.length === 0) return bundle.get(tableName(this.table!)) ?? {};
      const nested: Row = {};
      for (const [name, row] of bundle) nested[name] = row;
      return nested;
    }
    const projected: Row = {};
    for (const [key, value] of Object.entries(this.selection)) {
      if (is(value, Table)) {
        projected[key] = bundle.get(tableName(value as object)) ?? null;
      } else if (isColumn(value)) {
        const row = bundle.get(tableName(value.table));
        projected[key] = row ? row[columnKey(value)] ?? null : null;
      } else if (aggregateOf(value) === "count") {
        projected[key] = bundle.get("__count") ?? 0;
      } else if (aggregateOf(value) === "sum") {
        projected[key] = bundle.get("__sum") ?? 0;
      }
    }
    return projected;
  }

  /**
   * Sort, skip, and limit can be sent to MongoDB only when the stored page is
   * the result page. Joins, aggregates, residual predicates, and calendar-date
   * sorts are applied after the documents are read. MongoDB orders null below
   * every other value; the in-memory comparator keeps nulls last either way,
   * so a calendar-date sort stays here.
   */
  private pushedPage(): FindOptions | null {
    if (this.joins.length > 0) return null;
    if (this.selection && Object.values(this.selection).some((value) => aggregateOf(value))) return null;
    if (hasResidualPredicate(this.filter)) return null;
    if (this.orders.some((order) => tableColumns(this.table!)[order.key]?.columnType === "PgDateString")) return null;
    const options: FindOptions = {};
    if (this.orders.length > 0) {
      const sort: Record<string, 1 | -1> = {};
      for (const order of this.orders) sort[storedFieldName(this.table!, order.key)] = order.dir;
      options.sort = sort;
    }
    if (this.off > 0) options.skip = this.off;
    if (this.lim != null) options.limit = this.lim;
    if (!options.sort && options.skip == null && options.limit == null) return null;
    return options;
  }

  private retainedKeys(table: object): string[] {
    const name = tableName(table);
    const keys: string[] = [];
    for (const join of this.joins) {
      const pair = equalityColumns(join.on);
      if (!pair) continue;
      for (const column of pair) {
        if (tableName(column.table) === name) keys.push(columnKey(column));
      }
    }
    return keys;
  }

  private async relatedRows(join: Join, bundles: Array<Map<string, Row | null>>): Promise<Row[]> {
    const collection = await this.collectionFor(join.table);
    const joinName = tableName(join.table);
    const pair = equalityColumns(join.on);
    let filter: Row = {};
    const child = pair?.find((column) => tableName(column.table) === joinName);
    const parent = pair?.find((column) => column !== child);
    if (pair && child && parent) {
      const values: unknown[] = [];
      const seen = new Set<unknown>();
      for (const bundle of bundles) {
        const value = bundle.get(tableName(parent.table))?.[columnKey(parent)];
        if (value == null || seen.has(value)) continue;
        seen.add(value);
        values.push(value);
      }
      filter = { [storedFieldName(join.table, columnKey(child))]: { $in: values } };
    }
    const projection = columnProjection(join.table, this.selection, {}, this.retainedKeys(join.table));
    const docs = await collection.find(filter, findOptions(projection, null)).toArray();
    return docs.map((doc) => normalizeDocument(doc, join.table)!);
  }

  /**
   * count() and sum() cover the filtered set. When the filter translates and
   * there is no join, MongoDB reduces it. A limit on the query is ignored.
   * Residual predicates and joins stay on the in-memory path.
   */
  private async pushedAggregate(): Promise<Row[] | null> {
    if (!this.selection || this.joins.length > 0 || hasResidualPredicate(this.filter)) return null;
    const values = Object.values(this.selection);
    if (values.length === 0 || values.some((value) => !aggregateOf(value))) return null;
    const collection = await this.collectionFor(this.table!);
    if (!collection.aggregate) return null;
    const translated = mongoFilter(this.filter);
    const match = translated ? toStoredFilter(translated, this.table!) : {};
    let sumField: string | null = null;
    for (const value of values) {
      if (aggregateOf(value) !== "sum") continue;
      const column = sumColumn(value);
      if (!column || tableName(column.table) !== tableName(this.table!)) return null;
      sumField = storedFieldName(this.table!, columnKey(column));
    }
    const group: Row = { _id: null, __count: { $sum: 1 } };
    if (sumField) group.__sum = { $sum: `$${sumField}` };
    const [row] = await collection.aggregate([{ $match: match }, { $group: group }]).toArray();
    const bundle = new Map<string, Row | null>([
      ["__count", Number(row?.__count ?? 0) as unknown as Row],
      ["__sum", Number(row?.__sum ?? 0) as unknown as Row],
    ]);
    return [this.project(bundle)];
  }

  private async runSelect(): Promise<Row[]> {
    const aggregated = await this.pushedAggregate();
    if (aggregated) return aggregated;
    const page = this.pushedPage();
    const primaryName = tableName(this.table!);
    const rows = await this.matchedDocs(page);
    let bundles = rows.map((row) => new Map<string, Row | null>([[primaryName, row]]));

    for (const join of this.joins) {
      const next: Array<Map<string, Row | null>> = [];
      const joinName = tableName(join.table);
      const related = await this.relatedRows(join, bundles);
      for (const bundle of bundles) {
        const matchesRelated = related.filter((row) => {
          const view = new Map(bundle);
          view.set(joinName, row);
          return this.joinMatches(view, join.on);
        });
        if (matchesRelated.length === 0) {
          if (join.kind === "left") {
            const copy = new Map(bundle);
            copy.set(joinName, null);
            next.push(copy);
          }
          continue;
        }
        for (const row of matchesRelated) {
          const copy = new Map(bundle);
          copy.set(joinName, row);
          next.push(copy);
        }
      }
      bundles = next;
    }

    if (!page && this.orders.length > 0) {
      bundles.sort((a, b) => {
        for (const order of this.orders) {
          const av = this.lookup(a, order.key);
          const bv = this.lookup(b, order.key);
          if (av === bv) continue;
          if (av == null) return 1;
          if (bv == null) return -1;
          const compared = av > bv ? 1 : -1;
          return order.dir === -1 ? -compared : compared;
        }
        return 0;
      });
    }

    if (this.selection && Object.values(this.selection).some((value) => aggregateOf(value))) {
      const count = bundles.length;
      const sumField = Object.values(this.selection).find((value) => aggregateOf(value) === "sum");
      const column = sumField ? sumColumn(sumField) : null;
      const sum = column
        ? bundles.reduce((total, bundle) => total + Number(this.lookup(bundle, columnKey(column)) ?? 0), 0)
        : 0;
      const bundle = new Map<string, Row | null>([
        ["__count", count as unknown as Row],
        ["__sum", sum as unknown as Row],
      ]);
      return [this.project(bundle)];
    }
    const offset = page ? 0 : (this.off ?? 0);
    const limit = page ? undefined : this.lim;
    const sliced = bundles.slice(offset, limit == null ? undefined : offset + limit);
    return sliced.map((bundle) => this.project(bundle));
  }

  private lookup(bundle: Map<string, Row | null>, key: string): unknown {
    for (const row of bundle.values()) {
      if (row && key in row) return row[key];
    }
    return undefined;
  }

  private joinMatches(bundle: Map<string, Row | null>, on: unknown): boolean {
    if (!isSql(on)) return true;
    const tokens = tokenize(on);
    const columns = tokens.filter((token) => token.kind === "col");
    const operator = tokens.find((token) => token.kind === "text");
    if (columns.length === 2 && columns[0].kind === "col" && columns[1].kind === "col" && operator?.kind === "text" && operator.text === "=") {
      const leftRow = bundle.get(tableName(columns[0].column.table));
      const rightRow = bundle.get(tableName(columns[1].column.table));
      if (!leftRow || !rightRow) return false;
      return leftRow[columnKey(columns[0].column)] === rightRow[columnKey(columns[1].column)];
    }
    const flat: Row = {};
    for (const row of bundle.values()) {
      if (row) Object.assign(flat, row);
    }
    return matches(flat, conditionToFilter(on));
  }

  private async runInsert(): Promise<Row[]> {
    const collection = await this.collectionFor(this.table!);
    const name = tableName(this.table!);
    const incoming = Array.isArray(this.pendingValues) ? this.pendingValues : this.pendingValues ? [this.pendingValues] : [];
    const stored: Row[] = [];
    for (const value of incoming) {
      const doc = toStoredDocument(value, this.table!);
      if (doc._id == null) doc._id = await this.nextId(name);
      await collection.insertOne(doc);
      stored.push(normalizeDocument(doc, this.table!)!);
    }
    return this.returnShape === undefined ? stored : stored.map((row) => this.projectReturning(row));
  }

  private async runUpdate(): Promise<Row[]> {
    const collection = await this.collectionFor(this.table!);
    const docs = await this.matchedDocs();
    const updated: Row[] = [];
    for (const doc of docs) {
      const next: Row = { ...doc };
      const assigned: Row = {};
      for (const [key, value] of Object.entries(this.setValues ?? {})) {
        const resolved = assignment(value, doc);
        next[key] = resolved;
        assigned[key] = resolved;
      }
      const patch = toStoredDocument(assigned, this.table!);
      delete patch._id;
      if (Object.keys(patch).length > 0) {
        await collection.updateOne({ _id: mongoIdOf(doc) }, { $set: patch });
      }
      updated.push(next);
    }
    return this.returnShape === undefined ? updated : updated.map((row) => this.projectReturning(row));
  }

  private async runDelete(): Promise<Row[]> {
    const collection = await this.collectionFor(this.table!);
    const docs = await this.matchedDocs();
    if (docs.length > 0) {
      await collection.deleteMany({ _id: { $in: docs.map((doc) => mongoIdOf(doc)) } });
    }
    return this.returnShape === undefined ? docs : docs.map((row) => this.projectReturning(row));
  }

  private projectReturning(row: Row): Row {
    if (!this.returnShape) return row;
    const projected: Row = {};
    for (const [key, value] of Object.entries(this.returnShape)) {
      if (isColumn(value)) projected[key] = row[columnKey(value)] ?? null;
    }
    return projected;
  }
}

function findOptions(projection: Record<string, 1> | undefined, page: FindOptions | null): FindOptions | undefined {
  const options: FindOptions = {};
  if (projection) options.projection = projection;
  if (page?.sort) options.sort = page.sort;
  if (page?.skip != null) options.skip = page.skip;
  if (page?.limit != null) options.limit = page.limit;
  return Object.keys(options).length > 0 ? options : undefined;
}

function equalityColumns(on: unknown): [ColumnLike, ColumnLike] | null {
  if (!isSql(on)) return null;
  let tokens = tokenize(on);
  if (tokens.length === 1 && tokens[0].kind === "sql") return equalityColumns(tokens[0].node);
  const open = tokens[0];
  const close = tokens.at(-1);
  if (
    open?.kind === "text" &&
    open.text === "(" &&
    close?.kind === "text" &&
    close.text === ")"
  ) {
    const inner = tokens.slice(1, -1);
    if (inner.length === 1 && inner[0]?.kind === "sql") return equalityColumns(inner[0].node);
    tokens = inner;
  }
  const columns = tokens.filter((token) => token.kind === "col");
  const operator = tokens.find((token) => token.kind === "text");
  if (
    columns.length === 2 &&
    columns[0].kind === "col" &&
    columns[1].kind === "col" &&
    operator?.kind === "text" &&
    operator.text === "="
  ) {
    return [columns[0].column, columns[1].column];
  }
  return null;
}

/** Column selections become an inclusion projection. Whole-table and aggregate selects do not. */
function columnProjection(
  table: object,
  selection: Record<string, unknown> | null | undefined,
  filter: Row | RowPredicate = {},
  retainKeys: string[] = []
): Record<string, 1> | undefined {
  if (!selection) return undefined;
  if (predicateNeedsFullDocument(filter)) return undefined;
  const fields: Record<string, 1> = { _id: 1 };
  let sawColumn = false;
  for (const value of Object.values(selection)) {
    if (is(value, Table)) {
      if (tableName(value as object) === tableName(table)) return undefined;
      continue;
    }
    if (aggregateOf(value) || !isColumn(value)) return undefined;
    if (tableName(value.table) !== tableName(table)) continue;
    sawColumn = true;
    fields[storedFieldName(table, columnKey(value))] = 1;
  }
  if (!sawColumn && retainKeys.length === 0 && filterFieldKeys(filter).length === 0) return undefined;
  for (const key of filterFieldKeys(filter)) fields[storedFieldName(table, key)] = 1;
  for (const key of retainKeys) fields[storedFieldName(table, key)] = 1;
  return fields;
}

function filterFieldKeys(filter: Row | RowPredicate): string[] {
  if (typeof filter === "function") return filter.retainedFields ?? [];
  if (!filter) return [];
  const keys: string[] = [];
  for (const [key, value] of Object.entries(filter)) {
    if ((key === "$and" || key === "$or") && Array.isArray(value)) {
      for (const part of value) keys.push(...filterFieldKeys(part as Row));
      continue;
    }
    if (typeof value === "function") {
      keys.push(...filterFieldKeys(value as RowPredicate));
      continue;
    }
    if (key !== "__unparsed") keys.push(key);
  }
  return keys;
}

function sqlStatement(query: unknown): string {
  return sqlText(query).trim();
}

type Database = {
  select(selection?: Record<string, unknown>): Query;
  insert(table: object): Query;
  update(table: object): Query;
  delete(table: object): Query;
  execute(query: unknown): Promise<{ rows: Row[] }>;
  transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T>;
};

export function createQueryDatabase(source: () => Promise<DocumentStore>): Database {
  return {
    select(selection?: Record<string, unknown>) {
      return new Query("select", undefined, selection ?? null, source);
    },
    insert(table: object) {
      return new Query("insert", table, undefined, source);
    },
    update(table: object) {
      return new Query("update", table, undefined, source);
    },
    delete(table: object) {
      return new Query("delete", table, undefined, source);
    },
    async execute(query: unknown) {
      const statement = sqlStatement(query);
      if (process.env.NODE_ENV !== "production" && statement && !/^(select|create|alter|drop|do|comment|grant|insert|update|delete)\b/i.test(statement)) {
        console.warn("Ignored non-Mongo SQL:", statement.slice(0, 180));
      }
      return { rows: [] as Row[] };
    },
    async transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T> {
      return fn(createQueryDatabase(source));
    },
  };
}

async function liveStore(): Promise<DocumentStore> {
  const database = await getDb();
  return {
    idScope: database.databaseName,
    collection(name: string) {
      return database.collection(name) as unknown as DocumentCollection;
    },
  };
}

export const db: Database = createQueryDatabase(liveStore);
