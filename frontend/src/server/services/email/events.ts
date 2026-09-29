import { COMPANIES, type CompanyId } from "@/types/company";
import { resolvePaymentAckRecipient } from "@/lib/email/payment-acknowledgement";
import { formatPaymentAmountLabel } from "@/lib/email/payment-acknowledgement-template";
import { normalizeTravellerCounts, travellerCountsLabel } from "@/lib/travellers";
import { EmailService } from "@/server/services/email/email-service";
import type { DomainEvent } from "@/server/services/notifications";

function companyDisplayName(companyId: string): string {
  return COMPANIES.find((c) => c.id === companyId)?.name ?? "African Home Adventure";
}

/**
 * Maps domain events to branded templates. Never throws — booking/payment writes stay reliable.
 */
export async function handleEmailEvent(event: DomainEvent): Promise<void> {
  try {
    if (event.name === "BookingCreated") {
      const booking = event.payload;
      const to = booking.email?.trim();
      if (!to) {
        console.info(`[email] booking confirmation skipped (no email) booking=#${booking.id}`);
        return;
      }
      const guestName =
        [booking.firstName, booking.lastName].filter(Boolean).join(" ").trim() || null;
      const travelDate = String(booking.startDate ?? booking.travelDate ?? "").slice(0, 10);
      const amountLabel =
        booking.originalAmount != null
          ? formatPaymentAmountLabel(booking.originalCurrency ?? "KES", booking.originalAmount)
          : booking.totalPrice != null
            ? formatPaymentAmountLabel("KES", booking.totalPrice)
            : null;
      const result = await EmailService.sendTemplate({
        to,
        companyId: booking.companyId,
        template: "booking_confirmation",
        vars: {
          companyName: companyDisplayName(booking.companyId as CompanyId),
          guestName,
          bookingId: booking.id,
          safariPackage: booking.safariPackage ?? "Safari booking",
          travelDate: travelDate || "TBC",
          travellersLabel: travellerCountsLabel(
            normalizeTravellerCounts({
              adults: booking.adults,
              children: booking.children,
              infants: booking.infants,
              guests: booking.guests,
            })
          ),
          amountLabel,
        },
      });
      if (!result.ok) {
        console.error(`[email] booking confirmation failed booking=#${booking.id}:`, result.error);
      }
      return;
    }

    if (event.name === "PaymentReceived") {
      const payment = event.payload;
      if (String(payment.status).toLowerCase() !== "completed") return;
      const recipient = await resolvePaymentAckRecipient(payment);
      if (!recipient) {
        console.info(
          `[email] payment ack skipped (no recipient email) payment=#${payment.id} company=${payment.companyId}`
        );
        return;
      }
      const result = await EmailService.sendTemplate({
        to: recipient.email,
        companyId: payment.companyId,
        template: "payment_received",
        vars: {
          companyName: companyDisplayName(payment.companyId as CompanyId),
          guestName: recipient.guestName,
          paymentId: payment.id,
          amountLabel: formatPaymentAmountLabel(payment.currency, payment.amount),
          method: payment.method,
        },
      });
      if (!result.ok) {
        console.error(`[email] payment ack failed payment=#${payment.id}:`, result.error);
      }
      return;
    }

    if (
      event.name === "ItineraryGenerated" ||
      event.name === "ItineraryUpdated" ||
      event.name === "ItineraryAccepted" ||
      event.name === "ItineraryConvertedToBooking"
    ) {
      const itinerary = event.payload;
      const to = itinerary.email?.trim();
      if (!to) {
        console.info(`[email] ${event.name} skipped (no email) itinerary=#${itinerary.id}`);
        return;
      }
      const template =
        event.name === "ItineraryUpdated"
          ? "itinerary_updated"
          : event.name === "ItineraryAccepted"
            ? "itinerary_accepted"
            : event.name === "ItineraryConvertedToBooking"
              ? "itinerary_converted"
              : "itinerary_generated";
      const result = await EmailService.sendTemplate({
        to,
        companyId: itinerary.companyId,
        template,
        vars: {
          companyName: companyDisplayName(itinerary.companyId as CompanyId),
          guestName: itinerary.guestName,
          itineraryId: itinerary.id,
          destination: itinerary.destination,
          travelDate: itinerary.travelDate,
          amountLabel: itinerary.amountLabel,
          viewUrl: itinerary.viewUrl,
        },
      });
      if (!result.ok) {
        console.error(`[email] ${event.name} failed itinerary=#${itinerary.id}:`, result.error);
      }
    }
  } catch (e) {
    console.error(`[email] event handler error (${event.name}):`, e);
  }
}
