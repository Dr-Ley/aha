import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  accommodationProviders,
  accommodations,
  destinations,
  properties,
  roomTypes,
  rooms,
} from "@/lib/schema";
import { inferDestinationSlug } from "../destinations-data";
import { toTourismSlug } from "../slug";

const ENCHORO_SLUG = "enchoro-wildlife-camp";

async function destinationIdBySlug(slug: string | null): Promise<number | null> {
  if (!slug) return null;
  const [row] = await db
    .select({ id: destinations.id })
    .from(destinations)
    .where(eq(destinations.slug, slug))
    .limit(1);
  return row?.id ?? null;
}

async function ensureProvider(input: {
  name: string;
  type: "partner" | "tenant";
  companyId?: string | null;
}): Promise<number> {
  const existing = input.companyId
    ? await db
        .select({ id: accommodationProviders.id })
        .from(accommodationProviders)
        .where(
          and(
            eq(accommodationProviders.companyId, input.companyId),
            eq(accommodationProviders.type, input.type)
          )
        )
        .limit(1)
    : await db
        .select({ id: accommodationProviders.id })
        .from(accommodationProviders)
        .where(eq(accommodationProviders.name, input.name))
        .limit(1);

  if (existing[0]) return existing[0].id;

  const [created] = await db
    .insert(accommodationProviders)
    .values({
      name: input.name,
      type: input.type,
      companyId: input.companyId ?? null,
    })
    .returning({ id: accommodationProviders.id });
  return created.id;
}

async function ensureProperty(input: {
  providerId: number;
  companyId: string | null;
  slug: string;
  name: string;
  location: string;
  country: string;
  amenities: string[];
  description: string | null;
  destinationId: number | null;
}): Promise<number> {
  const existing = input.companyId
    ? await db
        .select({ id: properties.id })
        .from(properties)
        .where(and(eq(properties.companyId, input.companyId), eq(properties.slug, input.slug)))
        .limit(1)
    : await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.slug, input.slug))
        .limit(1);

  if (existing[0]) return existing[0].id;

  const [created] = await db
    .insert(properties)
    .values({
      providerId: input.providerId,
      companyId: input.companyId,
      destinationId: input.destinationId,
      slug: input.slug,
      name: input.name,
      location: input.location,
      country: input.country,
      amenities: input.amenities,
      description: input.description,
    })
    .returning({ id: properties.id });
  return created.id;
}

/**
 * Company-owned properties for EWC (Enchoro) and BTH. Room types/rooms
 * are linked so hotel inventory sits under a property (E8.4).
 */
export async function seedTenantOwnedProperties(): Promise<void> {
  const maraId = await destinationIdBySlug("maasai-mara");

  const ewcProviderId = await ensureProvider({
    name: "Enchoro Wildlife Camp",
    type: "tenant",
    companyId: "ewc",
  });
  const ewcPropertyId = await ensureProperty({
    providerId: ewcProviderId,
    companyId: "ewc",
    slug: ENCHORO_SLUG,
    name: "Enchoro Wildlife Camp",
    location: "Near Oloolaimutia Gate, Maasai Mara",
    country: "Kenya",
    amenities: ["Restaurant", "Bar", "Hot Shower", "Ensuite Tents", "WiFi", "Parking"],
    description: "Company-owned tented camp at Oloolaimutia Gate.",
    destinationId: maraId,
  });

  await db
    .update(roomTypes)
    .set({ propertyId: ewcPropertyId })
    .where(and(eq(roomTypes.companyId, "ewc"), isNull(roomTypes.propertyId)));
  await db
    .update(rooms)
    .set({ propertyId: ewcPropertyId })
    .where(and(eq(rooms.companyId, "ewc"), isNull(rooms.propertyId)));

  const bthProviderId = await ensureProvider({
    name: "Bondo Travellers Hotel",
    type: "tenant",
    companyId: "bth",
  });
  const bthPropertyId = await ensureProperty({
    providerId: bthProviderId,
    companyId: "bth",
    slug: "bondo-travellers-hotel",
    name: "Bondo Travellers Hotel",
    location: "Bondo, Kenya",
    country: "Kenya",
    amenities: ["Restaurant", "Bar", "Parking"],
    description: "Company-owned hotel in Bondo.",
    destinationId: null,
  });

  await db
    .update(roomTypes)
    .set({ propertyId: bthPropertyId })
    .where(and(eq(roomTypes.companyId, "bth"), isNull(roomTypes.propertyId)));
  await db
    .update(rooms)
    .set({ propertyId: bthPropertyId })
    .where(and(eq(rooms.companyId, "bth"), isNull(rooms.propertyId)));
}

/**
 * Copy existing catalog accommodations into providers + properties.
 * Catalog rows stay; slugs are unchanged. Enchoro links to the EWC tenant property.
 */
export async function migrateCatalogAccommodations(): Promise<void> {
  const catalog = await db.select().from(accommodations);
  let linked = 0;
  for (const row of catalog) {
    if (row.propertyId) continue;

    const destSlug = inferDestinationSlug(`${row.name} ${row.location}`);
    const destinationId = await destinationIdBySlug(destSlug);
    const slug = toTourismSlug(row.slug) || row.slug;

    let providerId: number;
    let propertyId: number;
    const companyId: string | null = row.companyId;

    if (slug === ENCHORO_SLUG) {
      providerId = await ensureProvider({
        name: "Enchoro Wildlife Camp",
        type: "tenant",
        companyId: "ewc",
      });
      propertyId = await ensureProperty({
        providerId,
        companyId: "ewc",
        slug: ENCHORO_SLUG,
        name: row.name,
        location: row.location,
        country: row.country,
        amenities: row.amenities,
        description: row.description,
        destinationId,
      });
    } else {
      providerId = await ensureProvider({
        name: row.name,
        type: "partner",
        companyId: null,
      });
      propertyId = await ensureProperty({
        providerId,
        companyId,
        slug,
        name: row.name,
        location: row.location,
        country: row.country,
        amenities: row.amenities,
        description: row.description,
        destinationId,
      });
    }

    await db
      .update(accommodations)
      .set({
        providerId,
        propertyId,
        destinationId,
      })
      .where(eq(accommodations.id, row.id));
    linked += 1;
  }
  console.log(`Linked ${linked} catalog accommodation(s) to properties.`);
}
