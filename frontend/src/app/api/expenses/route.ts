import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenses } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { checkApiPermission, canAccessDashboardFromSession } from "@/lib/permissions-server";
import { createNotification } from "@/lib/notify";
import { isValidCompanyId, resolveCompanyId } from "@/lib/tenant";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod, financialReferenceTypeZod } from "@/lib/schemas/company-id";

function getUserId(session: { user?: { id?: string | null } } | null): number | null {
  if (!session?.user?.id) return null;
  return typeof session.user.id === "string" ? parseInt(session.user.id, 10) : session.user.id;
}

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

    const { searchParams } = new URL(request.url);
    const companyId = resolveCompanyId(searchParams.get("companyId"));

    const viewDenied = await checkApiPermission(session, companyId, "expenses", false);
    if (viewDenied) return viewDenied;

    const rows = await db
      .select()
      .from(expenses)
      .where(eq(expenses.companyId, companyId))
      .orderBy(desc(expenses.incurredAt));

    return NextResponse.json({ success: true, expenses: rows });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!getUserId(session) || !await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const json = await request.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = parsed.data;
    const companyId = resolveCompanyId(d.companyId);

    const postDenied = await checkApiPermission(session, companyId, "expenses", true);
    if (postDenied) return postDenied;

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
    const session = await auth();
    if (!getUserId(session) || !await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const json = await request.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = parsed.data;
    const { id, companyId, ...rest } = d;
    const patchDenied = await checkApiPermission(session, companyId, "expenses", true);
    if (patchDenied) return patchDenied;
    const updates: Record<string, unknown> = {};
    if (rest.category !== undefined) updates.category = rest.category;
    if (rest.amount !== undefined) updates.amount = rest.amount;
    if (rest.description !== undefined) updates.description = rest.description;
    if (rest.bookingId !== undefined) updates.bookingId = rest.bookingId;
    if (rest.referenceType !== undefined) updates.referenceType = rest.referenceType;
    if (rest.referenceId !== undefined) updates.referenceId = rest.referenceId;

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
    const session = await auth();
    if (!getUserId(session) || !await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const companyId = searchParams.get("companyId");
    if (!id || !companyId || !isValidCompanyId(companyId)) {
      return NextResponse.json({ error: "id and valid companyId required" }, { status: 400 });
    }

    const delDenied = await checkApiPermission(session, companyId, "expenses", true);
    if (delDenied) return delDenied;

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
