import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteTourFromDb, getToursFromDb, updateTourPackageRates } from "@/lib/tours-db";
import { requireCompanyId } from "@/lib/tenant";
import { companyIdZod } from "@/lib/schemas/company-id";
import { requireTenantContext } from "@/server/tenancy";

/** Empty string or null clears an optional age rate (engine defaults apply). Do not coerce "" — that becomes 0. */
const optionalUsdRate = z
  .union([z.number().int().min(0).max(1_000_000), z.string(), z.null()])
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    const n = typeof value === "number" ? value : Number(String(value).trim());
    if (!Number.isInteger(n) || n < 0 || n > 1_000_000) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "USD rate must be a whole number from 0 to 1,000,000" });
      return z.NEVER;
    }
    return n;
  });

const patchSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    companyId: companyIdZod,
    price: z.coerce.number().int().min(0).max(1_000_000).optional(),
    childPrice: optionalUsdRate,
    infantPrice: optionalUsdRate,
  })
  .refine(
    (data) =>
      data.price !== undefined || data.childPrice !== undefined || data.infantPrice !== undefined,
    { message: "Provide at least one rate to update" }
  );

export async function GET(request: NextRequest) {
  try {
    const company = requireCompanyId(request.nextUrl.searchParams.get("companyId"));
    if (!company.ok) return company.response;
    const tours = await getToursFromDb(company.companyId);
    return NextResponse.json(tours, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Error fetching tours:", error);
    return NextResponse.json(
      { error: "Failed to fetch tours" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const message =
        Object.values(flat.fieldErrors).flat()[0] ?? flat.formErrors[0] ?? "Invalid tour rates";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const tenant = await requireTenantContext(parsed.data.companyId, {
      module: ["tours", "bookings"],
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;

    const tour = await updateTourPackageRates(tenant.ctx.companyId, parsed.data.id, {
      price: parsed.data.price,
      childPrice: parsed.data.childPrice,
      infantPrice: parsed.data.infantPrice,
    });
    if (!tour) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, tour });
  } catch (error) {
    console.error("Error updating tour rates:", error);
    return NextResponse.json({ error: "Failed to update tour rates" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idRaw = searchParams.get("id");
    const id = idRaw ? Number(idRaw) : NaN;
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "id and valid companyId required" }, { status: 400 });
    }
    const tenant = await requireTenantContext(searchParams.get("companyId"), {
      module: ["tours", "bookings"],
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;

    const deleted = await deleteTourFromDb(tenant.ctx.companyId, id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tour:", error);
    return NextResponse.json({ error: "Failed to delete tour" }, { status: 500 });
  }
}
