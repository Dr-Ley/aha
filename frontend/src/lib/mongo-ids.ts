import type { DocumentCollection } from "@/lib/mongo-query";

type Row = Record<string, unknown>;

const floors = new Map<string, Promise<void>>();

/** Test isolation. Production floors stay for the life of the process. */
export function resetIntegerIdFloorsForTests(): void {
  floors.clear();
}

function numericId(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Highest integer `_id` or legacy `id` in the collection. ObjectIds count as zero. */
export async function readMaxIntegerId(collection: DocumentCollection): Promise<number> {
  if (collection.aggregate) {
    const [row] = await collection
      .aggregate([
        {
          $project: {
            n: {
              $max: [
                { $cond: [{ $isNumber: "$_id" }, "$_id", 0] },
                { $cond: [{ $isNumber: "$id" }, "$id", 0] },
              ],
            },
          },
        },
        { $group: { _id: null, max: { $max: "$n" } } },
      ])
      .toArray();
    const max = Number(row?.max ?? 0);
    return Number.isFinite(max) && max > 0 ? max : 0;
  }

  const docs = await collection.find({}).toArray();
  return docs.reduce((max, doc) => Math.max(max, numericId(doc._id), numericId(doc.id)), 0);
}

async function ensureFloor(key: string, run: () => Promise<void>): Promise<void> {
  let pending = floors.get(key);
  if (!pending) {
    pending = run().catch((error: unknown) => {
      floors.delete(key);
      throw error;
    });
    floors.set(key, pending);
  }
  await pending;
}

/**
 * Next integer `_id` for one collection.
 * The first allocation in this process raises the counter to the highest
 * existing integer id, then increments. Later allocations only increment.
 * `$inc` is atomic across requests and processes. Existing documents are not modified.
 */
export async function allocateIntegerId(
  counters: DocumentCollection,
  collectionName: string,
  readMaxExisting: () => Promise<number>,
  scope: string
): Promise<number> {
  if (!collectionName || collectionName === "counters" || collectionName.startsWith("system.")) {
    throw new Error("Unable to allocate an integer id");
  }

  await ensureFloor(`${scope}:${collectionName}`, async () => {
    const observed = await readMaxExisting();
    const floor = Number.isFinite(observed) && observed > 0 ? Math.floor(observed) : 0;
    await counters.updateOne({ _id: collectionName }, { $max: { seq: floor } }, { upsert: true });
  });

  const allocated = await counters.findOneAndUpdate(
    { _id: collectionName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  const seq = Number(allocated?.seq);
  if (!Number.isInteger(seq) || seq <= 0) {
    throw new Error(`Unable to allocate an integer id for ${collectionName}`);
  }
  return seq;
}

export function storeIdentity(store: object, idScope?: string): string {
  if (idScope && idScope.trim()) return idScope.trim();
  const tagged = store as { __idScope?: string };
  if (!tagged.__idScope) tagged.__idScope = `store-${storeIdentitySeq++}`;
  return tagged.__idScope;
}

let storeIdentitySeq = 0;
