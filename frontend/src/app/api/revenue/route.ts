import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revenueEntries } from "@/lib/schema";
import { moduleForRevenue } from "@/lib/dashboard-modules";
import { requireTenantContext } from "@/server/tenancy";
import { and, count, desc, eq, isNotNull, isNull, or, sum } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod, financialReferenceTypeZod } from "@/lib/schemas/company-id";
import { readListPage } from "@/lib/list-page";

const createSchema = z.object({
  companyId: companyIdZod,
  amount: z.coerce.number().int().positive(),
  packageLabel: z.string().max(255).optional().nullable(),
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/),
  bookingId: z.coerce.number().int().optional().nullable(),
  referenceType: financialReferenceTypeZod.optional().nullable(),
  referenceId: z.coerce.number().int().optional().nullable(),
  recognizedAt: z.string().optional(),
});

const patchSchema = z.object({
  id: z.coerce.number().int(),
  companyId: companyIdZod,
  amount: z.coerce.number().int().positive().optional(),
  packageLabel: z.string().max(255).optional().nullable(),
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  bookingId: z.coerce.number().int().optional().nullable(),
  referenceType: financialReferenceTypeZod.optional().nullable(),
  referenceId: z.coerce.number().int().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant = await requireTenantContext(searchParams.get("companyId"), {
      module: moduleForRevenue(),
      requireEdit: false,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const parsedPage = readListPage(searchParams);
    if (!parsedPage.ok) return NextResponse.json({ error: parsedPage.error }, { status: 400 });
    const month = searchParams.get("month")?.trim() || "";
    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });
    }
    const linked = searchParams.get("linked")?.trim() || "";
    if (linked && linked !== "linked" && linked !== "none") {
      return NextResponse.json({ error: "linked must be linked or none" }, { status: 400 });
    }

    const filters = [eq(revenueEntries.companyId, companyId)];
    if (month) filters.push(eq(revenueEntries.periodMonth, month));
    if (linked === "linked") {
      filters.push(
        or(isNotNull(revenueEntries.bookingId), and(isNotNull(revenueEntries.referenceType), isNotNull(revenueEntries.referenceId)))!
      );
    } else if (linked === "none") {
      filters.push(isNull(revenueEntries.bookingId));
      filters.push(or(isNull(revenueEntries.referenceType), isNull(revenueEntries.referenceId))!);
    }
    const where = and(...filters);
    const ordered = db
      .select()
      .from(revenueEntries)
      .where(where)
      .orderBy(desc(revenueEntries.recognizedAt), desc(revenueEntries.id));

    if (!parsedPage.page) {
      const rows = await ordered;
      return NextResponse.json({ success: true, revenue: rows });
    }

    const { page, pageSize } = parsedPage.page;
    const [rows, totals, series] = await Promise.all([
      ordered.limit(pageSize).offset((page - 1) * pageSize),
      db.select({ total: count(), amount: sum(revenueEntries.amount) }).from(revenueEntries).where(where),
      db
        .select({
          amount: revenueEntries.amount,
          packageLabel: revenueEntries.packageLabel,
          periodMonth: revenueEntries.periodMonth,
          recognizedAt: revenueEntries.recognizedAt,
        })
        .from(revenueEntries)
        .where(eq(revenueEntries.companyId, companyId)),
    ]);
    const total = Number(totals[0]?.total ?? 0);
    return NextResponse.json({
      success: true,
      revenue: rows,
      series,
      summary: {
        total: Number(totals[0]?.amount ?? 0),
        count: total,
        average: total === 0 ? 0 : Math.round(Number(totals[0]?.amount ?? 0) / total),
      },
      page,
      pageSize,
      total,
    });
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const tenant = await requireTenantContext(parsed.data.companyId, {
      module: moduleForRevenue(),
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    return NextResponse.json(
      { error: "Revenue entries are created automatically when a payment is marked completed." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating revenue entry:", error);
    return NextResponse.json({ error: "Failed to create revenue entry" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const tenant = await requireTenantContext(parsed.data.companyId, {
      module: moduleForRevenue(),
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    return NextResponse.json(
      { error: "Revenue entries are updated automatically from completed payment entries." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating revenue entry:", error);
    return NextResponse.json({ error: "Failed to update revenue entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id and valid companyId required" }, { status: 400 });
    }
    const tenant = await requireTenantContext(searchParams.get("companyId"), {
      module: moduleForRevenue(),
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    const deleted = await db
      .delete(revenueEntries)
      .where(and(eq(revenueEntries.id, parseInt(id, 10)), eq(revenueEntries.companyId, companyId)))
      .returning({ id: revenueEntries.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting revenue entry:", error);
    return NextResponse.json({ error: "Failed to delete revenue entry" }, { status: 500 });
  }
}
