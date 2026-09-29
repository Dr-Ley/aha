import { buildBookingConfirmationEmail } from "@/lib/email/booking-confirmation-template";
import { buildItineraryGeneratedEmail, buildItineraryLifecycleEmail } from "@/lib/email/itinerary-generated-template";
import { buildPaymentAcknowledgementEmail } from "@/lib/email/payment-acknowledgement-template";

export const EMAIL_TEMPLATES = [
  "booking_confirmation",
  "payment_received",
  "itinerary_generated",
  "itinerary_updated",
  "itinerary_accepted",
  "itinerary_converted",
] as const;

export type EmailTemplateId = (typeof EMAIL_TEMPLATES)[number];

export type EmailTemplateVars = {
  booking_confirmation: Parameters<typeof buildBookingConfirmationEmail>[0];
  payment_received: Parameters<typeof buildPaymentAcknowledgementEmail>[0];
  itinerary_generated: Parameters<typeof buildItineraryGeneratedEmail>[0];
  itinerary_updated: Parameters<typeof buildItineraryGeneratedEmail>[0];
  itinerary_accepted: Parameters<typeof buildItineraryGeneratedEmail>[0];
  itinerary_converted: Parameters<typeof buildItineraryGeneratedEmail>[0];
};

export type RenderedEmail = { subject: string; html: string; text: string };

export function renderEmailTemplate<K extends EmailTemplateId>(
  template: K,
  vars: EmailTemplateVars[K]
): RenderedEmail {
  if (template === "booking_confirmation") {
    return buildBookingConfirmationEmail(vars as EmailTemplateVars["booking_confirmation"]);
  }
  if (template === "payment_received") {
    return buildPaymentAcknowledgementEmail(vars as EmailTemplateVars["payment_received"]);
  }
  if (template === "itinerary_updated") {
    return buildItineraryLifecycleEmail({
      ...(vars as EmailTemplateVars["itinerary_updated"]),
      kind: "updated",
    });
  }
  if (template === "itinerary_accepted") {
    return buildItineraryLifecycleEmail({
      ...(vars as EmailTemplateVars["itinerary_accepted"]),
      kind: "accepted",
    });
  }
  if (template === "itinerary_converted") {
    return buildItineraryLifecycleEmail({
      ...(vars as EmailTemplateVars["itinerary_converted"]),
      kind: "converted",
    });
  }
  return buildItineraryGeneratedEmail(vars as EmailTemplateVars["itinerary_generated"]);
}
