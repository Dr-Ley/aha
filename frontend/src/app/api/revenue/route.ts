import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revenueEntries } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { canAccessDashboardFromSession } from "@/lib/permissions-server";
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
    const session = await auth();
    if (!getUserId(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = resolveCompanyId(searchParams.get("companyId"));

    const rows = await db
      .select()
      .from(revenueEntries)
      .where(eq(revenueEntries.companyId, companyId))
      .orderBy(desc(revenueEntries.recognizedAt));

    return NextResponse.json({ success: true, revenue: rows });
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
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
    const session = await auth();
    if (!getUserId(session) || !await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const json = await request.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
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
