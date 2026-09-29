import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext } from "@/server/tenancy";
import { ensureInvoiceForSource, getInvoiceById, type InvoiceSourceType } from "@/lib/invoice-service";
import { z } from "zod";
import { companyIdZod } from "@/lib/schemas/company-id";

function moduleForSource(referenceType: InvoiceSourceType): "bookings" | "accommodation" {
  return referenceType === "hotel" ? "accommodation" : "bookings";
}

const createSchema = z.object({
  companyId: companyIdZod,
  referenceType: z.enum(["tour", "hotel"]),
  referenceId: z.coerce.number().int().positive(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }
    const tenant = await requireTenantContext(searchParams.get("companyId"), {
      module: ["bookings", "accommodation"],
      requireEdit: false,
    });
    if (!tenant.ok) return tenant.response;
    const invoice = await getInvoiceById(tenant.ctx.companyId, id);
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const specific = await requireTenantContext(tenant.ctx.companyId, {
      module: moduleForSource(invoice.referenceType === "hotel" ? "hotel" : "tour"),
      requireEdit: false,
    });
    if (!specific.ok) return specific.response;
    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("GET /api/invoices:", error);
    return NextResponse.json({ error: "Failed to load invoice" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { referenceType, referenceId } = parsed.data;
    const tenant = await requireTenantContext(parsed.data.companyId, {
      module: moduleForSource(referenceType),
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const invoice = await ensureInvoiceForSource(companyId, referenceType, referenceId);
    if (!invoice) {
      return NextResponse.json({ error: "Source booking not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("POST /api/invoices:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
