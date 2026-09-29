import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessDashboardFromSession, getUserIdFromSession } from "@/lib/permissions-server";
import { requireTenantContext } from "@/server/tenancy";
import { assertCanAccess, getItineraryById, getItineraryByToken } from "@/server/services/itinerary/itinerary-service";
import type { ItineraryRow } from "@/server/services/itinerary/itinerary-service";
import type { ItineraryActor } from "@/server/services/itinerary/access";

export function itineraryHttpError(e: unknown): NextResponse {
  const status =
    typeof e === "object" && e && "status" in e ? Number((e as { status: number }).status) : 500;
  const message = e instanceof Error ? e.message : "Server error";
  const mapped = !status || status < 400 ? 500 : status;
  return NextResponse.json({ success: false, error: message }, { status: mapped });
}

export async function loadItinerary(idOrToken: string): Promise<ItineraryRow | null> {
  if (/^\d+$/.test(idOrToken)) return getItineraryById(Number(idOrToken));
  return getItineraryByToken(idOrToken);
}

async function staffActor(companyId: string, needEdit: boolean): Promise<ItineraryActor | null> {
  const tenant = await requireTenantContext(companyId, {
    module: ["bookings", "tours"],
    requireEdit: needEdit,
  });
  if (!tenant.ok) return null;
  return { kind: "staff", companyId: tenant.ctx.companyId, canEdit: needEdit || true };
}

export async function requireItineraryAction(
  request: NextRequest,
  idOrToken: string,
  action: "view" | "edit" | "accept" | "approve" | "convert"
): Promise<{ row: ItineraryRow; actor: ItineraryActor } | NextResponse> {
  const row = await loadItinerary(idOrToken);
  if (!row) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  const userId = getUserIdFromSession(session);
  const isStaff = session ? await canAccessDashboardFromSession(session) : false;
  const token =
    request.nextUrl.searchParams.get("token") ||
    request.headers.get("x-itinerary-token") ||
    (!/^\d+$/.test(idOrToken) ? idOrToken : "");

  const tokenMatches = Boolean(token && token === row.publicToken);
  let actor: ItineraryActor;

  if (tokenMatches && (action === "view" || action === "edit" || action === "accept")) {
    actor = { kind: "public", token: row.publicToken };
  } else if (isStaff) {
    const needEdit = action !== "view";
    const staff = await staffActor(row.companyId, needEdit);
    if (staff) {
      actor = staff;
    } else if (tokenMatches) {
      actor = { kind: "public", token: row.publicToken };
    } else {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
  } else if (tokenMatches) {
    actor = { kind: "public", token: row.publicToken };
  } else if (userId) {
    actor = { kind: "customer", userId, email: session?.user?.email ?? null };
  } else {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  try {
    await assertCanAccess(actor, row, action);
    return { row, actor };
  } catch (e) {
    return itineraryHttpError(e);
  }
}
