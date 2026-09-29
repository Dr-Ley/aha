import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roomTypes } from "@/lib/schema";
import { requireTenantContext } from "@/server/tenancy";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod } from "@/lib/schemas/company-id";

const postSchema = z.object({
  companyId: companyIdZod,
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  maxOccupancy: z.coerce.number().int().min(1).max(32).default(2),
  baseRate: z.coerce.number().int().min(0).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const tenant = await requireTenantContext(request.nextUrl.searchParams.get("companyId") ?? new URL(request.url).searchParams.get("companyId"), {
      module: "accommodation",
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const rows = await db
      .select()
      .from(roomTypes)
      .where(eq(roomTypes.companyId, companyId))
      .orderBy(desc(roomTypes.createdAt));
    return NextResponse.json({ success: true, roomTypes: rows });
  } catch (e) {
    console.error("room-types GET", e);
    return NextResponse.json({ error: "Failed to list room types" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = postSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });
    }
    const tenant = await requireTenantContext(body.data.companyId, {
      module: "accommodation",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const d = body.data;
    const { getCompanyPropertyId } = await import("@/server/services/tourism");
    const propertyId = await getCompanyPropertyId(companyId);
    const [row] = await db
      .insert(roomTypes)
      .values({
        companyId,
        propertyId,
        name: d.name,
        description: d.description ?? null,
        maxOccupancy: d.maxOccupancy,
        baseRate: d.baseRate ?? null,
      })
      .returning();
    return NextResponse.json({ success: true, roomType: row });
  } catch (e) {
    console.error("room-types POST", e);
    return NextResponse.json({ error: "Failed to create room type" }, { status: 500 });
  }
}
