import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments } from "@/lib/schema";
import { createNotification } from "@/lib/notify";
import {
  DuplicateIdempotencyError,
  PaymentService,
} from "@/server/services/payments";
import { requireTenantContext } from "@/server/tenancy";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod, financialReferenceTypeZod } from "@/lib/schemas/company-id";

const paymentRecordStatusZod = z.enum(["pending", "completed", "cancelled"]);
const paymentProviderZod = z.enum(["manual", "cash", "bank", "card", "m-pesa"]);

function paymentUpdateTitle(id: number, updates: Record<string, unknown>, status?: string): string {
  if (updates.status !== undefined) return `Payment #${id} status changed to ${status ?? updates.status}`;
  if (updates.amount !== undefined) return `Payment #${id} amount changed`;
  if (updates.method !== undefined) return `Payment #${id} method changed`;
  if (updates.bookingId !== undefined || updates.referenceType !== undefined || updates.referenceId !== undefined) {
    return `Payment #${id} link changed`;
  }
  if (updates.notes !== undefined) return `Payment #${id} notes changed`;
  if (updates.recordedAt !== undefined) return `Payment #${id} date changed`;
  return `Payment #${id} details changed`;
}

function parsePaymentDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00+03:00`);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

const createSchema = z.object({
  companyId: companyIdZod,
  amount: z.coerce.number().int().positive(),
  bookingId: z.coerce.number().int().optional().nullable(),
  referenceType: financialReferenceTypeZod.optional().nullable(),
  referenceId: z.coerce.number().int().optional().nullable(),
  currency: z.string().max(10).default("KES"),
  method: z.string().max(64).optional().nullable(),
  provider: paymentProviderZod.optional().nullable(),
  status: paymentRecordStatusZod.default("pending"),
  notes: z.string().optional().nullable(),
  recordedAt: z.string().optional().nullable(),
  idempotencyKey: z.string().max(128).optional().nullable(),
});

const patchSchema = z.object({
  id: z.coerce.number().int(),
  companyId: companyIdZod,
  amount: z.coerce.number().int().positive().optional(),
  currency: z.string().max(10).optional(),
  method: z.string().max(64).optional().nullable(),
  provider: paymentProviderZod.optional().nullable(),
  status: paymentRecordStatusZod.optional(),
  notes: z.string().optional().nullable(),
  recordedAt: z.string().optional().nullable(),
  bookingId: z.coerce.number().int().optional().nullable(),
  referenceType: financialReferenceTypeZod.optional().nullable(),
  referenceId: z.coerce.number().int().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant = await requireTenantContext(searchParams.get("companyId"), {
      module: "payments",
      requireEdit: false,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

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
    const json = await request.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = parsed.data;
    const tenant = await requireTenantContext(d.companyId, {
      module: "payments",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    let row;
    try {
      row = await PaymentService.recordPayment({
        companyId,
        amount: d.amount,
        bookingId: d.bookingId ?? null,
        referenceType: d.referenceType ?? null,
        referenceId: d.referenceId ?? null,
        currency: d.currency,
        method: d.method ?? null,
        provider: d.provider ?? null,
        status: d.status,
        notes: d.notes ?? null,
        recordedAt: parsePaymentDate(d.recordedAt) ?? null,
        idempotencyKey: d.idempotencyKey ?? null,
      });
    } catch (e) {
      if (e instanceof DuplicateIdempotencyError) {
        return NextResponse.json(
          { error: "Duplicate payment idempotency key", existingPaymentId: e.existingPaymentId },
          { status: 409 }
        );
      }
      console.error("PaymentService.recordPayment:", e);
      return NextResponse.json(
        { error: "Failed to create payment and sync revenue" },
        { status: 500 }
      );
    }

    await createNotification({
      companyId,
      type: "payment",
      action: "created",
      referenceId: row.id,
      title: `Payment #${row.id} — ${row.currency} ${row.amount}`,
      metadata: { method: row.method, status: row.status, bookingId: row.bookingId },
    });

    return NextResponse.json({ success: true, payment: row });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
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
      module: "payments",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const { id, ...rest } = d;

    const touched: Record<string, unknown> = {};
    if (rest.amount !== undefined) touched.amount = rest.amount;
    if (rest.currency !== undefined) touched.currency = rest.currency;
    if (rest.method !== undefined) touched.method = rest.method;
    if (rest.status !== undefined) touched.status = rest.status;
    if (rest.notes !== undefined) touched.notes = rest.notes;
    if (rest.recordedAt !== undefined) touched.recordedAt = rest.recordedAt;
    if (rest.bookingId !== undefined) touched.bookingId = rest.bookingId;
    if (rest.referenceType !== undefined) touched.referenceType = rest.referenceType;
    if (rest.referenceId !== undefined) touched.referenceId = rest.referenceId;
    if (rest.provider !== undefined) touched.provider = rest.provider;

    if (Object.keys(touched).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    let row;
    try {
      row = await PaymentService.updatePayment({
        id,
        companyId,
        amount: rest.amount,
        currency: rest.currency,
        method: rest.method,
        provider: rest.provider,
        status: rest.status,
        notes: rest.notes,
        recordedAt: rest.recordedAt !== undefined ? parsePaymentDate(rest.recordedAt) ?? null : undefined,
        bookingId: rest.bookingId,
        referenceType: rest.referenceType,
        referenceId: rest.referenceId,
      });
    } catch (e) {
      console.error("PaymentService.updatePayment:", e);
      return NextResponse.json(
        { error: "Failed to update payment and sync revenue" },
        { status: 500 }
      );
    }

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await createNotification({
      companyId,
      type: "payment",
      action: "updated",
      referenceId: row.id,
      title: paymentUpdateTitle(row.id, touched, row.status),
      metadata: { amount: row.amount, status: row.status },
    });

    return NextResponse.json({ success: true, payment: row });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const tenant = await requireTenantContext(searchParams.get("companyId"), {
      module: "payments",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const pid = parseInt(id, 10);

    let deleted;
    try {
      deleted = await PaymentService.deletePayment(companyId, pid);
    } catch (e) {
      console.error("PaymentService.deletePayment:", e);
      return NextResponse.json(
        { error: "Failed to delete payment and related revenue" },
        { status: 500 }
      );
    }

    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

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
