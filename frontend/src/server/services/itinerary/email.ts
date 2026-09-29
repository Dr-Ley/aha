import { formatPaymentAmountLabel } from "@/lib/email/payment-acknowledgement-template";
import { emitDomainEvent } from "@/server/services/notifications";
import {
  destinationLabel,
  itineraryViewUrl,
  type ItineraryRow,
} from "@/server/services/itinerary/itinerary-service";
import type { DomainEvent } from "@/server/services/notifications/events";

function payloadFromRow(row: ItineraryRow) {
  return {
    id: row.id,
    companyId: row.companyId,
    email: row.guestEmail,
    guestName: row.guestName,
    destination: destinationLabel(row),
    travelDate: row.startDate,
    amountLabel:
      row.sellingPrice != null ? formatPaymentAmountLabel(row.currency ?? "USD", row.sellingPrice) : null,
    viewUrl: itineraryViewUrl(row.publicToken),
  };
}

export function emitItineraryEmail(
  name: Extract<
    DomainEvent["name"],
    "ItineraryGenerated" | "ItineraryUpdated" | "ItineraryAccepted" | "ItineraryConvertedToBooking"
  >,
  row: ItineraryRow,
  extra?: { bookingId?: number }
): void {
  const payload = payloadFromRow(row);
  if (name === "ItineraryConvertedToBooking") {
    emitDomainEvent({
      name,
      companyId: row.companyId,
      payload: { ...payload, bookingId: extra?.bookingId ?? row.bookingId ?? 0 },
    });
    return;
  }
  emitDomainEvent({ name, companyId: row.companyId, payload });
}
