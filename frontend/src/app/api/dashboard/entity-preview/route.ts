import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  barItems,
  barOrderItems,
  barOrders,
  bookings,
  contactSubmissions,
  expenses,
  hotelBookingRooms,
  hotelBookings,
  payments,
  restaurantItems,
  restaurantOrderItems,
  restaurantOrders,
  roomTypes,
  rooms,
  tours,
} from "@/lib/schema";
import { requireTenantContext } from "@/server/tenancy";
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
    const sp = new URL(request.url).searchParams;
    const type = sp.get("type") as PreviewType | null;
    const id = sp.get("id");

    if (!type || !PREVIEW_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (!id) {
      return NextResponse.json({ error: "id and companyId required" }, { status: 400 });
    }
    const nid = parseInt(id, 10);
    if (Number.isNaN(nid)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const tenant = await requireTenantContext(sp.get("companyId"), {
      module: moduleForPreview(type),
      requireEdit: false,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    switch (type) {
      case "booking": {
        const { ensureBookingCustomerColumn, ensureBookingTravellerColumns } = await import("@/lib/customers");
        await ensureBookingCustomerColumn();
        await ensureBookingTravellerColumns();
        const { ensureBookingComponentTables } = await import("@/lib/booking-components");
        await ensureBookingComponentTables();
        const [row] = await db
          .select({ booking: bookings, tour: tours })
          .from(bookings)
          .leftJoin(tours, eq(bookings.tourId, tours.id))
          .where(and(eq(bookings.id, nid), eq(bookings.companyId, companyId)))
          .limit(1);
        if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const { listComponentsForBooking } = await import("@/lib/booking-components");
        const components = await listComponentsForBooking(row.booking.id);
        return NextResponse.json({
          success: true,
          kind: type,
          data: { ...row.booking, tour: row.tour, components },
        });
      }
      case "hotel": {
        const { ensureHotelStayPartyColumns } = await import("@/lib/customers");
        await ensureHotelStayPartyColumns();
        const { ensureHotelBookingRoomsTable } = await import("@/server/database/ensure-hotel-booking-rooms");
        await ensureHotelBookingRoomsTable();
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
        const allocated = await db
          .select({
            id: rooms.id,
            code: rooms.code,
            name: rooms.name,
            roomTypeName: roomTypes.name,
            quantity: hotelBookingRooms.quantity,
          })
          .from(hotelBookingRooms)
          .innerJoin(rooms, eq(hotelBookingRooms.roomId, rooms.id))
          .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
          .where(eq(hotelBookingRooms.hotelBookingId, nid));
        return NextResponse.json({
          success: true,
          kind: type,
          data: {
            ...row.booking,
            room: row.room,
            rooms: allocated,
            additionalOccupants: row.booking.additionalOccupants ?? [],
          },
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
          .select({
            itemName: restaurantItems.name,
            quantity: restaurantOrderItems.quantity,
            unitPrice: restaurantOrderItems.unitPrice,
            lineTotal: restaurantOrderItems.lineTotal,
          })
          .from(restaurantOrderItems)
          .leftJoin(restaurantItems, eq(restaurantOrderItems.itemId, restaurantItems.id))
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
          .select({
            itemName: barItems.name,
            quantity: barOrderItems.quantity,
            unitPrice: barOrderItems.unitPrice,
            lineTotal: barOrderItems.lineTotal,
          })
          .from(barOrderItems)
          .leftJoin(barItems, eq(barOrderItems.itemId, barItems.id))
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
          .where(and(eq(contactSubmissions.id, nid), eq(contactSubmissions.companyId, companyId)))
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
