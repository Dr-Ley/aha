import { escapeHtml, guestGreeting } from "@/lib/email/email-html";

/** Pure enquiry / contact acknowledgement template (no DB / Resend). */
export function buildEnquiryAcknowledgementEmail(input: {
  companyName: string;
  guestName?: string | null;
  enquiryId: number;
  subject: string;
}): { subject: string; html: string; text: string } {
  const greeting = guestGreeting(input.guestName);
  const topic = input.subject.trim() || "your message";
  const mailSubject = `We received your enquiry — ${input.companyName}`;

  const text = [
    greeting,
    "",
    `Thank you for contacting ${input.companyName}.`,
    `We have received your enquiry about "${topic}".`,
    `Reference: Enquiry #${input.enquiryId}`,
    "",
    "Our team will get back to you as soon as possible.",
  ].join("\n");

  const html = `
    <div style="font-family:Georgia,serif;line-height:1.5;color:#1a1a1a">
      <p>${escapeHtml(greeting)}</p>
      <p>Thank you for contacting ${escapeHtml(input.companyName)}.</p>
      <p>We have received your enquiry about &ldquo;${escapeHtml(topic)}&rdquo;.</p>
      <p>Reference: Enquiry #${input.enquiryId}</p>
      <p>Our team will get back to you as soon as possible.</p>
      <p style="color:#666;font-size:13px">This is an automated acknowledgement.</p>
    </div>
  `.trim();

  return { subject: mailSubject, html, text };
}
