import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let ensured = false;

export async function ensureHotelBookingRoomsTable(): Promise<void> {
  if (ensured) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "hotel_booking_rooms" (
      "id" serial PRIMARY KEY,
      "hotel_booking_id" integer NOT NULL REFERENCES "hotel_bookings"("id") ON DELETE CASCADE,
      "room_id" integer NOT NULL REFERENCES "rooms"("id"),
      "quantity" integer NOT NULL DEFAULT 1,
      "nightly_rate" integer,
      "created_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "hotel_booking_rooms_stay_room"
    ON "hotel_booking_rooms" ("hotel_booking_id", "room_id")
  `);
  await db.execute(sql`
    INSERT INTO "hotel_booking_rooms" ("hotel_booking_id", "room_id", "quantity")
    SELECT hb.id, hb.room_id, 1
    FROM "hotel_bookings" hb
    WHERE NOT EXISTS (
      SELECT 1 FROM "hotel_booking_rooms" x
      WHERE x."hotel_booking_id" = hb.id AND x."room_id" = hb.room_id
    )
  `);
  ensured = true;
}
