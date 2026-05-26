import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  barOrderItems,
  barOrders,
  bookings,
  contactSubmissions,
  expenses,
  hotelBookingGuests,
  hotelBookings,
  payments,
  restaurantOrderItems,
  restaurantOrders,
  roomTypes,
  rooms,
  tours,
} from "@/lib/schema";
import { auth } from "@/lib/auth";
import { checkApiPermission, canAccessDashboardFromSession, getUserIdFromSession } from "@/lib/permissions-server";
import { isValidCompanyId, resolveCompanyId } from "@/lib/tenant";
import type { DashboardModuleId } from "@/lib/dashboard-modules";

const PREVIEW_TYPES = ["booking", "hotel", "payment", "expense", "restaurant", "bar", "enquiry"] as const;
type PreviewType = (typeof PREVIEW_TYPES)[number];

function moduleForPreview(t: PreviewType): DashboardModuleId {
  switch (t) {
    case "booking":
      return "bookings";
    case "hotel":
      return "accommodation";
    case "payment":
      return "payments";
    case "expense":
      return "expenses";
    case "restaurant":
      return "restaurant";
    case "bar":
      return "bar";
    case "enquiry":
      return "enquiries";
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromSession(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sp = new URL(request.url).searchParams;
    const type = sp.get("type") as PreviewType | null;
    const id = sp.get("id");
    const companyId = resolveCompanyId(sp.get("companyId"));

    if (!type || !PREVIEW_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (!id || !isValidCompanyId(companyId)) {
      return NextResponse.json({ error: "id and companyId required" }, { status: 400 });
    }
    const nid = parseInt(id, 10);
    if (Number.isNaN(nid)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const mod = moduleForPreview(type);
    if (type === "enquiry") {
      const denied = await checkApiPermission(session, "aha", "enquiries", false);
      if (denied) return denied;
    } else {
      const denied = await checkApiPermission(session, companyId, mod, false);
      if (denied) return denied;
    }

    switch (type) {
      case "booking": {
        const [row] = await db
          .select({ booking: bookings, tour: tours })
          .from(bookings)
          .leftJoin(tours, eq(bookings.tourId, tours.id))
          .where(and(eq(bookings.id, nid), eq(bookings.companyId, companyId)))
          .limit(1);
        if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({
          success: true,
          kind: type,
          data: { ...row.booking, tour: row.tour },
        });
      }
      case "hotel": {
        const [row] = await db
          .select({
            booking: hotelBookings,
            room: {
              id: rooms.id,
              code: rooms.code,
              name: rooms.name,
              roomTypeName: roomTypes.name,
            },
          })
          .from(hotelBookings)
          .leftJoin(rooms, eq(hotelBookings.roomId, rooms.id))
          .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
          .where(and(eq(hotelBookings.id, nid), eq(hotelBookings.companyId, companyId)))
          .limit(1);
        if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const guests = await db
          .select()
          .from(hotelBookingGuests)
          .where(eq(hotelBookingGuests.hotelBookingId, nid));
        return NextResponse.json({
          success: true,
          kind: type,
          data: { ...row.booking, room: row.room, guests },
        });
      }
      case "payment": {
        const [row] = await db
          .select()
          .from(payments)
          .where(and(eq(payments.id, nid), eq(payments.companyId, companyId)))
          .limit(1);
        if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, kind: type, data: row });
      }
      case "expense": {
        const [row] = await db
          .select()
          .from(expenses)
          .where(and(eq(expenses.id, nid), eq(expenses.companyId, companyId)))
          .limit(1);
        if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, kind: type, data: row });
      }
      case "restaurant": {
        const [order] = await db
          .select()
          .from(restaurantOrders)
          .where(and(eq(restaurantOrders.id, nid), eq(restaurantOrders.companyId, companyId)))
          .limit(1);
        if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const lines = await db
          .select()
          .from(restaurantOrderItems)
          .where(eq(restaurantOrderItems.orderId, nid));
        return NextResponse.json({
          success: true,
          kind: type,
          data: { order, lineItems: lines },
        });
      }
      case "bar": {
        const [order] = await db
          .select()
          .from(barOrders)
          .where(and(eq(barOrders.id, nid), eq(barOrders.companyId, companyId)))
          .limit(1);
        if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const lines = await db
          .select()
          .from(barOrderItems)
          .where(eq(barOrderItems.orderId, nid));
        return NextResponse.json({
          success: true,
          kind: type,
          data: { order, lineItems: lines },
        });
      }
      case "enquiry": {
        const [row] = await db
          .select()
          .from(contactSubmissions)
          .where(eq(contactSubmissions.id, nid))
          .limit(1);
        if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, kind: type, data: row });
      }
    }
  } catch (e) {
    console.error("entity-preview GET", e);
    return NextResponse.json({ error: "Failed to load entity" }, { status: 500 });
  }
}
