/**
 * EmailService (S5.T2). All outbound mail goes through this module.
 * Delivery rows are written before send; SMTP is never awaited by domain events.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailDeliveries } from "@/lib/schema";
import { ensureSprint5Schema } from "@/server/database/ensure-sprint5";
import {
  getResendFromEmail,
  isEmailConfigured,
  resendSend,
  type SendEmailInput,
  type SendEmailResult,
} from "@/server/services/email/resend-adapter";
import {
  renderEmailTemplate,
  type EmailTemplateId,
  type EmailTemplateVars,
} from "@/server/services/email/templates";

export type { SendEmailInput, SendEmailResult } from "@/server/services/email/resend-adapter";
export { buildResendPayload, getResendFromEmail, isEmailConfigured } from "@/server/services/email/resend-adapter";

function primaryRecipient(to: string | string[]): string {
  const first = (Array.isArray(to) ? to : [to]).map((addr) => addr.trim()).find(Boolean);
  return first ?? "";
}

async function trackDelivery(
  input: SendEmailInput,
  result: SendEmailResult
): Promise<void> {
  const companyId = input.companyId?.trim();
  if (!companyId) return;
  const recipient = primaryRecipient(input.to);
  if (!recipient) return;

  try {
    await ensureSprint5Schema();
    const [queued] = await db
      .insert(emailDeliveries)
      .values({
        companyId,
        template: (input.template ?? "custom").slice(0, 64),
        recipient: recipient.slice(0, 255),
        subject: input.subject.trim().slice(0, 512),
        status: "queued",
        payload: input.payload ?? null,
      })
      .returning({ id: emailDeliveries.id });

    const status = !result.ok ? "failed" : result.skipped ? "skipped" : "sent";
    await db
      .update(emailDeliveries)
      .set({
        status,
        providerMessageId: result.ok && !result.skipped ? result.id : null,
        error: result.ok ? (result.skipped ? result.reason : null) : result.error,
        sentAt: status === "sent" ? new Date() : null,
      })
      .where(eq(emailDeliveries.id, queued.id));
  } catch (e) {
    console.error("[email] delivery tracking failed:", e);
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const result = await resendSend(input);
  await trackDelivery(input, result);
  return result;
}

export async function sendTemplate<K extends EmailTemplateId>(input: {
  to: string | string[];
  companyId: string;
  template: K;
  vars: EmailTemplateVars[K];
  from?: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  const content = renderEmailTemplate(input.template, input.vars);
  return sendEmail({
    to: input.to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    from: input.from,
    replyTo: input.replyTo,
    companyId: input.companyId,
    template: input.template,
    payload: input.vars as unknown as Record<string, unknown>,
  });
}

export const EmailService = {
  send: sendEmail,
  sendTemplate,
  isConfigured: isEmailConfigured,
  fromAddress: getResendFromEmail,
};
