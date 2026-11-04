import { NextRequest, NextResponse } from "next/server";
import { renderDesignedMessage } from "@/emails/render-designed-message";
import { getCompanyLetterhead } from "@/lib/documents/letterhead";
import { absoluteUrl } from "@/lib/site-url";
import { guestGreeting } from "@/lib/email/email-html";
import { composeEmailSchema, emailParagraphs, parseRecipientList } from "@/lib/email/compose-message";
import { requireTenantContext } from "@/server/tenancy";
import {
  getResendFromEmail,
  isEmailConfigured,
  sendEmail,
} from "@/server/services/email/email-service";

function messageProps(companyId: string, input: {
  preheader: string;
  heading: string;
  recipientName: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
}) {
  const letterhead = getCompanyLetterhead(companyId);
  const footerLines = [
    letterhead.legalName,
    letterhead.tagline ?? "",
    ...letterhead.lines,
    letterhead.phones.filter(Boolean).join(" · "),
    letterhead.email,
    letterhead.website,
  ].filter((line) => line.trim().length > 0);

  const buttonReady = /^https?:\/\//i.test(input.buttonUrl.trim()) && input.buttonLabel.trim().length > 0;
  return {
    letterhead,
    props: {
      companyName: letterhead.legalName,
      logoUrl: letterhead.logo ? absoluteUrl(letterhead.logo) : "",
      tagline: letterhead.tagline ?? "",
      footerLines,
      preheader: input.preheader,
      heading: input.heading,
      greeting: guestGreeting(input.recipientName),
      paragraphs: emailParagraphs(input.body),
      buttonLabel: buttonReady ? input.buttonLabel.trim() : "",
      buttonUrl: buttonReady ? input.buttonUrl.trim() : "",
    },
  };
}

export async function GET(request: NextRequest) {
  const tenant = await requireTenantContext(new URL(request.url).searchParams.get("companyId"), {
    overview: true,
  });
  if (!tenant.ok) return tenant.response;

  const letterhead = getCompanyLetterhead(tenant.ctx.companyId);
  return NextResponse.json({
    from: getResendFromEmail(),
    replyTo: letterhead.reservationEmail || letterhead.email,
    configured: isEmailConfigured(),
    companyName: letterhead.legalName,
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = composeEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email" },
      { status: 400 }
    );
  }

  const tenant = await requireTenantContext(parsed.data.companyId, { overview: true });
  if (!tenant.ok) return tenant.response;

  const { letterhead, props } = messageProps(tenant.ctx.companyId, parsed.data);
  let rendered: { html: string; text: string };
  try {
    rendered = await renderDesignedMessage(props);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not render the email";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (parsed.data.preview) {
    return NextResponse.json({ html: rendered.html, text: rendered.text });
  }

  const result = await sendEmail({
    to: parseRecipientList(parsed.data.to),
    subject: parsed.data.subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: letterhead.reservationEmail || letterhead.email,
    companyId: tenant.ctx.companyId,
    template: "composed",
    payload: { preheader: parsed.data.preheader, source: "email-studio" },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  if (result.skipped) {
    return NextResponse.json({ ok: true, skipped: true, reason: result.reason });
  }
  return NextResponse.json({ ok: true, skipped: false, id: result.id });
}
