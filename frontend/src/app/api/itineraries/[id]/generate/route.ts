import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { itineraryHttpError, requireItineraryAction } from "@/app/api/itineraries/_helpers";
import { generateItinerary } from "@/server/services/itinerary";
import { emitItineraryEmail } from "@/server/services/itinerary/email";
import { toItineraryPublicDto } from "@/server/services/itinerary/present";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const limited = enforceRateLimit(request, "itinerary-generate", 5);
  if (limited) return limited;
  const { id } = await context.params;
  const loaded = await requireItineraryAction(request, id, "edit");
  if (loaded instanceof NextResponse) return loaded;
  try {
    const { row, catalog } = await generateItinerary({ itineraryId: loaded.row.id });
    emitItineraryEmail("ItineraryGenerated", row);
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
