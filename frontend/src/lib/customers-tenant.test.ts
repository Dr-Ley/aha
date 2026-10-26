import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createQueryDatabase, type DocumentCollection, type DocumentStore } from "./mongo-query";
import { customerDisplayNames, queryCustomerHistory, queryCustomersForCompany } from "./customers";

type Row = Record<string, unknown>;

function matchValue(actual: unknown, expected: unknown): boolean {
  if (expected && typeof expected === "object" && !Array.isArray(expected) && !(expected instanceof Date)) {
    const ops = expected as Record<string, unknown>;
    if ("$in" in ops) return (ops.$in as unknown[]).some((item) => item === actual);
    if ("$ne" in ops) return actual !== ops.$ne;
  }
  return actual === expected;
}

function matchDoc(doc: Row, filter: Row): boolean {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === "$and" && Array.isArray(expected)) return expected.every((part) => matchDoc(doc, part as Row));
    if (key === "$or" && Array.isArray(expected)) return expected.some((part) => matchDoc(doc, part as Row));
    return matchValue(doc[key], expected);
  });
}

function memoryStore() {
  const collections = new Map<string, Row[]>();
  function collection(name: string): DocumentCollection {
    const docs = collections.get(name) ?? [];
    collections.set(name, docs);
    return {
      find(filter: Row, options?: { projection?: Record<string, 1> }) {
        return {
          async toArray() {
            return docs.filter((doc) => matchDoc(doc, filter)).map((doc) => {
              if (!options?.projection) return { ...doc };
              const projected: Row = {};
              for (const key of Object.keys(options.projection)) {
                if (key in doc) projected[key] = doc[key];
              }
              return projected;
            });
          },
        };
      },
      async insertOne(doc: Row) {
        docs.push(doc);
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
  }
  const store: DocumentStore = { collection };
  return {
    store,
    seed(name: string, rows: Row[]) {
      const docs = collections.get(name) ?? [];
      docs.push(...rows);
      collections.set(name, docs);
    },
  };
}

function tenantDb(memory: ReturnType<typeof memoryStore>) {
  return createQueryDatabase(async () => memory.store) as unknown as Parameters<
    typeof queryCustomersForCompany
  >[0];
}

function seedTenant(memory: ReturnType<typeof memoryStore>) {
  memory.seed("customers", [
    { _id: 5, company_id: "aha", first_name: "Ada", last_name: "Amina", email: "ada@example.com" },
    { _id: 9, company_id: "ewc", first_name: "Eve", last_name: "Enchoro", email: "eve@example.com" },
  ]);
  memory.seed("bookings", [
    { _id: 1, company_id: "aha", customer_id: 5, created_at: new Date("2026-08-01T00:00:00.000Z"), travel_date: "2026-08-01" },
    { _id: 2, company_id: "ewc", customer_id: 5, created_at: new Date("2026-09-01T00:00:00.000Z"), travel_date: "2026-09-01" },
  ]);
  memory.seed("hotel_bookings", [
    { _id: 3, company_id: "aha", customer_id: 5, check_in_date: "2026-07-01", check_out_date: "2026-07-03" },
    { _id: 4, company_id: "ewc", customer_id: 5, check_in_date: "2026-09-02", check_out_date: "2026-09-04" },
  ]);
}

describe("customer tenant scope", () => {
  it("counts safari and stay activity only inside the company", async () => {
    const memory = memoryStore();
    seedTenant(memory);
    const rows = await queryCustomersForCompany(tenantDb(memory), "aha");
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.id, 5);
    assert.equal(rows[0]?.firstName, "Ada");
    assert.equal(rows[0]?.bookingCount, 1);
    assert.equal(rows[0]?.hotelStayCount, 1);
    assert.equal(rows[0]?.lastActivity, "2026-08-01");
  });

  it("does not attach another company's customer name to a stay lookup", async () => {
    const memory = memoryStore();
    seedTenant(memory);
    const names = await customerDisplayNames(tenantDb(memory), "aha", [5, 9]);
    assert.deepEqual(names, { 5: "Ada Amina" });
  });

  it("keeps customer history inside the company", async () => {
    const memory = memoryStore();
    seedTenant(memory);
    const history = await queryCustomerHistory(tenantDb(memory), "aha", 5);
    assert.deepEqual(history.safaris.map((row) => row.id), [1]);
    assert.deepEqual(history.stays.map((row) => row.id), [3]);
  });
});
