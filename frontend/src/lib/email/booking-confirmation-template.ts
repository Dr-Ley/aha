import { escapeHtml, guestGreeting } from "@/lib/email/email-html";

/** Pure safari booking confirmation template (no DB / Resend). */
export function buildBookingConfirmationEmail(input: {
  companyName: string;
  guestName?: string | null;
  bookingId: number;
  safariPackage: string;
  travelDate: string;
  travellersLabel?: string | null;
  amountLabel?: string | null;
}): { subject: string; html: string; text: string } {
  const greeting = guestGreeting(input.guestName);
  const pkg = input.safariPackage.trim() || "Safari booking";
  const subject = `Booking received — ${pkg}`;
  const travellers = input.travellersLabel?.trim() || null;
  const amount = input.amountLabel?.trim() || null;

  const textLines = [
    greeting,
    "",
    `Thank you — we have received your safari booking request.`,
    `Reference: Booking #${input.bookingId}`,
    `Package: ${pkg}`,
    `Travel date: ${input.travelDate}`,
    travellers ? `Travellers: ${travellers}` : null,
    amount ? `Quoted total: ${amount}` : null,
    "",
    "Our team will review your request and follow up with confirmation and payment details.",
    "",
    `Thank you for choosing ${input.companyName}.`,
  ].filter((line) => line != null) as string[];

  const detailRows = [
    `Reference: Booking #${input.bookingId}`,
    `Package: ${escapeHtml(pkg)}`,
    `Travel date: ${escapeHtml(input.travelDate)}`,
    travellers ? `Travellers: ${escapeHtml(travellers)}` : null,
    amount ? `Quoted total: ${escapeHtml(amount)}` : null,
  ]
    .filter((line) => line != null)
    .join("<br/>");

  const html = `
    <div style="font-family:Georgia,serif;line-height:1.5;color:#1a1a1a">
      <p>${escapeHtml(greeting)}</p>
      <p>Thank you — we have received your safari booking request.</p>
      <p>${detailRows}</p>
      <p>Our team will review your request and follow up with confirmation and payment details.</p>
      <p>Thank you for choosing ${escapeHtml(input.companyName)}.</p>
      <p style="color:#666;font-size:13px">This is an automated acknowledgement.</p>
    </div>
  `.trim();

  return { subject, html, text: textLines.join("\n") };
}
