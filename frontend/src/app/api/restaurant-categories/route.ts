import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { restaurantCategories } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { checkApiPermission, canAccessDashboardFromSession } from "@/lib/permissions-server";
import { isValidCompanyId, resolveCompanyId } from "@/lib/tenant";
import { asc, eq } from "drizzle-orm";
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
  sortOrder: z.coerce.number().int().optional(),
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
      .from(restaurantCategories)
      .where(eq(restaurantCategories.companyId, companyId))
      .orderBy(asc(restaurantCategories.sortOrder), asc(restaurantCategories.name));
    return NextResponse.json({ success: true, categories: rows });
  } catch (e) {
    console.error("restaurant-categories GET", e);
    return NextResponse.json({ error: "Failed to list categories" }, { status: 500 });
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
      .insert(restaurantCategories)
      .values({
        companyId: d.companyId,
        name: d.name,
        description: d.description ?? null,
        sortOrder: d.sortOrder ?? 0,
      })
      .returning();
    return NextResponse.json({ success: true, category: row });
  } catch (e) {
    console.error("restaurant-categories POST", e);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
