import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext } from "@/server/tenancy";
import { itineraryHttpError, requireItineraryAction } from "@/app/api/itineraries/_helpers";
import { convertItineraryToBooking } from "@/server/services/itinerary";
import { emitItineraryEmail } from "@/server/services/itinerary/email";
import { toItineraryPublicDto } from "@/server/services/itinerary/present";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const loaded = await requireItineraryAction(request, id, "convert");
  if (loaded instanceof NextResponse) return loaded;
  if (loaded.actor.kind !== "staff") {
    return NextResponse.json({ success: false, error: "Staff only" }, { status: 403 });
  }
  const tenant = await requireTenantContext(loaded.row.companyId, {
    module: ["bookings", "tours"],
    requireEdit: true,
  });
  if (!tenant.ok) return tenant.response;

  try {
    const result = await convertItineraryToBooking({
      row: loaded.row,
      staffUserId: tenant.ctx.userId,
    });
    emitItineraryEmail("ItineraryConvertedToBooking", result.itinerary, {
      bookingId: result.bookingId,
    });
    return NextResponse.json({
      success: true,
      bookingId: result.bookingId,
      itinerary: toItineraryPublicDto(result.itinerary, { staff: true }),
    });
  } catch (e) {
    return itineraryHttpError(e);
  }
}
