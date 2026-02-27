import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, tours } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, desc, and, gte } from "drizzle-orm";

// Helper to convert user ID to number
function getUserId(session: any): number | null {
  if (!session?.user?.id) return null;
  return typeof session.user.id === 'string' 
    ? parseInt(session.user.id, 10) 
    : session.user.id;
}

// Helper to check if user is staff/admin
function isStaff(session: any): boolean {
  return session?.user?.role === 'staff' || session?.user?.role === 'admin';
}

// GET /api/bookings - Get bookings (user's own or all for staff)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if staff/admin - if so, return all bookings
    const staffCheck = isStaff(session);

    let allBookings;

    if (staffCheck) {
      // Staff/Admin: Get all bookings with related data
      // Note: Using raw query since relations might not be set up
      allBookings = await db
        .select({
          booking: bookings,
          tour: tours,
        })
        .from(bookings)
        .leftJoin(tours, eq(bookings.tourId, tours.id))
        .orderBy(desc(bookings.createdAt));
    } else {
      // Customer: Get only their bookings
      allBookings = await db
        .select({
          booking: bookings,
          tour: tours,
        })
        .from(bookings)
        .leftJoin(tours, eq(bookings.tourId, tours.id))
        .where(eq(bookings.userId, userId))
        .orderBy(desc(bookings.createdAt));
    }

    return NextResponse.json({ 
      success: true,
      bookings: allBookings.map(item => ({
        ...item.booking,
        tour: item.tour,
      }))
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    // Get tour ID from slug if provided
    let tourId: number | undefined = body.tourId;
    if (tourId == null && body.tourSlug) {
      const [tour] = await db
        .select({ id: tours.id })
        .from(tours)
        .where(eq(tours.slug, body.tourSlug))
        .limit(1);
      tourId = tour?.id;
    }

    if (!tourId) {
      return NextResponse.json(
        { success: false, error: "Tour not found" },
        { status: 404 }
      );
    }

    // Get user ID from session if logged in, otherwise null (guest booking)
    const userId = getUserId(session);

    const [booking] = await db
      .insert(bookings)
      .values({
        userId: userId, // null for guest bookings
        tourId: tourId,
        status: "pending",
        travelDate: body.travelDate,
        guests: parseInt(body.guests, 10),
        accommodation: body.accommodation ?? "mid-range",
        transport: body.transport ?? "4x4-landcruiser",
        specialRequests: body.specialRequests ?? null,
        firstName: body.firstName,
        lastName: body.lastName ?? null,
        email: body.email,
        phone: body.phone ?? null,
        country: body.country ?? null,
        pricePerPerson: body.pricePerPerson ?? null,
        totalPrice: body.totalPrice ?? null,
      })
      .returning();

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

// PATCH /api/bookings - Update booking status (staff only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if staff/admin
    if (!isStaff(session)) {
      return NextResponse.json(
        { error: "Forbidden - Staff only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bookingId, status, ...updateData } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: "Missing bookingId or status" },
        { status: 400 }
      );
    }

    const [updatedBooking] = await db
      .update(bookings)
      .set({
        status,
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    if (!updatedBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings - Delete booking (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only admin can delete
    const userRole = (session as any)?.user?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden - Admin only" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing booking ID" },
        { status: 400 }
      );
    }

    await db
      .delete(bookings)
      .where(eq(bookings.id, parseInt(bookingId)));

    return NextResponse.json({
      success: true,
      message: "Booking deleted",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}