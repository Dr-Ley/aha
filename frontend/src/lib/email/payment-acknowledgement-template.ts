import { escapeHtml, guestGreeting } from "@/lib/email/email-html";

/** Pure payment acknowledgement template (no DB / Resend). */

export function buildPaymentAcknowledgementEmail(input: {
  companyName: string;
  guestName?: string | null;
  paymentId: number;
  amountLabel: string;
  method?: string | null;
}): { subject: string; html: string; text: string } {
  const greeting = guestGreeting(input.guestName);
  const methodLine = input.method?.trim()
    ? `Method: ${input.method.trim()}`
    : null;
  const subject = `Payment received — ${input.companyName}`;
  const textLines = [
    greeting,
    "",
    `We have received your payment of ${input.amountLabel}.`,
    `Reference: Payment #${input.paymentId}`,
    methodLine,
    "",
    `Thank you for choosing ${input.companyName}.`,
    "",
    "This is an automated acknowledgement. Reply to this email if you have questions.",
  ].filter((line) => line != null) as string[];

  const html = `
    <div style="font-family:Georgia,serif;line-height:1.5;color:#1a1a1a">
      <p>${escapeHtml(greeting)}</p>
      <p>We have received your payment of <strong>${escapeHtml(input.amountLabel)}</strong>.</p>
      <p>Reference: Payment #${input.paymentId}${
        methodLine ? `<br/>${escapeHtml(methodLine)}` : ""
      }</p>
      <p>Thank you for choosing ${escapeHtml(input.companyName)}.</p>
      <p style="color:#666;font-size:13px">This is an automated acknowledgement.</p>
    </div>
  `.trim();

  return { subject, html, text: textLines.join("\n") };
}

export function formatPaymentAmountLabel(currency: string, amount: number): string {
  const cur = (currency || "KES").toUpperCase();
  const n = Math.round(Number(amount) || 0);
  if (cur === "KES") {
    return `KSh ${n.toLocaleString("en-KE")}`;
  }
  return `${cur} ${n.toLocaleString("en-US")}`;
}
