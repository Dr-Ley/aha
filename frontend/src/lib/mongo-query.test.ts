import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { and, asc, count, desc, eq, gte, inArray, isNull, lt, notInArray, or, sql, sum } from "drizzle-orm";
import {
  barCategories,
  barItems,
  barOrderItems,
  bookings,
  hotelBookingRooms,
  hotelBookings,
  restaurantCategories,
  restaurantItems,
  restaurantOrderItems,
  roomTypes,
  rooms,
  testimonials,
  tours,
  payments,
} from "./schema";
import { createQueryDatabase, type DocumentCollection, type DocumentStore } from "./mongo-query";

type Row = Record<string, unknown>;

type StoreCall =
  | {
      op: "find";
      collection: string;
      filter: Row;
      options?: { projection?: Record<string, 1>; sort?: Record<string, 1 | -1>; skip?: number; limit?: number };
    }
  | { op: "update"; collection: string; filter: Row; set: Row }
  | { op: "aggregate"; collection: string; pipeline: Row[] };

function compareStored(left: unknown, right: unknown): number {
  if (left === right) return 0;
  const leftMissing = left == null;
  const rightMissing = right == null;
  if (leftMissing || rightMissing) return leftMissing ? -1 : 1;
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left) < String(right) ? -1 : String(left) > String(right) ? 1 : 0;
}

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
      find(filter: Row, options?: { projection?: Record<string, 1>; sort?: Record<string, 1 | -1>; skip?: number; limit?: number }) {
        calls.push({ op: "find", collection: name, filter, options });
        return {
          async toArray() {
            let matched = docs.filter((doc) => matchDoc(doc, filter));
            const sort = options?.sort;
            if (sort) {
              const keys = Object.entries(sort);
              matched.sort((left, right) => {
                for (const [key, direction] of keys) {
                  const compared = compareStored(left[key], right[key]);
                  if (compared !== 0) return compared * direction;
                }
                return 0;
              });
            }
            const start = options?.skip ?? 0;
            matched = matched.slice(start);
            if (options?.limit != null) matched = matched.slice(0, options.limit);
            return matched.map((doc) => {
              const copy = { ...doc };
              const projection = options?.projection;
              if (!projection) return copy;
              const projected: Row = {};
              for (const key of Object.keys(projection)) {
                if (key in copy) projected[key] = copy[key];
              }
              return projected;
            });
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
      aggregate(pipeline: Row[]) {
        calls.push({ op: "aggregate", collection: name, pipeline });
        return {
          async toArray() {
            const match = pipeline.find((stage) => "$match" in stage)?.$match as Row | undefined;
            const group = pipeline.find((stage) => "$group" in stage)?.$group as Row | undefined;
            const matched = docs.filter((doc) => matchDoc(doc, match ?? {}));
            if (!group) return matched.map((doc) => ({ ...doc }));
            if (matched.length === 0) return [];
            const totals: Row = { _id: group._id ?? null };
            for (const [key, spec] of Object.entries(group)) {
              if (key === "_id") continue;
              const sum = spec as { $sum?: unknown };
              if (sum.$sum === 1) totals[key] = matched.length;
              else if (typeof sum.$sum === "string" && sum.$sum.startsWith("$")) {
                const field = sum.$sum.slice(1);
                totals[key] = matched.reduce((total, doc) => {
                  const value = doc[field];
                  return typeof value === "number" ? total + value : total;
                }, 0);
              }
            }
            return [totals];
          },
        };
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
      (call): call is Extract<StoreCall, { op: "find" }> => call.op === "find" && call.collection === "bookings"
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

function isFindCall(call: StoreCall): call is Extract<StoreCall, { op: "find" }> {
  return call.op === "find";
}

function finds(memory: ReturnType<typeof memoryStore>, collection: string) {
  return memory.calls.filter((call): call is Extract<StoreCall, { op: "find" }> => isFindCall(call) && call.collection === collection);
}

describe("mongo query pushdown", () => {
  it("applies skip before limit when the page is sent to the collection", async () => {
    const memory = memoryStore();
    memory.seed(
      "bookings",
      [1, 2, 3, 4].map((id) => ({ ...conflictingBooking, _id: id, companyId: undefined, total_price: id }))
    );
    const db = databaseFor(memory.store);
    const page = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.companyId, "aha"))
      .orderBy(asc(bookings.id))
      .offset(1)
      .limit(2);
    assert.deepEqual(page, [{ id: 2 }, { id: 3 }]);
    const call = finds(memory, "bookings").at(-1);
    assert.equal(call?.options?.skip, 1);
    assert.equal(call?.options?.limit, 2);
    assert.equal(call?.options?.sort?._id, 1);
  });

  it("does not apply a pagination limit to an aggregate", async () => {
    const memory = memoryStore();
    memory.seed("bookings", [
      conflictingBooking,
      { ...conflictingBooking, _id: 8, companyId: undefined, total_price: 100 },
    ]);
    const db = databaseFor(memory.store);
    const [counted] = await db
      .select({ n: count() })
      .from(bookings)
      .where(eq(bookings.companyId, "aha"))
      .limit(1);
    assert.equal(Number(counted?.n), 2);
    const aggregate = memory.calls.filter((call) => call.op === "aggregate").at(-1);
    assert.equal(aggregate?.op, "aggregate");
    if (aggregate?.op === "aggregate") {
      assert.equal(JSON.stringify(aggregate.pipeline).includes("$limit"), false);
    }
  });

  it("keeps a null payment date in a paged status group and counts the whole filter", async () => {
    const memory = memoryStore();
    const inside = new Date("2026-10-26T12:00:00.000Z");
    const outside = new Date("2026-11-02T00:00:00.000Z");
    memory.seed("payments", [
      { _id: 1, company_id: "bth", status: "paid", amount: 10, recorded_at: inside },
      { _id: 2, company_id: "bth", status: "pending", amount: 20, recorded_at: null },
      { _id: 3, company_id: "bth", status: "refunded", amount: 30, recorded_at: inside },
      { _id: 4, company_id: "bth", status: "pending", amount: 40, recorded_at: outside },
      { _id: 5, company_id: "aha", status: "pending", amount: 50, recorded_at: inside },
    ]);
    const db = databaseFor(memory.store);
    const where = and(
      eq(payments.companyId, "bth"),
      notInArray(payments.status, ["completed", "confirmed", "paid", "success", "succeeded", "cancelled", "refunded"]),
      or(
        isNull(payments.recordedAt),
        and(gte(payments.recordedAt, new Date("2026-10-01T00:00:00.000Z")), lt(payments.recordedAt, new Date("2026-11-01T00:00:00.000Z")))
      )
    );
    const page = await db
      .select({ id: payments.id })
      .from(payments)
      .where(where)
      .orderBy(desc(payments.recordedAt), desc(payments.id))
      .limit(10);
    assert.deepEqual(page, [{ id: 2 }]);
    const call = finds(memory, "payments").at(-1);
    assert.equal(call?.options?.limit, 10);
    assert.equal(call?.options?.sort?.recorded_at, -1);
    assert.equal(call?.options?.sort?._id, -1);
    const [counted] = await db.select({ n: count() }).from(payments).where(where).limit(1);
    assert.equal(Number(counted?.n), 1);
  });

  it("sorts calendar dates after normalisation and keeps nulls last", async () => {
    const memory = memoryStore();
    memory.seed("hotel_bookings", [
      { _id: 1, company_id: "bth", check_in_date: "2026-09-01" },
      { _id: 2, company_id: "bth", check_in_date: null },
      { _id: 3, company_id: "bth", check_in_date: "2026-08-31" },
    ]);
    const db = databaseFor(memory.store);
    const rows = await db
      .select({ id: hotelBookings.id, checkInDate: hotelBookings.checkInDate })
      .from(hotelBookings)
      .where(eq(hotelBookings.companyId, "bth"))
      .orderBy(asc(hotelBookings.checkInDate))
      .limit(2);
    assert.deepEqual(
      rows.map((row) => row.id),
      [3, 1]
    );
    const call = finds(memory, "hotel_bookings").at(-1);
    assert.equal(call?.options?.sort, undefined);
    assert.equal(call?.options?.limit, undefined);
  });

  it("sends a numeric sort to the collection, where null is the lowest value", async () => {
    const memory = memoryStore();
    memory.seed("bookings", [
      { ...conflictingBooking, _id: 1, companyId: undefined, total_price: null },
      { ...conflictingBooking, _id: 2, companyId: undefined, total_price: 5 },
      { ...conflictingBooking, _id: 3, companyId: undefined, total_price: 1 },
    ]);
    const db = databaseFor(memory.store);
    const rows = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.companyId, "aha"))
      .orderBy(asc(bookings.totalPrice));
    assert.deepEqual(
      rows.map((row) => row.id),
      [1, 3, 2]
    );
    assert.equal(finds(memory, "bookings").at(-1)?.options?.sort?.total_price, 1);
  });

  it("pushes the company predicate and still applies the arrival-day predicate", async () => {
    const memory = memoryStore();
    memory.seed("bookings", [
      { ...conflictingBooking, _id: 1, companyId: undefined, start_date: "2026-08-01", travel_date: "2026-07-01" },
      { ...conflictingBooking, _id: 2, companyId: undefined, start_date: "2026-08-02", travel_date: "2026-08-01" },
      {
        ...conflictingBooking,
        _id: 3,
        company_id: "ewc",
        companyId: undefined,
        start_date: "2026-08-01",
        travel_date: "2026-08-01",
      },
    ]);
    const today = "2026-08-01";
    const arrivalDay = sql`(
      case
        when length(trim(coalesce(${bookings.startDate}, ''))) >= 10
        then left(trim(${bookings.startDate}), 10)
        else left(trim(${bookings.travelDate}), 10)
      end
    ) = ${today}`;
    const db = databaseFor(memory.store);
    const rows = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(and(eq(bookings.companyId, "aha"), arrivalDay))
      .limit(5);
    assert.deepEqual(rows, [{ id: 1 }]);
    const call = finds(memory, "bookings").at(-1);
    assert.equal(call?.filter.company_id, "aha");
    assert.equal(call?.options?.limit, undefined);
    assert.equal(call?.options?.projection?._id, 1);
    assert.equal(call?.options?.projection?.company_id, 1);
    assert.equal(call?.options?.projection?.start_date, 1);
    assert.equal(call?.options?.projection?.travel_date, 1);
  });

  it("keeps an inner join strict and a later left join nullable", async () => {
    const memory = memoryStore();
    memory.seed("hotel_booking_rooms", [
      { _id: 1, hotel_booking_id: 10, room_id: 3, quantity: 2 },
      { _id: 2, hotel_booking_id: 11, room_id: 50, quantity: 1 },
      { _id: 3, hotel_booking_id: 12, room_id: 4, quantity: 1 },
    ]);
    memory.seed("rooms", [
      { _id: 3, company_id: "bth", code: "A1", name: "Acacia", room_type_id: 8 },
      { _id: 4, company_id: "bth", code: "B2", name: "Baobab", room_type_id: 5 },
      { _id: 99, company_id: "ewc", code: "ZZ", name: "Decoy", room_type_id: 77 },
    ]);
    memory.seed("room_types", [
      { _id: 8, name: "Deluxe" },
      { _id: 77, name: "Decoy type" },
    ]);
    const db = databaseFor(memory.store);
    const rows = await db
      .select({
        hotelBookingId: hotelBookingRooms.hotelBookingId,
        code: rooms.code,
        name: rooms.name,
        roomTypeName: roomTypes.name,
        quantity: hotelBookingRooms.quantity,
      })
      .from(hotelBookingRooms)
      .innerJoin(rooms, eq(hotelBookingRooms.roomId, rooms.id))
      .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .where(inArray(hotelBookingRooms.hotelBookingId, [10, 11, 12]));
    assert.deepEqual(rows, [
      { hotelBookingId: 10, code: "A1", name: "Acacia", roomTypeName: "Deluxe", quantity: 2 },
      { hotelBookingId: 12, code: "B2", name: "Baobab", roomTypeName: null, quantity: 1 },
    ]);
    assert.deepEqual(finds(memory, "rooms").at(-1)?.filter, { _id: { $in: [3, 50, 4] } });
    assert.deepEqual(finds(memory, "room_types").at(-1)?.filter, { _id: { $in: [8, 5] } });
    assert.equal(finds(memory, "rooms").at(-1)?.options?.projection?._id, 1);
    assert.equal(finds(memory, "rooms").at(-1)?.options?.projection?.room_type_id, 1);
    assert.equal(finds(memory, "rooms").at(-1)?.options?.projection?.code, 1);
    assert.equal(finds(memory, "room_types").at(-1)?.options?.projection?._id, 1);
    assert.equal(finds(memory, "room_types").at(-1)?.options?.projection?.name, 1);
    assert.equal(finds(memory, "hotel_booking_rooms").at(-1)?.options?.projection?.room_id, 1);
  });

  it("uses an empty membership list for an equality join with no parent keys", async () => {
    const memory = memoryStore();
    memory.seed("bookings", [{ ...conflictingBooking, tour_id: null, companyId: undefined }]);
    memory.seed("tours", [importedTour, { ...importedTour, _id: 99, slug: "decoy" }]);
    const db = databaseFor(memory.store);
    const rows = await db
      .select({ booking: bookings, tour: tours })
      .from(bookings)
      .leftJoin(tours, eq(bookings.tourId, tours.id))
      .where(eq(bookings.id, 7));
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.tour, null);
    assert.deepEqual(finds(memory, "tours").at(-1)?.filter, { _id: { $in: [] } });
  });

  it("reads the whole related collection when the join is not an equality", async () => {
    const memory = memoryStore();
    memory.seed("bookings", [conflictingBooking]);
    memory.seed("tours", [importedTour]);
    const db = databaseFor(memory.store);
    const rows = await db
      .select({ booking: bookings, tour: tours })
      .from(bookings)
      .leftJoin(tours, sql`false`)
      .where(eq(bookings.id, 7));
    assert.equal(rows[0]?.booking?.id, 7);
    assert.equal(rows[0]?.tour, null);
    assert.deepEqual(finds(memory, "tours").at(-1)?.filter, {});
  });

  it("preserves documented join callers", async () => {
    const memory = memoryStore();
    memory.seed("tours", [importedTour, { ...importedTour, _id: 99, company_id: "ewc", slug: "decoy", title: "Decoy" }]);
    memory.seed("bookings", [
      { ...conflictingBooking, created_at: new Date("2026-06-02T00:00:00.000Z") },
      {
        ...conflictingBooking,
        _id: 8,
        companyId: undefined,
        tour_id: null,
        created_at: new Date("2026-06-05T00:00:00.000Z"),
        email: "second@example.com",
      },
      {
        ...conflictingBooking,
        _id: 9,
        company_id: "ewc",
        companyId: undefined,
        tour_id: 4,
        created_at: new Date("2026-06-06T00:00:00.000Z"),
        email: "ewc@example.com",
      },
    ]);
    memory.seed("testimonials", [
      {
        _id: 3,
        company_id: "aha",
        name: "Ada",
        country: "Kenya",
        avatar: "A",
        rating: 5,
        text: "Wonderful",
        tour_id: 4,
        created_at: new Date("2026-05-02T00:00:00.000Z"),
      },
      {
        _id: 4,
        company_id: "ewc",
        name: "Eve",
        country: "Kenya",
        avatar: "E",
        rating: 4,
        text: "Other company",
        tour_id: 99,
        created_at: new Date("2026-05-03T00:00:00.000Z"),
      },
    ]);
    memory.seed("hotel_bookings", [
      {
        _id: 10,
        company_id: "bth",
        room_id: 3,
        check_in_date: "2026-08-31",
        primary_guest_name: "Ada",
      },
      {
        _id: 11,
        company_id: "bth",
        room_id: null,
        check_in_date: "2026-09-01",
        primary_guest_name: "Bo",
      },
      {
        _id: 12,
        company_id: "ewc",
        room_id: 99,
        check_in_date: "2026-09-02",
        primary_guest_name: "Eve",
      },
    ]);
    memory.seed("rooms", [
      { _id: 3, company_id: "bth", code: "A1", name: "Acacia", room_type_id: 8, is_active: true },
      { _id: 4, company_id: "bth", code: "B2", name: "Baobab", room_type_id: null, is_active: true },
      { _id: 99, company_id: "ewc", code: "ZZ", name: "Decoy", room_type_id: 77, is_active: true },
    ]);
    memory.seed("room_types", [
      { _id: 8, company_id: "bth", name: "Deluxe", max_occupancy: 2, base_rate: 1000 },
      { _id: 77, company_id: "ewc", name: "Decoy type", max_occupancy: 1, base_rate: 1 },
    ]);
    memory.seed("bar_categories", [
      { _id: 6, company_id: "ewc", name: "Wine", sort_order: 1 },
      { _id: 70, company_id: "aha", name: "Decoy bar", sort_order: 0 },
    ]);
    memory.seed("bar_items", [
      { _id: 15, company_id: "ewc", category_id: 6, name: "Merlot", created_at: new Date("2026-04-02T00:00:00.000Z") },
      { _id: 16, company_id: "ewc", category_id: null, name: "House pour", created_at: new Date("2026-04-01T00:00:00.000Z") },
      { _id: 90, company_id: "aha", category_id: 70, name: "Decoy beer", created_at: new Date("2026-04-03T00:00:00.000Z") },
    ]);
    memory.seed("bar_order_items", [
      { _id: 1, company_id: "ewc", order_id: 20, item_id: 15, quantity: 2, unit_price: 500, line_total: 1000 },
      { _id: 2, company_id: "ewc", order_id: 20, item_id: 90, quantity: 1, unit_price: 100, line_total: 100 },
      { _id: 3, company_id: "ewc", order_id: 21, item_id: 15, quantity: 4, unit_price: 500, line_total: 2000 },
    ]);
    memory.seed("restaurant_categories", [{ _id: 8, company_id: "bth", name: "Grill", sort_order: 1 }]);
    memory.seed("restaurant_items", [
      { _id: 18, company_id: "bth", category_id: 8, name: "Nyama", created_at: new Date("2026-04-02T00:00:00.000Z") },
      { _id: 19, company_id: "ewc", category_id: 8, name: "Other kitchen", created_at: new Date("2026-04-03T00:00:00.000Z") },
    ]);
    memory.seed("restaurant_order_items", [
      { _id: 1, company_id: "bth", order_id: 30, item_id: 18, quantity: 1, unit_price: 800, line_total: 800 },
    ]);
    const db = databaseFor(memory.store);

    const bookingRows = await db
      .select({ booking: bookings, tour: tours })
      .from(bookings)
      .leftJoin(tours, eq(bookings.tourId, tours.id))
      .where(eq(bookings.companyId, "aha"))
      .orderBy(desc(bookings.createdAt));
    assert.deepEqual(
      bookingRows.map((row) => [row.booking?.id, row.tour?.id ?? null]),
      [
        [8, null],
        [7, 4],
      ]
    );
    assert.equal(bookingRows[1]?.tour?.slug, "sample-safari");
    assert.deepEqual(finds(memory, "tours").at(-1)?.filter, { _id: { $in: [4] } });

    const quotes = await db
      .select({
        testimonial: testimonials,
        tour: { title: tours.title, slug: tours.slug },
      })
      .from(testimonials)
      .leftJoin(tours, eq(testimonials.tourId, tours.id))
      .where(eq(testimonials.companyId, "aha"))
      .orderBy(desc(testimonials.createdAt));
    assert.deepEqual(
      quotes.map((row) => row.testimonial?.name),
      ["Ada"]
    );
    assert.equal("tour" in quotes[0], false);
    assert.deepEqual(finds(memory, "tours").at(-1)?.filter, { _id: { $in: [4] } });

    const stayRows = await db
      .select({
        stay: hotelBookings,
        roomCode: rooms.code,
        roomName: rooms.name,
      })
      .from(hotelBookings)
      .leftJoin(rooms, eq(hotelBookings.roomId, rooms.id))
      .where(and(eq(hotelBookings.id, 10), eq(hotelBookings.companyId, "bth")))
      .limit(1);
    assert.equal(stayRows[0]?.stay?.primaryGuestName, "Ada");
    assert.equal(stayRows[0]?.roomCode, "A1");
    assert.equal(stayRows[0]?.roomName, "Acacia");
    assert.deepEqual(finds(memory, "rooms").at(-1)?.filter, { _id: { $in: [3] } });
    assert.equal(finds(memory, "hotel_bookings").at(-1)?.options?.limit, undefined);

    const roomRows = await db
      .select({
        room: rooms,
        roomType: {
          id: roomTypes.id,
          name: roomTypes.name,
          maxOccupancy: roomTypes.maxOccupancy,
          baseRate: roomTypes.baseRate,
        },
      })
      .from(rooms)
      .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .where(and(eq(rooms.companyId, "bth"), eq(rooms.isActive, true)))
      .orderBy(desc(rooms.createdAt));
    assert.deepEqual(
      roomRows.map((row) => row.room?.code),
      ["A1", "B2"]
    );
    assert.equal("roomType" in roomRows[0], false);
    assert.deepEqual(finds(memory, "room_types").at(-1)?.filter, { _id: { $in: [8] } });

    const barRows = await db
      .select({ item: barItems, categoryName: barCategories.name })
      .from(barItems)
      .leftJoin(barCategories, eq(barItems.categoryId, barCategories.id))
      .where(eq(barItems.companyId, "ewc"))
      .orderBy(desc(barItems.createdAt));
    assert.deepEqual(
      barRows.map((row) => [row.item?.name, row.categoryName]),
      [
        ["Merlot", "Wine"],
        ["House pour", null],
      ]
    );
    assert.deepEqual(finds(memory, "bar_categories").at(-1)?.filter, { _id: { $in: [6] } });

    const restaurantRows = await db
      .select({ item: restaurantItems, categoryName: restaurantCategories.name })
      .from(restaurantItems)
      .leftJoin(restaurantCategories, eq(restaurantItems.categoryId, restaurantCategories.id))
      .where(eq(restaurantItems.companyId, "bth"))
      .orderBy(desc(restaurantItems.createdAt));
    assert.deepEqual(
      restaurantRows.map((row) => [row.item?.name, row.categoryName]),
      [["Nyama", "Grill"]]
    );
    assert.deepEqual(finds(memory, "restaurant_categories").at(-1)?.filter, { _id: { $in: [8] } });

    const barLines = await db
      .select({
        orderId: barOrderItems.orderId,
        quantity: barOrderItems.quantity,
        lineTotal: barOrderItems.lineTotal,
        itemName: barItems.name,
      })
      .from(barOrderItems)
      .leftJoin(barItems, eq(barOrderItems.itemId, barItems.id))
      .where(inArray(barOrderItems.orderId, [20]));
    assert.deepEqual(barLines, [
      { orderId: 20, quantity: 2, lineTotal: 1000, itemName: "Merlot" },
      { orderId: 20, quantity: 1, lineTotal: 100, itemName: "Decoy beer" },
    ]);
    assert.deepEqual(finds(memory, "bar_items").at(-1)?.filter, { _id: { $in: [15, 90] } });

    const restaurantLines = await db
      .select({
        orderId: restaurantOrderItems.orderId,
        quantity: restaurantOrderItems.quantity,
        lineTotal: restaurantOrderItems.lineTotal,
        itemName: restaurantItems.name,
      })
      .from(restaurantOrderItems)
      .leftJoin(restaurantItems, eq(restaurantOrderItems.itemId, restaurantItems.id))
      .where(inArray(restaurantOrderItems.orderId, [30]));
    assert.deepEqual(restaurantLines, [{ orderId: 30, quantity: 1, lineTotal: 800, itemName: "Nyama" }]);
    assert.deepEqual(finds(memory, "restaurant_items").at(-1)?.filter, { _id: { $in: [18] } });
  });
});
