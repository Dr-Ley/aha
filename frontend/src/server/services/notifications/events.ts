export type BookingCreatedPayload = {
  id: number;
  companyId: string;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
  safariPackage?: string | null;
  travelDate?: string | null;
  startDate?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  guests?: number | null;
  originalAmount?: number | null;
  originalCurrency?: string | null;
  totalPrice?: number | null;
};

export type PaymentReceivedPayload = {
  id: number;
  companyId: string;
  amount: number;
  currency: string;
  method: string | null;
  status: string;
  bookingId: number | null;
  referenceType: string | null;
  referenceId: number | null;
};

export type ItineraryGeneratedPayload = {
  id: number;
  companyId: string;
  email?: string | null;
  guestName?: string | null;
  destination: string;
  travelDate?: string | null;
  amountLabel?: string | null;
  viewUrl?: string | null;
};

export type ItineraryUpdatedPayload = ItineraryGeneratedPayload;
export type ItineraryAcceptedPayload = ItineraryGeneratedPayload;
export type ItineraryConvertedToBookingPayload = ItineraryGeneratedPayload & {
  bookingId: number;
};

export type DomainEvent =
  | { name: "BookingCreated"; companyId: string; payload: BookingCreatedPayload }
  | { name: "PaymentReceived"; companyId: string; payload: PaymentReceivedPayload }
  | { name: "ItineraryGenerated"; companyId: string; payload: ItineraryGeneratedPayload }
  | { name: "ItineraryUpdated"; companyId: string; payload: ItineraryUpdatedPayload }
  | { name: "ItineraryAccepted"; companyId: string; payload: ItineraryAcceptedPayload }
  | { name: "ItineraryConvertedToBooking"; companyId: string; payload: ItineraryConvertedToBookingPayload };

/**
 * Fire-and-forget domain events. Email is dispatched asynchronously; callers must not await SMTP.
 */
export function emitDomainEvent(event: DomainEvent): void {
  void import("@/server/services/email/events")
    .then(({ handleEmailEvent }) => handleEmailEvent(event))
    .catch((e) => {
      console.error("[events] email handler failed:", event.name, e);
    });
}
