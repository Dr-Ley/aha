import { NextRequest, NextResponse } from "next/server";
import { requireCompanyId } from "@/lib/tenant";
import { getTestimonialsFromDb } from "@/lib/testimonials-db";
import { ensurePendingTenantColumns } from "@/lib/ensure-pending-tenant";

export async function GET(request: NextRequest) {
  try {
    const company = requireCompanyId(request.nextUrl.searchParams.get("companyId"));
    if (!company.ok) return company.response;
    await ensurePendingTenantColumns();
    const allTestimonials = await getTestimonialsFromDb(company.companyId);
    return NextResponse.json({ success: true, testimonials: allTestimonials }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}
