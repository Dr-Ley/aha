/**
 * Resend adapter. The only module allowed to import the Resend SDK.
 */
export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Overrides RESEND_FROM_EMAIL when set. */
  from?: string;
  replyTo?: string;
  companyId?: string;
  template?: string;
  payload?: Record<string, unknown>;
};

export type SendEmailResult =
  | { ok: true; id: string | null; skipped: false }
  | { ok: true; id: null; skipped: true; reason: string }
  | { ok: false; error: string };

const DEFAULT_FROM = "AHA<noreply@africanhomeadventure.com>";

export function getResendFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from && from.length > 0 ? from : DEFAULT_FROM;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function normalizeRecipients(to: string | string[]): string[] {
  const list = (Array.isArray(to) ? to : [to]).map((addr) => addr.trim()).filter(Boolean);
  return [...new Set(list)];
}

/** Pure helpers for tests — build the payload Resend expects. */
export function buildResendPayload(input: SendEmailInput): {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
} | null {
  const to = normalizeRecipients(input.to);
  if (to.length === 0) return null;
  const subject = input.subject.trim();
  if (!subject) return null;
  const payload: {
    from: string;
    to: string[];
    subject: string;
    html: string;
    text?: string;
    reply_to?: string;
  } = {
    from: input.from?.trim() || getResendFromEmail(),
    to,
    subject,
    html: input.html,
  };
  if (input.text?.trim()) payload.text = input.text.trim();
  if (input.replyTo?.trim()) payload.reply_to = input.replyTo.trim();
  return payload;
}

export async function resendSend(input: SendEmailInput): Promise<SendEmailResult> {
  const payload = buildResendPayload(input);
  if (!payload) {
    return { ok: false, error: "Missing recipient or subject" };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info(
      `[email] skipped (no RESEND_API_KEY): to=${payload.to.join(",")} subject=${payload.subject}`
    );
    return { ok: true, id: null, skipped: true, reason: "RESEND_API_KEY not set" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      ...(payload.text ? { text: payload.text } : {}),
      ...(payload.reply_to ? { replyTo: payload.reply_to } : {}),
    });
    if (error) {
      console.error("[email] Resend error:", {
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        error,
      });
      return { ok: false, error: error.message ?? "Resend send failed" };
    }
    return { ok: true, id: data?.id ?? null, skipped: false };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Email send failed";
    console.error("[email] send failed:", e);
    return { ok: false, error: message };
  }
}
