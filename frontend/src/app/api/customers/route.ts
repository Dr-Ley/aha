import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { customers } from "@/lib/schema";
import { requireTenantContext } from "@/server/tenancy";
import { emailSchema } from "@/lib/schemas/public";
import {
  createCustomerFromStaff,
  ensureCustomersReady,
  findOrCreateCustomerFromGuest,
  listCustomersForCompany,
  suggestCustomersForGuest,
} from "@/lib/customers";

const patchSchema = z.object({
  id: z.coerce.number().int().positive(),
  companyId: z.string().min(1).max(32),
  notes: z.string().max(8000).optional().nullable(),
  preferences: z.string().max(2000).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().max(100).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
});

const createSchema = z.object({
  companyId: z.string().min(1).max(32),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional().nullable(),
  email: z.union([emailSchema, z.literal("")]).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  notes: z.string().max(8000).optional().nullable(),
  preferences: z.string().max(2000).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const tenant = await requireTenantContext(request.nextUrl.searchParams.get("companyId"), {
      module: ["bookings", "tours", "accommodation"],
      requireEdit: false,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    await ensureCustomersReady();
    const idRaw = request.nextUrl.searchParams.get("id");
    if (idRaw) {
      const id = parseInt(idRaw, 10);
      if (Number.isNaN(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      }
      const [row] = await db
        .select()
        .from(customers)
        .where(and(eq(customers.id, id), eq(customers.companyId, companyId)))
        .limit(1);
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ success: true, customer: row });
    }

    const rows = await listCustomersForCompany(
      companyId,
      request.nextUrl.searchParams.get("q") ?? undefined
    );
    const matchName = request.nextUrl.searchParams.get("matchName");
    const matchEmail = request.nextUrl.searchParams.get("matchEmail");
    const matchPhone = request.nextUrl.searchParams.get("matchPhone");
    if (matchName || matchEmail || matchPhone) {
      const suggestions = await suggestCustomersForGuest(companyId, {
        fullName: matchName ?? "",
        email: matchEmail,
        phone: matchPhone,
      });
      return NextResponse.json({ success: true, customers: rows, suggestions });
    }
    return NextResponse.json({ success: true, customers: rows });
  } catch (e) {
    console.error("customers GET", e);
    return NextResponse.json({ error: "Failed to load customers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const tenant = await requireTenantContext(parsed.data.companyId, {
      module: ["bookings", "tours", "accommodation"],
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    const id = parsed.data.email
      ? await findOrCreateCustomerFromGuest(companyId, {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          country: parsed.data.country ?? parsed.data.nationality,
        })
      : await createCustomerFromStaff(companyId, {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          country: parsed.data.country ?? parsed.data.nationality,
        });
    if (id == null) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (parsed.data.notes != null || parsed.data.preferences != null) {
      await db
        .update(customers)
        .set({
          notes: parsed.data.notes ?? undefined,
          preferences: parsed.data.preferences ?? undefined,
          nationality: parsed.data.nationality ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, id));
    }
    const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return NextResponse.json({ success: true, customer: row });
  } catch (e) {
    console.error("customers POST", e);
    return NextResponse.json({ error: "Failed to save customer" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const tenant = await requireTenantContext(parsed.data.companyId, {
      module: ["bookings", "tours", "accommodation"],
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    await ensureCustomersReady();
    const { id } = parsed.data;
    const [updated] = await db
      .update(customers)
      .set({
        ...(parsed.data.firstName !== undefined ? { firstName: parsed.data.firstName } : {}),
        ...(parsed.data.lastName !== undefined ? { lastName: parsed.data.lastName } : {}),
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
        ...(parsed.data.nationality !== undefined ? { nationality: parsed.data.nationality } : {}),
        ...(parsed.data.country !== undefined ? { country: parsed.data.country } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
        ...(parsed.data.preferences !== undefined ? { preferences: parsed.data.preferences } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, id), eq(customers.companyId, companyId)))
      .returning();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, customer: updated });
  } catch (e) {
    console.error("customers PATCH", e);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
