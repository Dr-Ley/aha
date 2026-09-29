import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { restaurantCategories, restaurantItems } from "@/lib/schema";
import { requireTenantContext } from "@/server/tenancy";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod } from "@/lib/schemas/company-id";

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
    const tenant = await requireTenantContext(request.nextUrl.searchParams.get("companyId"), {
      module: "restaurant",
      requireEdit: false,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const list = await db
      .select({
        item: restaurantItems,
        categoryName: restaurantCategories.name,
      })
      .from(restaurantItems)
      .leftJoin(restaurantCategories, eq(restaurantItems.categoryId, restaurantCategories.id))
      .where(eq(restaurantItems.companyId, companyId))
      .orderBy(desc(restaurantItems.createdAt));
    return NextResponse.json({
      success: true,
      items: list.map((r) => ({ ...r.item, categoryName: r.categoryName })),
    });
  } catch (e) {
    console.error("restaurant-items GET", e);
    return NextResponse.json({ error: "Failed to list items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = postSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });
    }
    const tenant = await requireTenantContext(body.data.companyId, {
      module: "restaurant",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const d = body.data;
    const normalizedName = d.name.trim().toLowerCase();
    const [existing] = await db
      .select({
        item: restaurantItems,
        categoryName: restaurantCategories.name,
      })
      .from(restaurantItems)
      .leftJoin(restaurantCategories, eq(restaurantItems.categoryId, restaurantCategories.id))
      .where(
        and(eq(restaurantItems.companyId, companyId), sql`lower(${restaurantItems.name}) = ${normalizedName}`)
      )
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
        .from(restaurantCategories)
        .where(
          and(eq(restaurantCategories.companyId, companyId), sql`lower(${restaurantCategories.name}) = ${"uncategorized"}`)
        )
        .limit(1);
      if (defaultCat) {
        categoryId = defaultCat.id;
      } else {
        const [createdCat] = await db
          .insert(restaurantCategories)
          .values({ companyId, name: "Uncategorized", sortOrder: 999 })
          .returning();
        categoryId = createdCat.id;
      }
    }

    const [cat] = await db
      .select()
      .from(restaurantCategories)
      .where(
        and(eq(restaurantCategories.id, categoryId), eq(restaurantCategories.companyId, companyId))
      )
      .limit(1);
    if (!cat) {
      return NextResponse.json({ error: "Category not found for this company" }, { status: 400 });
    }
    const [row] = await db
      .insert(restaurantItems)
      .values({
        companyId,
        categoryId,
        name: d.name.trim(),
        description: d.description ?? null,
        price: d.price,
        isAvailable: d.isAvailable ?? true,
      })
      .returning();
    return NextResponse.json({ success: true, item: { ...row, categoryName: cat.name } });
  } catch (e) {
    console.error("restaurant-items POST", e);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
