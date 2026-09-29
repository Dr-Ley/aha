import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers } from "@/lib/schema";
import type { CompanyId } from "@/types/company";
import {
  canAutoMatchCustomer,
  customerDraftFromGuest,
  customerDraftFromHotelGuest,
  displayCustomerName,
  mergeCustomerProfile,
  rankCustomerMatch,
  type CustomerGuestInput,
  type CustomerMatchReason,
  type HotelGuestInput,
} from "@/lib/customer-identity";

let customersReady = false;
let bookingCustomerColumnEnsured = false;
let hotelGuestCustomerColumnEnsured = false;
let hotelStayPartyColumnsEnsured = false;
let bookingTravellerColumnsEnsured = false;

/** Schema includes `bookings.customer_id`; add it before any `select()` from bookings. */
export async function ensureBookingCustomerColumn(): Promise<void> {
  if (bookingCustomerColumnEnsured) return;
  await db.execute(sql`
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customer_id" integer
  `);
  bookingCustomerColumnEnsured = true;
}

/** Schema includes `hotel_booking_guests.customer_id`; add it before any `select()` from guests. */
export async function ensureHotelGuestCustomerColumn(): Promise<void> {
  if (hotelGuestCustomerColumnEnsured) return;
  await db.execute(sql`
    ALTER TABLE "hotel_booking_guests" ADD COLUMN IF NOT EXISTS "customer_id" integer
  `);
  hotelGuestCustomerColumnEnsured = true;
}

export async function ensureBookingTravellerColumns(): Promise<void> {
  if (bookingTravellerColumnsEnsured) return;
  await db.execute(sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "adults" integer NOT NULL DEFAULT 1`);
  await db.execute(sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "children" integer NOT NULL DEFAULT 0`);
  await db.execute(sql`ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "infants" integer NOT NULL DEFAULT 0`);
  await db.execute(sql`
    UPDATE "bookings"
    SET "adults" = GREATEST("guests", 1)
    WHERE "children" = 0 AND "infants" = 0 AND "guests" > "adults"
  `);
  bookingTravellerColumnsEnsured = true;
}

/** Primary guest + occupant names live on the stay; customer_id is optional. */
export async function ensureHotelStayPartyColumns(): Promise<void> {
  if (hotelStayPartyColumnsEnsured) return;
  await ensureHotelGuestCustomerColumn();
  await db.execute(sql`ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "customer_id" integer`);
  await db.execute(sql`ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "primary_guest_name" varchar(255)`);
  await db.execute(sql`ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "primary_guest_phone" varchar(50)`);
  await db.execute(sql`ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "primary_guest_email" varchar(255)`);
  await db.execute(sql`ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "additional_occupants" jsonb NOT NULL DEFAULT '[]'::jsonb`);
  await db.execute(sql`ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "adults" integer NOT NULL DEFAULT 1`);
  await db.execute(sql`ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "children" integer NOT NULL DEFAULT 0`);
  await db.execute(sql`ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "infants" integer NOT NULL DEFAULT 0`);
  await db.execute(sql`
    ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "pricing_source" varchar(32) DEFAULT 'manual'
  `);
  await db.execute(sql`
    ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "guest_category" varchar(32) DEFAULT 'resident'
  `);
  await db.execute(sql`
    ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "currency" varchar(10) DEFAULT 'KES' NOT NULL
  `);
  await db.execute(sql`
    UPDATE "hotel_bookings" hb
    SET
      "customer_id" = COALESCE(hb.customer_id, g.customer_id),
      "primary_guest_name" = COALESCE(NULLIF(hb.primary_guest_name, ''), g.full_name),
      "primary_guest_phone" = COALESCE(hb.primary_guest_phone, g.phone),
      "primary_guest_email" = COALESCE(hb.primary_guest_email, g.email)
    FROM "hotel_booking_guests" g
    WHERE g.hotel_booking_id = hb.id
      AND g.is_primary = true
  `);
  await db.execute(sql`
    UPDATE "hotel_bookings" hb
    SET "additional_occupants" = COALESCE((
      SELECT jsonb_agg(trim(g.full_name) ORDER BY g.id)
      FROM "hotel_booking_guests" g
      WHERE g.hotel_booking_id = hb.id
        AND g.is_primary = false
        AND trim(g.full_name) <> ''
    ), hb.additional_occupants)
    WHERE COALESCE(jsonb_array_length(hb.additional_occupants), 0) = 0
  `);
  await db.execute(sql`
    UPDATE "hotel_bookings"
    SET "adults" = GREATEST(
      1,
      1 + COALESCE(jsonb_array_length("additional_occupants"), 0)
    )
    WHERE "children" = 0 AND "infants" = 0 AND "adults" = 1
      AND COALESCE(jsonb_array_length("additional_occupants"), 0) > 0
  `);
  hotelStayPartyColumnsEnsured = true;
}

export async function ensureCustomersReady(): Promise<void> {
  if (customersReady) return;
  await ensureBookingCustomerColumn();
  await ensureBookingTravellerColumns();
  await ensureHotelGuestCustomerColumn();
  await ensureHotelStayPartyColumns();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "customers" (
      "id" serial PRIMARY KEY,
      "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
      "user_id" integer REFERENCES "users"("id"),
      "first_name" varchar(100) NOT NULL,
      "last_name" varchar(100),
      "email" varchar(255),
      "phone" varchar(50),
      "nationality" varchar(100),
      "country" varchar(100),
      "notes" text,
      "preferences" text,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    ALTER TABLE "customers" ALTER COLUMN "email" DROP NOT NULL
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "customers_company_email"
    ON "customers" ("company_id", "email")
  `);
  await db.execute(sql`
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customer_id" integer
  `);
  await db.execute(sql`
    INSERT INTO "customers" (
      "company_id", "first_name", "last_name", "email", "phone", "nationality", "country"
    )
    SELECT DISTINCT ON (b.company_id, lower(b.email))
      b.company_id,
      COALESCE(NULLIF(b.first_name, ''), 'Guest'),
      b.last_name,
      lower(b.email),
      b.phone,
      b.country,
      b.country
    FROM "bookings" b
    WHERE b.email IS NOT NULL AND b.email <> ''
    ON CONFLICT ("company_id", "email") DO NOTHING
  `);
  await db.execute(sql`
    UPDATE "bookings" b
    SET "customer_id" = c.id
    FROM "customers" c
    WHERE b.customer_id IS NULL
      AND c.company_id = b.company_id
      AND lower(b.email) = c.email
  `);
  await db.execute(sql`
    INSERT INTO "customers" (
      "company_id", "first_name", "last_name", "email", "phone", "nationality", "country"
    )
    SELECT DISTINCT ON (hb.company_id, lower(g.email))
      hb.company_id,
      COALESCE(NULLIF(split_part(trim(g.full_name), ' ', 1), ''), 'Guest'),
      NULLIF(
        CASE
          WHEN position(' ' in trim(g.full_name)) > 0
          THEN trim(substring(trim(g.full_name) from position(' ' in trim(g.full_name)) + 1))
          ELSE NULL
        END,
        ''
      ),
      lower(g.email),
      g.phone,
      g.country,
      g.country
    FROM "hotel_booking_guests" g
    INNER JOIN "hotel_bookings" hb ON hb.id = g.hotel_booking_id
    WHERE g.is_primary = true
      AND g.email IS NOT NULL AND g.email <> '' AND position('@' in g.email) > 0
    ON CONFLICT ("company_id", "email") DO NOTHING
  `);
  await db.execute(sql`
    UPDATE "hotel_booking_guests" g
    SET "customer_id" = c.id
    FROM "hotel_bookings" hb, "customers" c
    WHERE g.customer_id IS NULL
      AND g.is_primary = true
      AND hb.id = g.hotel_booking_id
      AND c.company_id = hb.company_id
      AND g.email IS NOT NULL
      AND lower(g.email) = c.email
  `);
  await db.execute(sql`
    UPDATE "customers" c
    SET "last_name" = NULLIF(
      trim(substring(trim(g.full_name) from position(' ' in trim(g.full_name)) + 1)),
      ''
    ),
    "updated_at" = now()
    FROM "hotel_booking_guests" g
    INNER JOIN "hotel_bookings" hb ON hb.id = g.hotel_booking_id
    WHERE g.customer_id = c.id
      AND hb.company_id = c.company_id
      AND c.last_name = g.full_name
  `);
  await db.execute(sql`
    UPDATE "hotel_bookings" hb
    SET "customer_id" = COALESCE(hb.customer_id, g.customer_id)
    FROM "hotel_booking_guests" g
    WHERE g.hotel_booking_id = hb.id
      AND g.is_primary = true
      AND hb.customer_id IS NULL
      AND g.customer_id IS NOT NULL
  `);
  customersReady = true;
}

export async function findOrCreateCustomerFromGuest(
  companyId: CompanyId,
  guest: CustomerGuestInput,
  userId?: number | null
): Promise<number | null> {
  await ensureCustomersReady();
  const draft = customerDraftFromGuest(guest);
  if (!canAutoMatchCustomer(draft)) return null;

  const [existing] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.companyId, companyId), eq(customers.email, draft.email)))
    .limit(1);

  if (existing) {
    const merged = mergeCustomerProfile(
      {
        firstName: existing.firstName,
        lastName: existing.lastName,
        email: existing.email,
        phone: existing.phone,
        nationality: existing.nationality,
        country: existing.country,
      },
      draft
    );
    const needsUpdate =
      merged.firstName !== existing.firstName ||
      merged.lastName !== existing.lastName ||
      merged.phone !== existing.phone ||
      merged.nationality !== existing.nationality ||
      merged.country !== existing.country ||
      (userId != null && existing.userId == null);
    if (needsUpdate) {
      await db
        .update(customers)
        .set({
          firstName: merged.firstName,
          lastName: merged.lastName,
          phone: merged.phone,
          nationality: merged.nationality,
          country: merged.country,
          userId: existing.userId ?? userId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, existing.id));
    }
    return existing.id;
  }

  const [created] = await db
    .insert(customers)
    .values({
      companyId,
      userId: userId ?? null,
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
      phone: draft.phone,
      nationality: draft.nationality,
      country: draft.country,
    })
    .returning({ id: customers.id });
  return created?.id ?? null;
}

/** Staff-confirmed create. Email is optional; phone-only walk-ins are allowed. */
export async function createCustomerFromStaff(
  companyId: CompanyId,
  guest: CustomerGuestInput,
  userId?: number | null
): Promise<number | null> {
  await ensureCustomersReady();
  const draft = customerDraftFromGuest(guest);
  if (!draft) return null;
  if (canAutoMatchCustomer(draft)) {
    return findOrCreateCustomerFromGuest(companyId, guest, userId);
  }

  const [created] = await db
    .insert(customers)
    .values({
      companyId,
      userId: userId ?? null,
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: null,
      phone: draft.phone,
      nationality: draft.nationality,
      country: draft.country,
    })
    .returning({ id: customers.id });
  return created?.id ?? null;
}

export async function findOrCreateCustomerFromHotelGuest(
  companyId: CompanyId,
  guest: HotelGuestInput,
  userId?: number | null
): Promise<number | null> {
  const draft = customerDraftFromHotelGuest(guest);
  if (!canAutoMatchCustomer(draft)) return null;
  return findOrCreateCustomerFromGuest(
    companyId,
    {
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
      phone: draft.phone,
      country: draft.country,
    },
    userId
  );
}

export type CustomerSuggestion = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  reason: CustomerMatchReason;
};

export async function suggestCustomersForGuest(
  companyId: CompanyId,
  guest: HotelGuestInput
): Promise<CustomerSuggestion[]> {
  await ensureCustomersReady();
  const rows = await db.select().from(customers).where(eq(customers.companyId, companyId));
  const ranked = rows
    .map((row) => {
      const reason = rankCustomerMatch(guest, row);
      if (!reason) return null;
      return {
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        reason,
      };
    })
    .filter((row): row is CustomerSuggestion => row != null);
  const order: Record<CustomerMatchReason, number> = { email: 0, phone: 1, name: 2 };
  ranked.sort((a, b) => order[a.reason] - order[b.reason] || a.id - b.id);
  return ranked.slice(0, 8);
}

export async function listCustomersForCompany(companyId: CompanyId, query?: string) {
  await ensureCustomersReady();
  const rows = await db
    .select({
      id: customers.id,
      companyId: customers.companyId,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      nationality: customers.nationality,
      country: customers.country,
      notes: customers.notes,
      preferences: customers.preferences,
      createdAt: customers.createdAt,
      bookingCount: sql<number>`(
        SELECT count(*)::int FROM "bookings" b WHERE b.customer_id = "customers"."id"
      )`,
      hotelStayCount: sql<number>`(
        SELECT count(*)::int FROM "hotel_bookings" hb WHERE hb.customer_id = "customers"."id"
      )`,
      lastActivity: sql<string | null>`(
        SELECT max(d)::text FROM (
          SELECT b.created_at::date AS d FROM "bookings" b WHERE b.customer_id = "customers"."id"
          UNION ALL
          SELECT hb.check_in_date::date AS d
          FROM "hotel_bookings" hb
          WHERE hb.customer_id = "customers"."id"
        ) activity
      )`,
    })
    .from(customers)
    .where(eq(customers.companyId, companyId));
  const needle = query?.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    `${displayCustomerName(row)} ${row.email ?? ""} ${row.phone ?? ""} ${row.nationality ?? ""} ${row.notes ?? ""}`
      .toLowerCase()
      .includes(needle)
  );
}

export async function getCustomerForCompany(companyId: CompanyId, id: number) {
  await ensureCustomersReady();
  const [row] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function getCustomerHistory(companyId: CompanyId, customerId: number) {
  await ensureCustomersReady();
  const { bookings, hotelBookings } = await import("@/lib/schema");
  const safariRows = await db
    .select({
      id: bookings.id,
      safariPackage: bookings.safariPackage,
      travelDate: bookings.travelDate,
      startDate: bookings.startDate,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      originalAmount: bookings.originalAmount,
      originalCurrency: bookings.originalCurrency,
      totalPrice: bookings.totalPrice,
    })
    .from(bookings)
    .where(and(eq(bookings.customerId, customerId), eq(bookings.companyId, companyId)));
  const stayRows = await db
    .select({
      id: hotelBookings.id,
      checkInDate: hotelBookings.checkInDate,
      checkOutDate: hotelBookings.checkOutDate,
      status: hotelBookings.status,
      paymentStatus: hotelBookings.paymentStatus,
      totalAmount: hotelBookings.totalAmount,
    })
    .from(hotelBookings)
    .where(and(eq(hotelBookings.customerId, customerId), eq(hotelBookings.companyId, companyId)));
  return { safaris: safariRows, stays: stayRows };
}

export async function getCustomerWithHistory(companyId: CompanyId, id: number) {
  const customer = await getCustomerForCompany(companyId, id);
  if (!customer) return null;
  const history = await getCustomerHistory(companyId, id);
  return { customer, ...history };
}

export async function updateCustomerForCompany(
  companyId: CompanyId,
  id: number,
  patch: {
    firstName?: string;
    lastName?: string | null;
    phone?: string | null;
    nationality?: string | null;
    country?: string | null;
    notes?: string | null;
    preferences?: string | null;
  }
) {
  await ensureCustomersReady();
  const [updated] = await db
    .update(customers)
    .set({
      ...(patch.firstName !== undefined ? { firstName: patch.firstName } : {}),
      ...(patch.lastName !== undefined ? { lastName: patch.lastName } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      ...(patch.nationality !== undefined ? { nationality: patch.nationality } : {}),
      ...(patch.country !== undefined ? { country: patch.country } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.preferences !== undefined ? { preferences: patch.preferences } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(customers.id, id), eq(customers.companyId, companyId)))
    .returning();
  return updated ?? null;
}
