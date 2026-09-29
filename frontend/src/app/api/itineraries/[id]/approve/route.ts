import { NextRequest, NextResponse } from "next/server";
import { itineraryHttpError, requireItineraryAction } from "@/app/api/itineraries/_helpers";
import { setItineraryStatus } from "@/server/services/itinerary";
import { toItineraryPublicDto } from "@/server/services/itinerary/present";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const loaded = await requireItineraryAction(request, id, "approve");
  if (loaded instanceof NextResponse) return loaded;
  try {
    const row = await setItineraryStatus({
      row: loaded.row,
      status: "approved",
      changeSummary: "Staff approved itinerary",
    });
    return NextResponse.json({
      success: true,
      itinerary: toItineraryPublicDto(row, { staff: true }),
    });
  } catch (e) {
    return itineraryHttpError(e);
  }
}
