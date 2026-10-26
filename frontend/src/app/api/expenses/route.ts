import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenses } from "@/lib/schema";
import { createNotification } from "@/lib/notify";
import { requireTenantContext } from "@/server/tenancy";
import { and, asc, count, desc, eq, gte, isNotNull, isNull, lt, or, sum } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod, financialReferenceTypeZod } from "@/lib/schemas/company-id";
import { readListPage, readYmdParam } from "@/lib/list-page";
import { utcDayRange } from "@/lib/nairobi-date";

const createSchema = z.object({
  companyId: companyIdZod,
  category: z.string().min(1).max(100),
  amount: z.coerce.number().int().positive(),
  description: z.string().optional().nullable(),
  bookingId: z.coerce.number().int().optional().nullable(),
  referenceType: financialReferenceTypeZod.optional().nullable(),
  referenceId: z.coerce.number().int().optional().nullable(),
  incurredAt: z.string().optional(),
});

const patchSchema = z.object({
  id: z.coerce.number().int(),
  companyId: companyIdZod,
  category: z.string().max(100).optional(),
  amount: z.coerce.number().int().positive().optional(),
  description: z.string().optional().nullable(),
  bookingId: z.coerce.number().int().optional().nullable(),
  referenceType: financialReferenceTypeZod.optional().nullable(),
  referenceId: z.coerce.number().int().optional().nullable(),
  incurredAt: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant = await requireTenantContext(searchParams.get("companyId"), {
      module: "expenses",
      requireEdit: false,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const parsedPage = readListPage(searchParams);
    if (!parsedPage.ok) return NextResponse.json({ error: parsedPage.error }, { status: 400 });
    const from = readYmdParam(searchParams.get("from"));
    const to = readYmdParam(searchParams.get("to"));
    if (from === "invalid" || to === "invalid") {
      return NextResponse.json({ error: "from and to must be YYYY-MM-DD" }, { status: 400 });
    }
    const category = searchParams.get("category")?.trim() || "";
    const reference = searchParams.get("reference")?.trim() || "";
    const sort = searchParams.get("sort") === "amount" || searchParams.get("sort") === "category" ? searchParams.get("sort")! : "date";
    const direction = searchParams.get("dir") === "asc" ? asc : desc;
    const searchDeferred = Boolean(searchParams.get("q")?.trim());

    const filters = [eq(expenses.companyId, companyId)];
    if (category) filters.push(eq(expenses.category, category));
    if (from || to) {
      const range = utcDayRange(from ?? "0001-01-01", to ?? "9999-12-31");
      filters.push(gte(expenses.incurredAt, range.from));
      filters.push(lt(expenses.incurredAt, range.to));
    }
    if (reference === "none") {
      filters.push(isNull(expenses.referenceType));
      filters.push(isNull(expenses.bookingId));
    } else if (reference === "tour") {
      filters.push(or(eq(expenses.referenceType, "tour"), and(isNull(expenses.referenceType), isNotNull(expenses.bookingId)))!);
    } else if (reference === "hotel" || reference === "bar" || reference === "restaurant" || reference === "payment") {
      filters.push(eq(expenses.referenceType, reference));
    } else if (reference) {
      return NextResponse.json({ error: "Unknown expense reference filter" }, { status: 400 });
    }
    const where = and(...filters);
    const sortColumn = sort === "amount" ? expenses.amount : sort === "category" ? expenses.category : expenses.incurredAt;
    const ordered = db
      .select()
      .from(expenses)
      .where(where)
      .orderBy(direction(sortColumn), desc(expenses.id));

    if (!parsedPage.page) {
      const rows = await ordered;
      return NextResponse.json({ success: true, expenses: rows });
    }

    const series = await db
      .select({
        incurredAt: expenses.incurredAt,
        amount: expenses.amount,
        category: expenses.category,
        referenceType: expenses.referenceType,
        referenceId: expenses.referenceId,
        bookingId: expenses.bookingId,
      })
      .from(expenses)
      .where(eq(expenses.companyId, companyId));
    const [totals] = await db.select({ total: count(), amount: sum(expenses.amount) }).from(expenses).where(where);
    const total = Number(totals?.total ?? 0);
    const summary = {
      total: Number(totals?.amount ?? 0),
      count: total,
      average: total === 0 ? 0 : Math.round(Number(totals?.amount ?? 0) / total),
    };

    if (searchDeferred) {
      const rows = await ordered;
      return NextResponse.json({
        success: true,
        expenses: rows,
        series,
        summary,
        page: 1,
        pageSize: rows.length,
        total,
        searchDeferred: true,
      });
    }

    const { page, pageSize } = parsedPage.page;
    const rows = await ordered.limit(pageSize).offset((page - 1) * pageSize);
    return NextResponse.json({ success: true, expenses: rows, series, summary, page, pageSize, total });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = parsed.data;
    const tenant = await requireTenantContext(d.companyId, {
      module: "expenses",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    const [row] = await db
      .insert(expenses)
      .values({
        companyId,
        category: d.category,
        amount: d.amount,
        description: d.description ?? null,
        bookingId: d.bookingId ?? null,
        referenceType: d.referenceType ?? null,
        referenceId: d.referenceId ?? null,
        incurredAt: d.incurredAt ? new Date(d.incurredAt) : undefined,
      })
      .returning();

    await createNotification({
      companyId,
      type: "expense",
      action: "created",
      referenceId: row.id,
      title: `Expense: ${row.category} — ${row.amount}`,
      metadata: { category: row.category, amount: row.amount },
    });

    return NextResponse.json({ success: true, expense: row });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = parsed.data;
    const tenant = await requireTenantContext(d.companyId, {
      module: "expenses",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const { id, ...rest } = d;
    const updates: Record<string, unknown> = {};
    if (rest.category !== undefined) updates.category = rest.category;
    if (rest.amount !== undefined) updates.amount = rest.amount;
    if (rest.description !== undefined) updates.description = rest.description;
    if (rest.bookingId !== undefined) updates.bookingId = rest.bookingId;
    if (rest.referenceType !== undefined) updates.referenceType = rest.referenceType;
    if (rest.referenceId !== undefined) updates.referenceId = rest.referenceId;
    if (rest.incurredAt !== undefined) {
      updates.incurredAt = rest.incurredAt ? new Date(rest.incurredAt) : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [row] = await db
      .update(expenses)
      .set(updates as Record<string, unknown>)
      .where(and(eq(expenses.id, id), eq(expenses.companyId, companyId)))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, expense: row });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
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
      module: "expenses",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    const deleted = await db
      .delete(expenses)
      .where(and(eq(expenses.id, parseInt(id, 10)), eq(expenses.companyId, companyId)))
      .returning({ id: expenses.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
