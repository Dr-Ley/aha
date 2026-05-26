import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { checkApiPermission, canAccessDashboardFromSession } from "@/lib/permissions-server";
import { createNotification } from "@/lib/notify";
import { deleteRevenueForPayment, syncRevenueFromPayment } from "@/lib/sync-payment-revenue";
import { isValidCompanyId, resolveCompanyId } from "@/lib/tenant";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod, financialReferenceTypeZod } from "@/lib/schemas/company-id";

const paymentRecordStatusZod = z.enum(["pending", "completed", "cancelled"]);

function paymentUpdateTitle(id: number, updates: Record<string, unknown>, status?: string): string {
  if (updates.status !== undefined) return `Payment #${id} status changed to ${status ?? updates.status}`;
  if (updates.amount !== undefined) return `Payment #${id} amount changed`;
  if (updates.method !== undefined) return `Payment #${id} method changed`;
  if (updates.bookingId !== undefined || updates.referenceType !== undefined || updates.referenceId !== undefined) {
    return `Payment #${id} link changed`;
  }
  if (updates.notes !== undefined) return `Payment #${id} notes changed`;
  return `Payment #${id} details changed`;
}

function getUserId(session: { user?: { id?: string | null } } | null): number | null {
  if (!session?.user?.id) return null;
  return typeof session.user.id === "string" ? parseInt(session.user.id, 10) : session.user.id;
}

const createSchema = z.object({
  companyId: companyIdZod,
  amount: z.coerce.number().int().positive(),
  bookingId: z.coerce.number().int().optional().nullable(),
  referenceType: financialReferenceTypeZod.optional().nullable(),
  referenceId: z.coerce.number().int().optional().nullable(),
  currency: z.string().max(10).default("KES"),
  method: z.string().max(64).optional().nullable(),
  status: paymentRecordStatusZod.default("pending"),
  notes: z.string().optional().nullable(),
});

const patchSchema = z.object({
  id: z.coerce.number().int(),
  companyId: companyIdZod,
  amount: z.coerce.number().int().positive().optional(),
  currency: z.string().max(10).optional(),
  method: z.string().max(64).optional().nullable(),
  status: paymentRecordStatusZod.optional(),
  notes: z.string().optional().nullable(),
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

    const viewDenied = await checkApiPermission(session, companyId, "payments", false);
    if (viewDenied) return viewDenied;

    const rows = await db
      .select()
      .from(payments)
      .where(eq(payments.companyId, companyId))
      .orderBy(desc(payments.recordedAt));

    return NextResponse.json({ success: true, payments: rows });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
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
    if (!isValidCompanyId(companyId)) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 });
    }

    const postDenied = await checkApiPermission(session, companyId, "payments", true);
    if (postDenied) return postDenied;

    const [row] = await db
      .insert(payments)
      .values({
        companyId,
        amount: d.amount,
        bookingId: d.bookingId ?? null,
        referenceType: d.referenceType ?? null,
        referenceId: d.referenceId ?? null,
        currency: d.currency,
        method: d.method ?? null,
        status: d.status,
        notes: d.notes ?? null,
      })
      .returning();

    await createNotification({
      companyId,
      type: "payment",
      action: "created",
      referenceId: row.id,
      title: `Payment #${row.id} — ${row.currency} ${row.amount}`,
      metadata: { method: row.method, status: row.status, bookingId: row.bookingId },
    });

    try {
      await syncRevenueFromPayment({
        id: row.id,
        companyId: row.companyId,
        amount: row.amount,
        bookingId: row.bookingId,
        referenceType: row.referenceType,
        referenceId: row.referenceId,
        status: row.status,
        currency: row.currency,
        recordedAt: row.recordedAt,
      });
    } catch (e) {
      console.error("syncRevenueFromPayment (create):", e);
    }

    return NextResponse.json({ success: true, payment: row });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
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
    const patchDenied = await checkApiPermission(session, companyId, "payments", true);
    if (patchDenied) return patchDenied;
    const updates: Record<string, unknown> = {};
    if (rest.amount !== undefined) updates.amount = rest.amount;
    if (rest.currency !== undefined) updates.currency = rest.currency;
    if (rest.method !== undefined) updates.method = rest.method;
    if (rest.status !== undefined) updates.status = rest.status;
    if (rest.notes !== undefined) updates.notes = rest.notes;
    if (rest.bookingId !== undefined) updates.bookingId = rest.bookingId;
    if (rest.referenceType !== undefined) updates.referenceType = rest.referenceType;
    if (rest.referenceId !== undefined) updates.referenceId = rest.referenceId;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [row] = await db
      .update(payments)
      .set(updates as Record<string, unknown>)
      .where(and(eq(payments.id, id), eq(payments.companyId, companyId)))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await createNotification({
      companyId,
      type: "payment",
      action: "updated",
      referenceId: row.id,
      title: paymentUpdateTitle(row.id, updates, row.status),
      metadata: { amount: row.amount, status: row.status },
    });
    try {
      await syncRevenueFromPayment({
        id: row.id,
        companyId: row.companyId,
        amount: row.amount,
        bookingId: row.bookingId,
        referenceType: row.referenceType,
        referenceId: row.referenceId,
        status: row.status,
        currency: row.currency,
        recordedAt: row.recordedAt,
      });
    } catch (e) {
      console.error("syncRevenueFromPayment (patch):", e);
    }
    return NextResponse.json({ success: true, payment: row });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
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

    const delDenied = await checkApiPermission(session, companyId, "payments", true);
    if (delDenied) return delDenied;
    const pid = parseInt(id, 10);

    const deleted = await db
      .delete(payments)
      .where(and(eq(payments.id, pid), eq(payments.companyId, companyId)))
      .returning({ id: payments.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await deleteRevenueForPayment(companyId, pid);
    await createNotification({
      companyId,
      type: "payment",
      action: "deleted",
      referenceId: pid,
      title: `Payment #${pid} deleted`,
      metadata: {},
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
