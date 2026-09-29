import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { itineraryHttpError, requireItineraryAction } from "@/app/api/itineraries/_helpers";
import { modifyItineraryDay } from "@/server/services/itinerary";
import { emitItineraryEmail } from "@/server/services/itinerary/email";
import { toItineraryPublicDto } from "@/server/services/itinerary/present";
import { retrieveTourismCatalog } from "@/server/services/itinerary/retrieval";
import { requirementsFromRow } from "@/server/services/itinerary/itinerary-service";

const patchSchema = z.object({
  day: z.coerce.number().int().positive(),
  destinationId: z.coerce.number().int().positive().optional(),
  accommodationId: z.coerce.number().int().positive().nullable().optional(),
  activityIds: z.array(z.coerce.number().int().positive()).max(12).optional(),
  transportId: z.coerce.number().int().positive().nullable().optional(),
  transferId: z.coerce.number().int().positive().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const loaded = await requireItineraryAction(request, id, "view");
  if (loaded instanceof NextResponse) return loaded;
  const requirements = requirementsFromRow(loaded.row);
  const catalog = await retrieveTourismCatalog(loaded.row.companyId, requirements);
  return NextResponse.json({
    success: true,
    itinerary: toItineraryPublicDto(loaded.row, {
      staff: loaded.actor.kind === "staff",
      catalog,
    }),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const loaded = await requireItineraryAction(request, id, "edit");
  if (loaded instanceof NextResponse) return loaded;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid itinerary change" }, { status: 400 });
  }
  try {
    const changedByUserId = loaded.actor.kind === "staff" || loaded.actor.kind === "customer"
      ? loaded.actor.kind === "customer"
        ? loaded.actor.userId
        : null
      : null;
    const row = await modifyItineraryDay({
      row: loaded.row,
      ...parsed.data,
      changedByUserId,
    });
    emitItineraryEmail("ItineraryUpdated", row);
    const catalog = await retrieveTourismCatalog(row.companyId, requirementsFromRow(row));
    return NextResponse.json({
      success: true,
      itinerary: toItineraryPublicDto(row, {
        staff: loaded.actor.kind === "staff",
        catalog,
      }),
    });
  } catch (e) {
    return itineraryHttpError(e);
  }
}
