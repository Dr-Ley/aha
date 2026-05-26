import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roomTypes } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { checkApiPermission, canAccessDashboardFromSession } from "@/lib/permissions-server";
import { isValidCompanyId, resolveCompanyId } from "@/lib/tenant";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod } from "@/lib/schemas/company-id";

function getUserId(session: { user?: { id?: string | null } } | null): number | null {
  if (!session?.user?.id) return null;
  return typeof session.user.id === "string" ? parseInt(session.user.id, 10) : session.user.id;
}

const postSchema = z.object({
  companyId: companyIdZod,
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  maxOccupancy: z.coerce.number().int().min(1).max(32).default(2),
  baseRate: z.coerce.number().int().min(0).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!getUserId(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const companyId = resolveCompanyId(new URL(request.url).searchParams.get("companyId"));
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
    const session = await auth();
    if (!getUserId(session) || !await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = postSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = body.data;
    if (!isValidCompanyId(d.companyId)) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 });
    }
    const [row] = await db
      .insert(roomTypes)
      .values({
        companyId: d.companyId,
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
