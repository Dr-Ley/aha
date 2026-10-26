import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createQueryDatabase, type DocumentCollection, type DocumentStore } from "./mongo-query";
import { findStaffUserSummary } from "./staff-user-summary";

type Row = Record<string, unknown>;

function memoryStore() {
  const docs: Row[] = [];
  const calls: Array<{ filter: Row; options?: { projection?: Record<string, 1> } }> = [];
  const store: DocumentStore = {
    collection(): DocumentCollection {
      return {
        find(filter, options) {
          calls.push({ filter, options });
          return {
            async toArray() {
              return docs
                .filter((doc) => doc._id === filter._id)
                .map((doc) => {
                  const projection = options?.projection;
                  if (!projection) return { ...doc };
                  const projected: Row = {};
                  for (const key of Object.keys(projection)) {
                    if (key in doc) projected[key] = doc[key];
                  }
                  return projected;
                });
            },
          };
        },
        async insertOne() {
          return {};
        },
        async updateOne() {
          return {};
        },
        async deleteMany() {
          return {};
        },
        async findOneAndUpdate() {
          return null;
        },
      };
    },
  };
  return {
    store,
    calls,
    seed(row: Row) {
      docs.push(row);
    },
  };
}

describe("staff permission user projection", () => {
  it("does not read password_hash from the user document", async () => {
    const memory = memoryStore();
    memory.seed({
      _id: 4,
      email: "staff@example.com",
      name: "Staff",
      role: "staff",
      password_hash: "secret-hash",
    });
    const database = createQueryDatabase(async () => memory.store);
    const user = await findStaffUserSummary(database, 4);
    assert.deepEqual(user, { id: 4, email: "staff@example.com", name: "Staff", role: "staff" });
    assert.equal("passwordHash" in (user ?? {}), false);
    assert.equal("password_hash" in (user ?? {}), false);
    const projection = memory.calls[0]?.options?.projection;
    assert.deepEqual(projection, { _id: 1, email: 1, name: 1, role: 1 });
    assert.equal(projection?.password_hash, undefined);
  });
});
