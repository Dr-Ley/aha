import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { barCategories, barItems } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { checkApiPermission, canAccessDashboardFromSession } from "@/lib/permissions-server";
import { and, desc, eq, sql } from "drizzle-orm";
import { isValidCompanyId, resolveCompanyId } from "@/lib/tenant";
import { z } from "zod";
import { companyIdZod } from "@/lib/schemas/company-id";

function getUserId(session: { user?: { id?: string | null } } | null): number | null {
  if (!session?.user?.id) return null;
  return typeof session.user.id === "string" ? parseInt(session.user.id, 10) : session.user.id;
}

const postSchema = z.object({
  companyId: companyIdZod,
  categoryId: z.coerce.number().int().positive().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  price: z.coerce.number().int().min(0),
  isAvailable: z.boolean().optional(),
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
    const list = await db
      .select({
        item: barItems,
        categoryName: barCategories.name,
      })
      .from(barItems)
      .leftJoin(barCategories, eq(barItems.categoryId, barCategories.id))
      .where(eq(barItems.companyId, companyId))
      .orderBy(desc(barItems.createdAt));
    return NextResponse.json({
      success: true,
      items: list.map((r) => ({ ...r.item, categoryName: r.categoryName })),
    });
  } catch (e) {
    console.error("bar-items GET", e);
    return NextResponse.json({ error: "Failed to list bar items" }, { status: 500 });
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
    const normalizedName = d.name.trim().toLowerCase();
    const [existing] = await db
      .select({
        item: barItems,
        categoryName: barCategories.name,
      })
      .from(barItems)
      .leftJoin(barCategories, eq(barItems.categoryId, barCategories.id))
      .where(and(eq(barItems.companyId, d.companyId), sql`lower(${barItems.name}) = ${normalizedName}`))
      .limit(1);
    if (existing) {
      return NextResponse.json({
        success: true,
        item: { ...existing.item, categoryName: existing.categoryName },
        existing: true,
      });
    }

    let categoryId = d.categoryId;
    if (!categoryId) {
      const [defaultCat] = await db
        .select()
        .from(barCategories)
        .where(and(eq(barCategories.companyId, d.companyId), sql`lower(${barCategories.name}) = ${"uncategorized"}`))
        .limit(1);
      if (defaultCat) {
        categoryId = defaultCat.id;
      } else {
        const [createdCat] = await db
          .insert(barCategories)
          .values({ companyId: d.companyId, name: "Uncategorized", sortOrder: 999 })
          .returning();
        categoryId = createdCat.id;
      }
    }

    const [cat] = await db
      .select()
      .from(barCategories)
      .where(and(eq(barCategories.id, categoryId), eq(barCategories.companyId, d.companyId)))
      .limit(1);
    if (!cat) {
      return NextResponse.json({ error: "Category not found for this company" }, { status: 400 });
    }
    const [row] = await db
      .insert(barItems)
      .values({
        companyId: d.companyId,
        categoryId,
        name: d.name.trim(),
        description: d.description ?? null,
        price: d.price,
        isAvailable: d.isAvailable ?? true,
      })
      .returning();
    return NextResponse.json({ success: true, item: { ...row, categoryName: cat.name } });
  } catch (e) {
    console.error("bar-items POST", e);
    return NextResponse.json({ error: "Failed to create bar item" }, { status: 500 });
  }
}
