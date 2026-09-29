import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { canAccessDashboardFromSession, getUserIdFromSession } from "@/lib/permissions-server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { companyIdZod } from "@/lib/schemas/company-id";
import { requireTenantContext } from "@/server/tenancy";
import {
  createItinerary,
  generateItinerary,
  listItinerariesForCompany,
} from "@/server/services/itinerary";
import { emitItineraryEmail } from "@/server/services/itinerary/email";
import { itineraryRequirementsSchema } from "@/server/services/itinerary/requirements";
import { toItineraryPublicDto } from "@/server/services/itinerary/present";

const listQuery = z.object({
  companyId: companyIdZod,
});

export async function GET(request: NextRequest) {
  const parsed = listQuery.safeParse({ companyId: request.nextUrl.searchParams.get("companyId") });
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "companyId is required" }, { status: 400 });
  }
  const tenant = await requireTenantContext(parsed.data.companyId, {
    module: ["bookings", "tours"],
  });
  if (!tenant.ok) return tenant.response;
  const rows = await listItinerariesForCompany(tenant.ctx.companyId);
  return NextResponse.json({
    success: true,
    itineraries: rows.map((row) => toItineraryPublicDto(row, { staff: true })),
  });
}

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "itinerary-create", 8);
  if (limited) return limited;

  const json = await request.json().catch(() => null);
  const parsed = itineraryRequirementsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 }
    );
  }

  const session = await auth();
  const userId = getUserIdFromSession(session);
  const staff = session ? await canAccessDashboardFromSession(session) : false;
  if (staff) {
    const tenant = await requireTenantContext(parsed.data.companyId, {
      module: ["bookings", "tours"],
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
  }

  const generate = Boolean((json as { generate?: boolean } | null)?.generate);
  const created = await createItinerary({ body: parsed.data, userId });
  if (!generate) {
    return NextResponse.json({ success: true, itinerary: toItineraryPublicDto(created) }, { status: 201 });
  }

  try {
    const { row } = await generateItinerary({ itineraryId: created.id });
    emitItineraryEmail("ItineraryGenerated", row);
    return NextResponse.json({ success: true, itinerary: toItineraryPublicDto(row) }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed";
    const status = typeof e === "object" && e && "status" in e ? Number((e as { status: number }).status) : 422;
    return NextResponse.json(
      { success: false, error: message, itinerary: toItineraryPublicDto(created) },
      { status: status || 422 }
    );
  }
}
