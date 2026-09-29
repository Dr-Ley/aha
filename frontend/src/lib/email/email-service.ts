/**
 * Outbound email (E9 / S5.T2). Routes must not call Resend directly — use EmailService.
 * Pure payload helpers stay importable without DATABASE_URL (unit tests).
 */
export {
  buildResendPayload,
  getResendFromEmail,
  isEmailConfigured,
  type SendEmailInput,
  type SendEmailResult,
} from "@/server/services/email/resend-adapter";
import type { SendEmailInput, SendEmailResult } from "@/server/services/email/resend-adapter";

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { sendEmail: send } = await import("@/server/services/email/email-service");
  return send(input);
}
