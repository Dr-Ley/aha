import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { DocumentCollection } from "./mongo-query";
import { allocateIntegerId, resetIntegerIdFloorsForTests } from "./mongo-ids";

type Row = Record<string, unknown>;

function matchDoc(doc: Row, filter: Row): boolean {
  return Object.entries(filter).every(([key, expected]) => doc[key] === expected);
}

function memoryCounters(): DocumentCollection {
  const docs: Row[] = [];
  return {
    find() {
      return { async toArray() { return docs.map((doc) => ({ ...doc })); } };
    },
    async insertOne(doc: Row) {
      docs.push({ ...doc });
    },
    async updateOne(filter, update, options) {
      let doc = docs.find((candidate) => matchDoc(candidate, filter));
      if (!doc && options?.upsert) {
        doc = { ...filter };
        docs.push(doc);
      }
      if (!doc) return;
      if (update.$max) {
        for (const [key, value] of Object.entries(update.$max)) {
          const current = doc[key];
          if (typeof value === "number" && (typeof current !== "number" || value > current)) {
            doc[key] = value;
          }
        }
      }
      if (update.$set) Object.assign(doc, update.$set);
    },
    async deleteMany() {
      docs.splice(0, docs.length);
    },
    async findOneAndUpdate(filter, update, options) {
      let doc = docs.find((candidate) => matchDoc(candidate, filter));
      if (!doc && options.upsert) {
        doc = { ...filter };
        docs.push(doc);
      }
      if (!doc) return null;
      if (update.$inc) {
        for (const [key, value] of Object.entries(update.$inc)) {
          doc[key] = Number(doc[key] ?? 0) + Number(value);
        }
      }
      return { ...doc };
    },
  };
}

describe("integer id allocation", () => {
  beforeEach(() => {
    resetIntegerIdFloorsForTests();
  });

  it("starts at 1 for an empty collection", async () => {
    const counters = memoryCounters();
    const first = await allocateIntegerId(counters, "bookings", async () => 0, "empty");
    const second = await allocateIntegerId(counters, "bookings", async () => 0, "empty");
    assert.deepEqual([first, second], [1, 2]);
  });

  it("allocates above existing integer ids and a stale counter", async () => {
    const counters = memoryCounters();
    await counters.updateOne({ _id: "bookings" }, { $max: { seq: 1 } }, { upsert: true });
    let scans = 0;
    const readMax = async () => {
      scans += 1;
      return 7;
    };

    const ids = await Promise.all(
      Array.from({ length: 10 }, () => allocateIntegerId(counters, "bookings", readMax, "imported"))
    );

    assert.equal(new Set(ids).size, 10);
    assert.ok(ids.every((id) => id > 7));
    assert.equal(Math.min(...ids), 8);
    assert.equal(scans, 1);

    const next = await allocateIntegerId(counters, "bookings", readMax, "imported");
    assert.equal(next, 18);
    assert.equal(scans, 1);
  });

  it("keeps counters for different collections and databases apart", async () => {
    const counters = memoryCounters();
    const booking = await allocateIntegerId(counters, "bookings", async () => 4, "aha_dev");
    const payment = await allocateIntegerId(counters, "payments", async () => 4, "aha_dev");
    const otherDb = await allocateIntegerId(counters, "bookings", async () => 9, "aha_staging");
    assert.equal(booking, 5);
    assert.equal(payment, 5);
    assert.equal(otherDb, 10);
  });
});
