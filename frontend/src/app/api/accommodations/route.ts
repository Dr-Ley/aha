import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapDbAccommodationToAccommodation } from "@/lib/accommodations-db";
import { accommodations, likes } from "@/lib/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { ensureCatalogCompanyColumns } from "@/lib/catalog-company";
import { requireCompanyId } from "@/lib/tenant";
import { requireTenantContext } from "@/server/tenancy";
import { accommodationPatchSchema, accommodationQuerySchema, accommodationWriteSchema } from "@/lib/schemas/public";

// GET /api/accommodations - Get all accommodations with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const parsedQuery = accommodationQuerySchema.safeParse({
      country: searchParams.get("country") || undefined,
      type: searchParams.get("type") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      search: searchParams.get("search") || undefined,
      recommended: searchParams.get("recommended") || undefined,
    });
    if (!parsedQuery.success) {
      return NextResponse.json(
        { success: false, error: "Invalid filters" },
        { status: 400 }
      );
    }
    const { country, type, minPrice, maxPrice, search, recommended } = parsedQuery.data;

    await ensureCatalogCompanyColumns();
    const company = requireCompanyId(searchParams.get("companyId"));
    if (!company.ok) return company.response;
    const companyId = company.companyId;
    const conditions = [eq(accommodations.companyId, companyId)];

    if (country && country !== "All") {
      conditions.push(eq(accommodations.country, country));
    }

    if (type && type !== "all") {
      conditions.push(eq(accommodations.type, type));
    }

    if (minPrice != null) {
      conditions.push(gte(accommodations.priceFrom, minPrice));
    }

    if (maxPrice != null) {
      conditions.push(lte(accommodations.priceFrom, maxPrice));
    }

    if (recommended === "true") {
      conditions.push(eq(accommodations.recommended, true));
    }

    // Execute query — company_id is always in conditions
    let allAccommodations = await db
      .select()
      .from(accommodations)
      .where(and(...conditions));

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
      accommodations: allAccommodations.map(mapDbAccommodationToAccommodation),
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
    const parsed = accommodationWriteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid accommodation data" },
        { status: 400 }
      );
    }
    const body = parsed.data;
    const tenant = await requireTenantContext(request.nextUrl.searchParams.get("companyId"), {
      module: "accommodation",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    await ensureCatalogCompanyColumns();
    const [accommodation] = await db
      .insert(accommodations)
      .values({
        companyId,
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
      accommodation: mapDbAccommodationToAccommodation(accommodation),
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
    const tenant = await requireTenantContext(request.nextUrl.searchParams.get("companyId"), {
      module: "accommodation",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    const parsed = accommodationPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid accommodation update" },
        { status: 400 }
      );
    }
    const { id, ...updateData } = parsed.data;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const [updatedAccommodation] = await db
      .update(accommodations)
      .set(updateData)
      .where(and(eq(accommodations.id, id), eq(accommodations.companyId, companyId)))
      .returning();

    if (!updatedAccommodation) {
      return NextResponse.json(
        { success: false, error: "Accommodation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      accommodation: mapDbAccommodationToAccommodation(updatedAccommodation),
    });
  } catch (error) {
    console.error("Error updating accommodation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update accommodation" },
      { status: 500 }
    );
  }
}

// DELETE /api/accommodations - Delete accommodation (staff with accommodation edit)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant = await requireTenantContext(searchParams.get("companyId"), {
      module: "accommodation",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing accommodation ID" },
        { status: 400 }
      );
    }

    const accommodationId = parseInt(id, 10);
    if (Number.isNaN(accommodationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid accommodation ID" },
        { status: 400 }
      );
    }

    await db
      .delete(likes)
      .where(and(eq(likes.accommodationId, accommodationId), eq(likes.companyId, companyId)));

    const deleted = await db
      .delete(accommodations)
      .where(and(eq(accommodations.id, accommodationId), eq(accommodations.companyId, companyId)))
      .returning({ id: accommodations.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: "Accommodation not found" },
        { status: 404 }
      );
    }

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