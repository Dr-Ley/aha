import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { count, desc, eq, inArray, sum } from "drizzle-orm";
import { bookings, hotelBookings, payments, tours } from "./schema";
import { createQueryDatabase, type DocumentCollection, type DocumentStore } from "./mongo-query";

type Row = Record<string, unknown>;

type StoreCall =
  | { op: "find"; collection: string; filter: Row }
  | { op: "update"; collection: string; filter: Row; set: Row };

function matchValue(actual: unknown, expected: unknown): boolean {
  if (expected && typeof expected === "object" && !Array.isArray(expected) && !(expected instanceof Date)) {
    const ops = expected as Record<string, unknown>;
    if ("$in" in ops) return (ops.$in as unknown[]).some((item) => item === actual);
    if ("$nin" in ops) return !(ops.$nin as unknown[]).some((item) => item === actual);
    if ("$ne" in ops) return actual !== ops.$ne;
    if ("$gt" in ops) return (actual as number) > (ops.$gt as number);
    if ("$gte" in ops) return (actual as number) >= (ops.$gte as number);
    if ("$lt" in ops) return (actual as number) < (ops.$lt as number);
    if ("$lte" in ops) return (actual as number) <= (ops.$lte as number);
    if ("$regex" in ops) return new RegExp(String(ops.$regex), "i").test(String(actual ?? ""));
  }
  return actual === expected;
}

function matchDoc(doc: Row, filter: Row): boolean {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === "$and" && Array.isArray(expected)) {
      return expected.every((part) => matchDoc(doc, part as Row));
    }
    if (key === "$or" && Array.isArray(expected)) {
      return expected.some((part) => matchDoc(doc, part as Row));
    }
    return matchValue(doc[key], expected);
  });
}

function memoryStore() {
  const collections = new Map<string, Row[]>();
  const calls: StoreCall[] = [];

  function bucket(name: string): Row[] {
    let docs = collections.get(name);
    if (!docs) {
      docs = [];
      collections.set(name, docs);
    }
    return docs;
  }

  function collection(name: string): DocumentCollection {
    const docs = bucket(name);
    return {
      find(filter: Row) {
        calls.push({ op: "find", collection: name, filter });
        return {
          async toArray() {
            return docs.filter((doc) => matchDoc(doc, filter)).map((doc) => ({ ...doc }));
          },
        };
      },
      async insertOne(doc: Row) {
        docs.push({ ...doc });
        return { insertedId: doc._id };
      },
      async updateOne(filter: Row, update: { $set?: Row; $max?: Row }, options?: { upsert?: boolean }) {
        if (update.$set) calls.push({ op: "update", collection: name, filter, set: update.$set });
        let doc = docs.find((candidate) => matchDoc(candidate, filter));
        if (!doc && options?.upsert) {
          doc = { ...filter };
          docs.push(doc);
        }
        if (!doc) return { matchedCount: 0 };
        if (update.$set) Object.assign(doc, update.$set);
        if (update.$max) {
          for (const [key, value] of Object.entries(update.$max)) {
            const current = doc[key];
            if (typeof value === "number" && (typeof current !== "number" || value > current)) {
              doc[key] = value;
            }
          }
        }
        return { matchedCount: 1 };
      },
      async deleteMany(filter: Row) {
        const kept = docs.filter((doc) => !matchDoc(doc, filter));
        docs.splice(0, docs.length, ...kept);
        return { deletedCount: 1 };
      },
      async findOneAndUpdate(filter, update, options) {
        let doc = docs.find((candidate) => matchDoc(candidate, filter));
        if (!doc && options.upsert) {
          doc = { ...filter };
          docs.push(doc);
        }
        if (!doc) return null;
        for (const [key, value] of Object.entries(update.$inc ?? {})) {
          doc[key] = Number(doc[key] ?? 0) + Number(value);
        }
        if (update.$set) Object.assign(doc, update.$set);
        return { ...doc };
      },
    };
  }

  const store: DocumentStore = { collection };
  return {
    store,
    calls,
    docs: (name: string) => collections.get(name) ?? [],
    seed(name: string, rows: Row[]) {
      bucket(name).push(...rows.map((row) => ({ ...row })));
    },
  };
}

function databaseFor(store: DocumentStore) {
  return createQueryDatabase(async () => store);
}

const importedTour = {
  _id: 4,
  company_id: "aha",
  slug: "sample-safari",
  title: "Sample Safari",
  short_title: "Sample",
  destination: "Masai Mara",
  countries: ["Kenya"],
  duration: "3 Days",
  days: 3,
  price: 900,
  image: ["/sample.png"],
  description: "Sample",
  long_description: "Sample long",
  highlights: ["Sample"],
  included: ["Guide"],
  excluded: ["Flights"],
};

const conflictingBooking = {
  _id: 7,
  user_id: 5,
  tour_id: 4,
  customer_id: 10,
  status: "completed",
  travel_date: "2026-04-01",
  guests: 3,
  adults: 3,
  children: 0,
  infants: 0,
  accommodation: "mid-range",
  transport: "4x4",
  first_name: "Ada",
  last_name: "Example",
  email: "ada@example.com",
  total_price: 500,
  company_id: "aha",
  companyId: "ewc",
  safari_package: "Sample package",
  created_at: { $date: "2026-06-05T10:50:46.274Z" },
};

describe("mongo query field mapping", () => {
  it("reads snake_case imports and ignores a conflicting camelCase company", async () => {
    const memory = memoryStore();
    memory.seed("bookings", [
      conflictingBooking,
      {
        ...conflictingBooking,
        _id: 8,
        company_id: "ewc",
        companyId: "aha",
        total_price: 80,
        tour_id: null,
        email: "ewc@example.com",
      },
      {
        ...conflictingBooking,
        _id: 9,
        company_id: undefined,
        companyId: "ewc",
        total_price: 70,
        email: "legacy@example.com",
      },
    ]);
    const db = databaseFor(memory.store);

    const aha = await db.select().from(bookings).where(eq(bookings.companyId, "aha"));
    const ewc = await db.select().from(bookings).where(eq(bookings.companyId, "ewc"));

    assert.deepEqual(
      aha.map((row) => row.id),
      [7]
    );
    assert.equal(aha[0]?.companyId, "aha");
    assert.equal(aha[0]?.totalPrice, 500);
    assert.equal(aha[0]?.tourId, 4);
    assert.ok(aha[0]?.createdAt instanceof Date);
    assert.deepEqual(
      ewc.map((row) => row.id),
      [8]
    );
    assert.equal(ewc[0]?.companyId, "ewc");

    const companyFinds = memory.calls.filter(
      (call) => call.op === "find" && call.collection === "bookings"
    );
    assert.equal(
      companyFinds.some((call) => JSON.stringify(call.filter).includes("companyId")),
      false
    );
    assert.ok(companyFinds.some((call) => call.op === "find" && call.filter.company_id === "aha"));
    assert.ok(companyFinds.some((call) => call.op === "find" && call.filter.company_id === "ewc"));
  });

  it("updates the stored snake_case field and keeps integer _id", async () => {
    const memory = memoryStore();
    memory.seed("bookings", [conflictingBooking]);
    const db = databaseFor(memory.store);

    const [updated] = await db
      .update(bookings)
      .set({ totalPrice: 125 })
      .where(eq(bookings.id, 7))
      .returning();

    const raw = memory.docs("bookings")[0];
    assert.equal(raw?._id, 7);
    assert.equal(raw?.total_price, 125);
    assert.equal(raw?.company_id, "aha");
    assert.equal(raw?.tour_id, 4);
    assert.equal("totalPrice" in (raw ?? {}), false);
    assert.equal(raw?.companyId, "ewc");
    assert.equal(updated?.companyId, "aha");
    assert.equal(updated?.totalPrice, 125);
    assert.equal(updated?.id, 7);

    const write = memory.calls.find((call) => call.op === "update");
    assert.deepEqual(write, {
      op: "update",
      collection: "bookings",
      filter: { _id: 7 },
      set: { total_price: 125 },
    });

    const ewc = await db.select().from(bookings).where(eq(bookings.companyId, "ewc"));
    assert.equal(ewc.length, 0);
  });

  it("inserts new rows in canonical snake_case with an integer _id", async () => {
    const memory = memoryStore();
    const db = databaseFor(memory.store);

    const [created] = await db.insert(bookings).values({
      companyId: "ewc",
      status: "pending",
      travelDate: "2026-05-01",
      guests: 2,
      accommodation: "lodge",
      transport: "4x4",
      firstName: "Bo",
      lastName: "Example",
      email: "bo@example.com",
      totalPrice: 40,
      safariPackage: "New package",
    });

    const raw = memory.docs("bookings")[0];
    assert.equal(typeof raw?._id, "number");
    assert.equal(raw?._id, created?.id);
    assert.equal(raw?.company_id, "ewc");
    assert.equal(raw?.travel_date, "2026-05-01");
    assert.equal(raw?.first_name, "Bo");
    assert.equal(raw?.total_price, 40);
    assert.equal(raw?.safari_package, "New package");
    assert.equal("companyId" in (raw ?? {}), false);
    assert.equal("totalPrice" in (raw ?? {}), false);
    assert.equal("id" in (raw ?? {}), false);

    raw!.companyId = "aha";
    const ewc = await db.select().from(bookings).where(eq(bookings.companyId, "ewc"));
    const aha = await db.select().from(bookings).where(eq(bookings.companyId, "aha"));
    assert.equal(ewc.length, 1);
    assert.equal(ewc[0]?.companyId, "ewc");
    assert.equal(aha.length, 0);
  });

  it("stores an explicit id as _id and does not delete a different row that reuses that number", async () => {
    const memory = memoryStore();
    memory.seed("bookings", [
      conflictingBooking,
      {
        ...conflictingBooking,
        _id: 8,
        id: 7,
        company_id: "ewc",
        companyId: undefined,
        email: "other@example.com",
        total_price: 15,
      },
    ]);
    const db = databaseFor(memory.store);

    const bySeven = await db.select().from(bookings).where(eq(bookings.id, 7));
    const byEight = await db.select().from(bookings).where(eq(bookings.id, 8));
    assert.deepEqual(
      bySeven.map((row) => row.companyId),
      ["aha"]
    );
    assert.equal(byEight[0]?.id, 8);
    assert.equal(byEight[0]?.companyId, "ewc");

    await db.delete(bookings).where(eq(bookings.id, 7));
    assert.deepEqual(
      memory.docs("bookings").map((row) => row._id),
      [8]
    );
  });

  it("joins, sorts, limits, and aggregates on canonical fields", async () => {
    const memory = memoryStore();
    memory.seed("tours", [importedTour]);
    memory.seed("bookings", [
      {
        ...conflictingBooking,
        _id: 8,
        company_id: "aha",
        companyId: undefined,
        total_price: 100,
        tour_id: 4,
        email: "second@example.com",
      },
      conflictingBooking,
      {
        ...conflictingBooking,
        _id: 9,
        company_id: "ewc",
        companyId: undefined,
        total_price: 999,
        tour_id: null,
        email: "ewc@example.com",
      },
    ]);
    const db = databaseFor(memory.store);

    const joined = await db
      .select({ booking: bookings, tour: tours })
      .from(bookings)
      .leftJoin(tours, eq(bookings.tourId, tours.id))
      .where(eq(bookings.id, 7));
    assert.equal(joined[0]?.booking?.id, 7);
    assert.equal(joined[0]?.tour?.id, 4);
    assert.equal(joined[0]?.tour?.slug, "sample-safari");

    const top = await db
      .select({ id: bookings.id, totalPrice: bookings.totalPrice })
      .from(bookings)
      .where(eq(bookings.companyId, "aha"))
      .orderBy(desc(bookings.totalPrice))
      .limit(1);
    assert.deepEqual(top, [{ id: 7, totalPrice: 500 }]);

    const listed = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(inArray(bookings.id, [8, 9]))
      .orderBy(desc(bookings.id));
    assert.deepEqual(listed, [{ id: 9 }, { id: 8 }]);

    const [counted] = await db
      .select({ n: count() })
      .from(bookings)
      .where(eq(bookings.companyId, "aha"));
    const [total] = await db
      .select({ amount: sum(bookings.totalPrice) })
      .from(bookings)
      .where(eq(bookings.companyId, "aha"));
    assert.equal(Number(counted?.n), 2);
    assert.equal(Number(total?.amount), 600);
  });

  it("writes payment references with snake_case names", async () => {
    const memory = memoryStore();
    const db = databaseFor(memory.store);
    const [created] = await db.insert(payments).values({
      companyId: "bth",
      bookingId: 7,
      referenceType: "hotel",
      referenceId: 15,
      amount: 2000,
      currency: "KES",
      status: "completed",
    });

    const raw = memory.docs("payments")[0];
    assert.equal(raw?._id, created?.id);
    assert.equal(typeof raw?._id, "number");
    assert.equal(raw?.company_id, "bth");
    assert.equal(raw?.booking_id, 7);
    assert.equal(raw?.reference_type, "hotel");
    assert.equal(raw?.reference_id, 15);
    assert.equal("companyId" in (raw ?? {}), false);
    assert.equal("referenceId" in (raw ?? {}), false);

    const bth = await db.select().from(payments).where(eq(payments.companyId, "bth"));
    const aha = await db.select().from(payments).where(eq(payments.companyId, "aha"));
    assert.equal(bth.length, 1);
    assert.equal(bth[0]?.referenceId, 15);
    assert.equal(aha.length, 0);
  });

  it("returns imported hotel dates as calendar days and keeps timestamps as dates", async () => {
    const memory = memoryStore();
    memory.seed("hotel_bookings", [
      {
        _id: 192,
        company_id: "bth",
        room_id: 3,
        check_in_date: new Date("2026-08-29T00:00:00.000Z"),
        check_out_date: { $date: "2026-08-30T00:00:00.000Z" },
        nights: 1,
        total_amount: 4000,
        amount_paid: 4000,
        payment_status: "paid",
        reservation_status: "checked_out",
        adults: 1,
        children: 0,
        infants: 0,
        currency: "KES",
        created_at: { $date: "2026-08-08T08:58:35.735Z" },
      },
    ]);
    const db = databaseFor(memory.store);
    const [stay] = await db.select().from(hotelBookings).where(eq(hotelBookings.companyId, "bth"));
    assert.equal(stay?.checkInDate, "2026-08-29");
    assert.equal(stay?.checkOutDate, "2026-08-30");
    assert.ok(stay?.createdAt instanceof Date);
    assert.equal(stay?.createdAt?.toISOString(), "2026-08-08T08:58:35.735Z");
  });
});
