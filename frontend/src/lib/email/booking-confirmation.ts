import { emitDomainEvent } from "@/server/services/notifications";

export type BookingConfirmationLike = {
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

/**
 * Fires BookingCreated. Email send is async and is not awaited (SMTP stays off the request path).
 */
export async function maybeSendBookingConfirmation(
  booking: BookingConfirmationLike
): Promise<void> {
  emitDomainEvent({
    name: "BookingCreated",
    companyId: booking.companyId,
    payload: booking,
  });
}
