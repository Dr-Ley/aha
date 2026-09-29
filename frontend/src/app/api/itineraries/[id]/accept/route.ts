import { NextRequest, NextResponse } from "next/server";
import { itineraryHttpError, requireItineraryAction } from "@/app/api/itineraries/_helpers";
import { setItineraryStatus } from "@/server/services/itinerary";
import { emitItineraryEmail } from "@/server/services/itinerary/email";
import { toItineraryPublicDto } from "@/server/services/itinerary/present";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const loaded = await requireItineraryAction(request, id, "accept");
  if (loaded instanceof NextResponse) return loaded;
  try {
    const row = await setItineraryStatus({
      row: loaded.row,
      status: "accepted",
      changeSummary: "Customer accepted itinerary",
    });
    emitItineraryEmail("ItineraryAccepted", row);
    return NextResponse.json({ success: true, itinerary: toItineraryPublicDto(row) });
  } catch (e) {
    return itineraryHttpError(e);
  }
}
