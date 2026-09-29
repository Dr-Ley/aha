import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  accommodations,
  destinations,
  parkFeeRates,
  roomTypeRates,
  roomTypes,
  transportOptions,
} from "@/lib/schema";
import {
  ENCHORO_BASE_RATE_KES_LOW,
  ENCHORO_MEAL_BASIS,
  ENCHORO_RATE_INCLUSION,
  ENCHORO_RATES_YEAR,
  ENCHORO_ROOM_TYPE_RATE_ROWS,
  ENCHORO_SAFARI_VEHICLE_2026,
  MAASAI_MARA_PARK_FEES_2026,
} from "@/lib/enchoro-rates-2026";

let ensured = false;

export async function ensureEnchoroRates2026(): Promise<void> {
  if (ensured) return;

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "room_type_rates" (
      "id" serial PRIMARY KEY,
      "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
      "room_type_id" integer REFERENCES "room_types"("id"),
      "occupancy" varchar(32) NOT NULL,
      "season" varchar(16) NOT NULL,
      "guest_category" varchar(32) NOT NULL,
      "currency" varchar(10) NOT NULL,
      "amount" integer NOT NULL,
      "year" integer NOT NULL DEFAULT 2026,
      "meal_basis" varchar(32) NOT NULL DEFAULT 'full_board',
      "notes" text,
      "created_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "room_type_rates_company_card"
    ON "room_type_rates" ("company_id", "occupancy", "season", "guest_category", "year")
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "room_type_rates_company_idx" ON "room_type_rates" ("company_id")
  `);

  await db.execute(sql`
    ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "guest_category" varchar(32) DEFAULT 'resident'
  `);
  await db.execute(sql`
    ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "currency" varchar(10) DEFAULT 'KES' NOT NULL
  `);

  await db.execute(sql`ALTER TABLE "park_fee_rates" ADD COLUMN IF NOT EXISTS "adult_usd_low" integer`);
  await db.execute(sql`ALTER TABLE "park_fee_rates" ADD COLUMN IF NOT EXISTS "child_usd_low" integer`);
  await db.execute(sql`ALTER TABLE "park_fee_rates" ADD COLUMN IF NOT EXISTS "adult_kes" integer`);
  await db.execute(sql`ALTER TABLE "park_fee_rates" ADD COLUMN IF NOT EXISTS "child_kes" integer`);
  await db.execute(sql`
    ALTER TABLE "park_fee_rates" ADD COLUMN IF NOT EXISTS "infant_kes" integer NOT NULL DEFAULT 0
  `);
  await db.execute(sql`
    UPDATE "park_fee_rates"
    SET "adult_usd_low" = COALESCE("adult_usd_low", "adult_usd"),
        "child_usd_low" = COALESCE("child_usd_low", "child_usd")
  `);

  for (const row of ENCHORO_ROOM_TYPE_RATE_ROWS) {
    const existing = await db
      .select({ id: roomTypeRates.id })
      .from(roomTypeRates)
      .where(
        and(
          eq(roomTypeRates.companyId, "ewc"),
          eq(roomTypeRates.occupancy, row.occupancy),
          eq(roomTypeRates.season, row.season),
          eq(roomTypeRates.guestCategory, row.guestCategory),
          eq(roomTypeRates.year, ENCHORO_RATES_YEAR)
        )
      )
      .limit(1);
    if (existing.length === 0) {
      await db.insert(roomTypeRates).values({
        companyId: "ewc",
        occupancy: row.occupancy,
        season: row.season,
        guestCategory: row.guestCategory,
        currency: row.currency,
        amount: row.amount,
        year: ENCHORO_RATES_YEAR,
        mealBasis: ENCHORO_MEAL_BASIS,
        notes: ENCHORO_RATE_INCLUSION,
      });
    } else {
      await db
        .update(roomTypeRates)
        .set({
          currency: row.currency,
          amount: row.amount,
          mealBasis: ENCHORO_MEAL_BASIS,
          notes: ENCHORO_RATE_INCLUSION,
        })
        .where(eq(roomTypeRates.id, existing[0]!.id));
    }
  }

  const ewcTypes = await db
    .select({ id: roomTypes.id, name: roomTypes.name })
    .from(roomTypes)
    .where(eq(roomTypes.companyId, "ewc"));
  for (const type of ewcTypes) {
    const baseRate = ENCHORO_BASE_RATE_KES_LOW[type.name];
    if (baseRate == null) continue;
    await db.update(roomTypes).set({ baseRate }).where(eq(roomTypes.id, type.id));
  }

  const [mara] = await db
    .select({ id: destinations.id })
    .from(destinations)
    .where(eq(destinations.slug, MAASAI_MARA_PARK_FEES_2026.destinationSlug))
    .limit(1);

  if (mara) {
    const parkValues = {
      name: MAASAI_MARA_PARK_FEES_2026.name,
      adultUsd: MAASAI_MARA_PARK_FEES_2026.nonResident.high.adultUsd,
      childUsd: MAASAI_MARA_PARK_FEES_2026.nonResident.high.childUsd,
      infantUsd: 0,
      adultUsdLow: MAASAI_MARA_PARK_FEES_2026.nonResident.low.adultUsd,
      childUsdLow: MAASAI_MARA_PARK_FEES_2026.nonResident.low.childUsd,
      adultKes: MAASAI_MARA_PARK_FEES_2026.resident.adultKes,
      childKes: MAASAI_MARA_PARK_FEES_2026.resident.childKes,
      infantKes: 0,
    };
    const existingFees = await db
      .select({ id: parkFeeRates.id, companyId: parkFeeRates.companyId })
      .from(parkFeeRates)
      .where(eq(parkFeeRates.destinationId, mara.id));
    const companies = new Set(existingFees.map((row) => row.companyId));
    for (const fee of existingFees) {
      await db.update(parkFeeRates).set(parkValues).where(eq(parkFeeRates.id, fee.id));
    }
    for (const companyId of ["ewc", "aha"] as const) {
      if (companies.has(companyId)) continue;
      await db.insert(parkFeeRates).values({
        companyId,
        destinationId: mara.id,
        ...parkValues,
      });
    }

    const vehicleNames = new Set([
      ENCHORO_SAFARI_VEHICLE_2026.name,
      "Safari Land Cruiser",
    ]);
    const vehicles = await db.select().from(transportOptions);
    for (const row of vehicles) {
      if (!vehicleNames.has(row.name) && row.companyId !== "ewc") continue;
      if (row.vehicleType !== "landcruiser" && !vehicleNames.has(row.name)) continue;
      await db
        .update(transportOptions)
        .set({
          dailyRateUsd: ENCHORO_SAFARI_VEHICLE_2026.dailyRateUsd,
          capacity: ENCHORO_SAFARI_VEHICLE_2026.capacity,
        })
        .where(eq(transportOptions.id, row.id));
    }
    const ewcVehicle = vehicles.find(
      (row) => row.companyId === "ewc" && row.name === ENCHORO_SAFARI_VEHICLE_2026.name
    );
    if (!ewcVehicle) {
      await db.insert(transportOptions).values({
        companyId: "ewc",
        name: ENCHORO_SAFARI_VEHICLE_2026.name,
        vehicleType: ENCHORO_SAFARI_VEHICLE_2026.vehicleType,
        dailyRateUsd: ENCHORO_SAFARI_VEHICLE_2026.dailyRateUsd,
        capacity: ENCHORO_SAFARI_VEHICLE_2026.capacity,
      });
    }

    await db
      .update(accommodations)
      .set({ priceFrom: 100 })
      .where(eq(accommodations.slug, "enchoro-wildlife-camp"));
  }

  ensured = true;
}
