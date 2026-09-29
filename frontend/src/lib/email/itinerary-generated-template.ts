import { escapeHtml, guestGreeting } from "@/lib/email/email-html";

export type ItineraryEmailKind = "generated" | "updated" | "accepted" | "converted";

const COPY: Record<ItineraryEmailKind, { subject: (destination: string) => string; intro: string }> = {
  generated: {
    subject: (destination) => `Your itinerary is ready — ${destination}`,
    intro: "Your safari itinerary is ready.",
  },
  updated: {
    subject: (destination) => `Your itinerary was updated — ${destination}`,
    intro: "Your safari itinerary has been updated and the quote has been recalculated.",
  },
  accepted: {
    subject: (destination) => `We received your itinerary — ${destination}`,
    intro: "Thank you. Our team will review your itinerary and follow up shortly.",
  },
  converted: {
    subject: (destination) => `Your itinerary is now a booking — ${destination}`,
    intro: "Your itinerary has been converted into a safari booking. You will receive a separate booking confirmation.",
  },
};

export function buildItineraryLifecycleEmail(input: {
  kind: ItineraryEmailKind;
  companyName: string;
  guestName?: string | null;
  itineraryId: number;
  destination: string;
  travelDate?: string | null;
  amountLabel?: string | null;
  viewUrl?: string | null;
}): { subject: string; html: string; text: string } {
  const greeting = guestGreeting(input.guestName);
  const destination = input.destination.trim() || "your safari";
  const copy = COPY[input.kind];
  const subject = copy.subject(destination);
  const travelDate = input.travelDate?.trim() || null;
  const amount = input.amountLabel?.trim() || null;
  const viewUrl = input.viewUrl?.trim() || null;

  const textLines = [
    greeting,
    "",
    copy.intro,
    `Reference: Itinerary #${input.itineraryId}`,
    `Destination: ${destination}`,
    travelDate ? `Travel date: ${travelDate}` : null,
    amount ? `Quoted total: ${amount}` : null,
    viewUrl ? `View itinerary: ${viewUrl}` : "Review the itinerary and tell us if you would like any changes.",
    "",
    `Thank you for choosing ${input.companyName}.`,
  ].filter((line) => line != null) as string[];

  const detailRows = [
    `Reference: Itinerary #${input.itineraryId}`,
    `Destination: ${escapeHtml(destination)}`,
    travelDate ? `Travel date: ${escapeHtml(travelDate)}` : null,
    amount ? `Quoted total: ${escapeHtml(amount)}` : null,
  ]
    .filter((line) => line != null)
    .join("<br/>");

  const linkHtml = viewUrl
    ? `<p><a href="${escapeHtml(viewUrl)}">View your itinerary</a></p>`
    : "<p>Review the itinerary and tell us if you would like any changes.</p>";

  const html = `
    <div style="font-family:Georgia,serif;line-height:1.5;color:#1a1a1a">
      <p>${escapeHtml(greeting)}</p>
      <p>${escapeHtml(copy.intro)}</p>
      <p>${detailRows}</p>
      ${linkHtml}
      <p>Thank you for choosing ${escapeHtml(input.companyName)}.</p>
      <p style="color:#666;font-size:13px">This is an automated message.</p>
    </div>
  `.trim();

  return { subject, html, text: textLines.join("\n") };
}

/** Backwards-compatible generated-itinerary builder. */
export function buildItineraryGeneratedEmail(input: {
  companyName: string;
  guestName?: string | null;
  itineraryId: number;
  destination: string;
  travelDate?: string | null;
  amountLabel?: string | null;
  viewUrl?: string | null;
}): { subject: string; html: string; text: string } {
  return buildItineraryLifecycleEmail({ ...input, kind: "generated" });
}
