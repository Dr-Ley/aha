import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  accommodations,
  activityOfferings,
  attractions,
  destinations,
  parkFeeRates,
  transferOptions,
  transportOptions,
} from "@/lib/schema";
import { ensureSprint7Schema } from "@/server/database/ensure-sprint7";
import { ensureEnchoroRates2026 } from "@/server/database/ensure-enchoro-rates";
import {
  ACTIVITY_SEEDS,
  DESTINATION_CONTENT,
  EXTRA_ACCOMMODATION_SEEDS,
  PARK_FEE_SEEDS,
  TRANSFER_SEEDS,
  TRANSPORT_SEEDS,
} from "./itinerary-catalog-data";

const COMPANY_ID = "aha";

async function destId(slug: string): Promise<number | null> {
  const [row] = await db
    .select({ id: destinations.id })
    .from(destinations)
    .where(eq(destinations.slug, slug))
    .limit(1);
  return row?.id ?? null;
}

export async function seedItineraryCatalog(companyId = COMPANY_ID): Promise<void> {
  console.log("Seeding itinerary catalog (Sprint 7)...");
  await ensureSprint7Schema();
  await ensureEnchoroRates2026();

  for (const content of DESTINATION_CONTENT) {
    await db
      .update(destinations)
      .set({
        description: content.description,
        seoTitle: content.seoTitle,
        metaDescription: content.metaDescription,
        canonicalPath: `/destinations/${content.slug}`,
        image: content.image,
        published: content.published,
      })
      .where(eq(destinations.slug, content.slug));
  }

  for (const extra of EXTRA_ACCOMMODATION_SEEDS) {
    const destinationId = await destId(extra.destinationSlug);
    const existing = await db
      .select({ id: accommodations.id })
      .from(accommodations)
      .where(and(eq(accommodations.companyId, companyId), eq(accommodations.slug, extra.slug)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(accommodations).values({
        companyId,
        slug: extra.slug,
        name: extra.name,
        location: extra.location,
        country: "Kenya",
        image: ["/destination_maasai_mara1.png"],
        description: extra.description,
        amenities: ["Restaurant", "WiFi"],
        priceFrom: extra.priceFrom,
        badges: extra.badges,
        type: extra.type,
        destinationId,
      });
      console.log(`Created itinerary lodging: ${extra.name}`);
    } else if (destinationId) {
      await db
        .update(accommodations)
        .set({ destinationId })
        .where(eq(accommodations.id, existing[0]!.id));
    }
  }

  for (const fee of PARK_FEE_SEEDS) {
    const destinationId = await destId(fee.destinationSlug);
    if (!destinationId) continue;
    const existing = await db
      .select({ id: parkFeeRates.id })
      .from(parkFeeRates)
      .where(and(eq(parkFeeRates.companyId, companyId), eq(parkFeeRates.destinationId, destinationId)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(parkFeeRates).values({
        companyId,
        destinationId,
        name: fee.name,
        adultUsd: fee.adultUsd,
        childUsd: fee.childUsd,
        infantUsd: fee.infantUsd,
        adultUsdLow: fee.adultUsdLow ?? fee.adultUsd,
        childUsdLow: fee.childUsdLow ?? fee.childUsd,
        adultKes: fee.adultKes ?? null,
        childKes: fee.childKes ?? null,
      });
      console.log(`Created park fee: ${fee.name}`);
    } else {
      await db
        .update(parkFeeRates)
        .set({
          name: fee.name,
          adultUsd: fee.adultUsd,
          childUsd: fee.childUsd,
          infantUsd: fee.infantUsd,
          adultUsdLow: fee.adultUsdLow ?? fee.adultUsd,
          childUsdLow: fee.childUsdLow ?? fee.childUsd,
          adultKes: fee.adultKes ?? null,
          childKes: fee.childKes ?? null,
        })
        .where(eq(parkFeeRates.id, existing[0]!.id));
    }
  }

  const attractionRows = await db
    .select({ id: attractions.id, name: attractions.name, destinationId: attractions.destinationId })
    .from(attractions);

  for (const activity of ACTIVITY_SEEDS) {
    const destinationId = await destId(activity.destinationSlug);
    if (!destinationId) continue;
    const attractionId = activity.attractionName
      ? attractionRows.find((row) => row.destinationId === destinationId && row.name === activity.attractionName)?.id ??
        null
      : null;
    const existing = await db
      .select({ id: activityOfferings.id })
      .from(activityOfferings)
      .where(
        and(
          eq(activityOfferings.companyId, companyId),
          eq(activityOfferings.destinationId, destinationId),
          eq(activityOfferings.name, activity.name)
        )
      )
      .limit(1);
    if (existing.length === 0) {
      await db.insert(activityOfferings).values({
        companyId,
        destinationId,
        attractionId,
        name: activity.name,
        adultUsd: activity.adultUsd,
        childUsd: activity.childUsd,
      });
      console.log(`Created activity: ${activity.name}`);
    }
  }

  for (const transfer of TRANSFER_SEEDS) {
    const destinationId = transfer.destinationSlug ? await destId(transfer.destinationSlug) : null;
    const existing = await db
      .select({ id: transferOptions.id })
      .from(transferOptions)
      .where(and(eq(transferOptions.companyId, companyId), eq(transferOptions.name, transfer.name)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(transferOptions).values({
        companyId,
        name: transfer.name,
        fromLabel: transfer.fromLabel,
        toLabel: transfer.toLabel,
        destinationId,
        amountUsd: transfer.amountUsd,
        vehicleType: transfer.vehicleType,
      });
      console.log(`Created transfer: ${transfer.name}`);
    }
  }

  for (const transport of TRANSPORT_SEEDS) {
    const existing = await db
      .select({ id: transportOptions.id })
      .from(transportOptions)
      .where(and(eq(transportOptions.companyId, companyId), eq(transportOptions.name, transport.name)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(transportOptions).values({
        companyId,
        name: transport.name,
        vehicleType: transport.vehicleType,
        dailyRateUsd: transport.dailyRateUsd,
        capacity: transport.capacity,
      });
      console.log(`Created transport: ${transport.name}`);
    } else {
      await db
        .update(transportOptions)
        .set({
          vehicleType: transport.vehicleType,
          dailyRateUsd: transport.dailyRateUsd,
          capacity: transport.capacity,
        })
        .where(eq(transportOptions.id, existing[0]!.id));
    }
  }
}
