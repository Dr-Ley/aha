import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accommodations } from "@/lib/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

// GET /api/accommodations - Get all accommodations with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const country = searchParams.get("country");
    const type = searchParams.get("type");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");
    const recommended = searchParams.get("recommended");

    // Build query conditions
    let conditions = [];

    if (country && country !== "All") {
      conditions.push(eq(accommodations.country, country));
    }

    if (type && type !== "all") {
      conditions.push(eq(accommodations.type, type));
    }

    if (minPrice) {
      conditions.push(gte(accommodations.priceFrom, parseInt(minPrice)));
    }

    if (maxPrice) {
      conditions.push(lte(accommodations.priceFrom, parseInt(maxPrice)));
    }

    if (recommended === "true") {
      conditions.push(eq(accommodations.recommended, true));
    }

    // Execute query
    let allAccommodations;
    
    if (conditions.length > 0) {
      allAccommodations = await db
        .select()
        .from(accommodations)
        .where(and(...conditions));
    } else {
      allAccommodations = await db.select().from(accommodations);
    }

    // Client-side search for text fields (name, location, description)
    if (search) {
      const q = search.toLowerCase();
      allAccommodations = allAccommodations.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ 
      success: true, 
      accommodations: allAccommodations 
    });
  } catch (error) {
    console.error("Error fetching accommodations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch accommodations" },
      { status: 500 }
    );
  }
}

// POST /api/accommodations - Create new accommodation (staff only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session as any)?.user?.role;
    const userId = (session as any)?.user?.id;
    
    if (!userId || (userRole !== "staff" && userRole !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }    
    

    const body = await request.json();
    
    const [accommodation] = await db
      .insert(accommodations)
      .values({
        slug: body.slug,
        name: body.name,
        location: body.location,
        country: body.country,
        image: body.image,
        description: body.description,
        amenities: body.amenities,
        priceFrom: body.priceFrom,
        badges: body.badges,
        recommended: body.recommended ?? false,
        type: body.type,
        likes: 0,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      accommodation 
    });
  } catch (error) {
    console.error("Error creating accommodation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create accommodation" },
      { status: 500 }
    );
  }
}

// PATCH /api/accommodations - Update accommodation (staff only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    const userRole = (session as any)?.user?.role;
    const userId = (session as any)?.user?.id;
    
    if (!userId || (userRole !== "staff" && userRole !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing accommodation ID" },
        { status: 400 }
      );
    }

    const [updatedAccommodation] = await db
      .update(accommodations)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(accommodations.id, id))
      .returning();

    if (!updatedAccommodation) {
      return NextResponse.json(
        { success: false, error: "Accommodation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      accommodation: updatedAccommodation 
    });
  } catch (error) {
    console.error("Error updating accommodation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update accommodation" },
      { status: 500 }
    );
  }
}

// DELETE /api/accommodations - Delete accommodation (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    // Only admin can delete
    const userRole = (session as any)?.user?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden - Admin only" },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing accommodation ID" },
        { status: 400 }
      );
    }

    await db
      .delete(accommodations)
      .where(eq(accommodations.id, parseInt(id)));

    return NextResponse.json({ 
      success: true, 
      message: "Accommodation deleted" 
    });
  } catch (error) {
    console.error("Error deleting accommodation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete accommodation" },
      { status: 500 }
    );
  }
}

// Import auth at the top
import { auth } from "@/lib/auth";