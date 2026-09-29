import { escapeHtml, guestGreeting } from "@/lib/email/email-html";

/** Pure hotel stay confirmation template (no DB / Resend). */
export function buildHotelStayConfirmationEmail(input: {
  companyName: string;
  guestName?: string | null;
  stayId: number;
  roomLabel: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  travellersLabel?: string | null;
  amountLabel?: string | null;
}): { subject: string; html: string; text: string } {
  const greeting = guestGreeting(input.guestName);
  const room = input.roomLabel.trim() || "your room";
  const subject = `Stay reservation received — ${input.companyName}`;
  const travellers = input.travellersLabel?.trim() || null;
  const amount = input.amountLabel?.trim() || null;
  const nightsLabel = `${input.nights} night${input.nights === 1 ? "" : "s"}`;

  const textLines = [
    greeting,
    "",
    `Thank you — we have received your stay reservation.`,
    `Reference: Stay #${input.stayId}`,
    `Room: ${room}`,
    `Check-in: ${input.checkInDate}`,
    `Check-out: ${input.checkOutDate}`,
    `Nights: ${nightsLabel}`,
    travellers ? `Guests: ${travellers}` : null,
    amount ? `Quoted total: ${amount}` : null,
    "",
    "Our team will review your reservation and follow up if anything else is needed.",
    "",
    `Thank you for choosing ${input.companyName}.`,
  ].filter((line) => line != null) as string[];

  const detailRows = [
    `Reference: Stay #${input.stayId}`,
    `Room: ${escapeHtml(room)}`,
    `Check-in: ${escapeHtml(input.checkInDate)}`,
    `Check-out: ${escapeHtml(input.checkOutDate)}`,
    `Nights: ${escapeHtml(nightsLabel)}`,
    travellers ? `Guests: ${escapeHtml(travellers)}` : null,
    amount ? `Quoted total: ${escapeHtml(amount)}` : null,
  ]
    .filter((line) => line != null)
    .join("<br/>");

  const html = `
    <div style="font-family:Georgia,serif;line-height:1.5;color:#1a1a1a">
      <p>${escapeHtml(greeting)}</p>
      <p>Thank you — we have received your stay reservation.</p>
      <p>${detailRows}</p>
      <p>Our team will review your reservation and follow up if anything else is needed.</p>
      <p>Thank you for choosing ${escapeHtml(input.companyName)}.</p>
      <p style="color:#666;font-size:13px">This is an automated acknowledgement.</p>
    </div>
  `.trim();

  return { subject, html, text: textLines.join("\n") };
}
