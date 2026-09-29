import { COMPANIES, DEFAULT_COMPANY_ID, type CompanyId } from "@/types/company";
import { sendEmail } from "@/lib/email/email-service";
import { buildEnquiryAcknowledgementEmail } from "@/lib/email/enquiry-acknowledgement-template";

export type EnquiryAcknowledgementLike = {
  id: number;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
  subject?: string | null;
  companyId?: string | null;
};

function companyDisplayName(companyId: string): string {
  return COMPANIES.find((c) => c.id === companyId)?.name ?? "African Home Adventure";
}

/**
 * Sends enquiry acknowledgement to the contact submitter.
 * Never throws — failures are logged so contact POST stays reliable.
 */
export async function maybeSendEnquiryAcknowledgement(
  enquiry: EnquiryAcknowledgementLike
): Promise<void> {
  const to = enquiry.email?.trim();
  if (!to) {
    console.info(`[email] enquiry ack skipped (no email) enquiry=#${enquiry.id}`);
    return;
  }

  try {
    const guestName =
      [enquiry.firstName, enquiry.lastName].filter(Boolean).join(" ").trim() || null;
    const companyId = (enquiry.companyId ?? DEFAULT_COMPANY_ID) as CompanyId;
    const content = buildEnquiryAcknowledgementEmail({
      companyName: companyDisplayName(companyId),
      guestName,
      enquiryId: enquiry.id,
      subject: enquiry.subject ?? "your message",
    });

    const result = await sendEmail({
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      companyId,
      template: "enquiry_acknowledgement",
    });
    if (!result.ok) {
      console.error(`[email] enquiry ack failed enquiry=#${enquiry.id}:`, result.error);
    }
  } catch (e) {
    console.error(`[email] enquiry ack error enquiry=#${enquiry.id}:`, e);
  }
}
