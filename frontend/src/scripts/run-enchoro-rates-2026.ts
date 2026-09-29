import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../lib/db");
  const { parkFeeRates, roomTypeRates, roomTypes, transportOptions } = await import("../lib/schema");
  const { ensureEnchoroRates2026 } = await import("../server/database/ensure-enchoro-rates");

  await ensureEnchoroRates2026();
  const rates = await db.select().from(roomTypeRates).where(eq(roomTypeRates.companyId, "ewc"));
  const types = await db
    .select({ name: roomTypes.name, baseRate: roomTypes.baseRate })
    .from(roomTypes)
    .where(eq(roomTypes.companyId, "ewc"));
  const park = await db.select().from(parkFeeRates);
  const transport = await db.select().from(transportOptions);
  console.log(
    JSON.stringify(
      {
        roomTypeRates: rates.length,
        occupancyRates: rates.map((row) => ({
          occupancy: row.occupancy,
          season: row.season,
          guestCategory: row.guestCategory,
          currency: row.currency,
          amount: row.amount,
        })),
        roomTypes: types,
        parkFees: park.map((row) => ({
          companyId: row.companyId,
          name: row.name,
          adultUsd: row.adultUsd,
          adultUsdLow: row.adultUsdLow,
          childUsd: row.childUsd,
          childUsdLow: row.childUsdLow,
          adultKes: row.adultKes,
          childKes: row.childKes,
        })),
        transport: transport.map((row) => ({
          companyId: row.companyId,
          name: row.name,
          dailyRateUsd: row.dailyRateUsd,
          capacity: row.capacity,
        })),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
