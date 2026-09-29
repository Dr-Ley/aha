import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { barCategories } from "@/lib/schema";
import { requireTenantContext } from "@/server/tenancy";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod } from "@/lib/schemas/company-id";

const postSchema = z.object({
  companyId: companyIdZod,
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenant = await requireTenantContext(request.nextUrl.searchParams.get("companyId"), {
      module: "bar",
      requireEdit: false,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const rows = await db
      .select()
      .from(barCategories)
      .where(eq(barCategories.companyId, companyId))
      .orderBy(asc(barCategories.sortOrder), asc(barCategories.name));
    return NextResponse.json({ success: true, categories: rows });
  } catch (e) {
    console.error("bar-categories GET", e);
    return NextResponse.json({ error: "Failed to list categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = postSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });
    }
    const tenant = await requireTenantContext(body.data.companyId, {
      module: "bar",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const d = body.data;
    const [row] = await db
      .insert(barCategories)
      .values({
        companyId,
        name: d.name,
        description: d.description ?? null,
        sortOrder: d.sortOrder ?? 0,
      })
      .returning();
    return NextResponse.json({ success: true, category: row });
  } catch (e) {
    console.error("bar-categories POST", e);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
