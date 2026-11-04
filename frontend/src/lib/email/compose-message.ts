import { z } from "zod";

const MAX_RECIPIENTS = 8;

/** Split a comma, semicolon, or newline separated recipient field. */
export function parseRecipientList(raw: string): string[] {
  const seen = new Set<string>();
  const recipients: string[] = [];
  for (const part of raw.split(/[,;\n]/)) {
    const address = part.trim();
    if (!address) continue;
    const key = address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push(address);
  }
  return recipients;
}

/** Blank lines start a new paragraph. */
export function emailParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function refineButton(
  value: { buttonLabel: string; buttonUrl: string },
  ctx: z.RefinementCtx
) {
  const label = value.buttonLabel.trim();
  const url = value.buttonUrl.trim();
  if (!label && !url) return;
  if (!label || !url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["buttonUrl"],
      message: "Add both a button label and a link, or leave both empty",
    });
    return;
  }
  if (!/^https?:\/\//i.test(url)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["buttonUrl"],
      message: "Button link must start with http:// or https://",
    });
  }
}

const designShape = {
  companyId: z.string().trim().min(1).max(32),
  subject: z.string().trim().max(200).optional().default(""),
  preheader: z.string().trim().max(180).optional().default(""),
  heading: z.string().trim().max(160).optional().default(""),
  recipientName: z.string().trim().max(120).optional().default(""),
  body: z.string().trim().max(8000).optional().default(""),
  buttonLabel: z.string().trim().max(40).optional().default(""),
  buttonUrl: z.string().trim().max(500).optional().default(""),
  preview: z.boolean().optional().default(false),
};

export const composeEmailSchema = z.object({
  ...designShape,
  to: z.string().trim().max(2000).optional().default(""),
}).superRefine((value, ctx) => {
  if (value.preview) return;
  refineButton(value, ctx);

  if (!value.subject.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["subject"], message: "Add a subject" });
  }
  if (!value.heading.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["heading"], message: "Add a heading" });
  }
  if (!value.body.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["body"], message: "Write the message" });
  }

  const recipients = parseRecipientList(value.to);
  if (recipients.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["to"],
      message: "Add at least one recipient",
    });
  } else if (recipients.length > MAX_RECIPIENTS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["to"],
      message: `Send to at most ${MAX_RECIPIENTS} people at once`,
    });
  } else {
    const email = z.string().email();
    for (const recipient of recipients) {
      if (!email.safeParse(recipient).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["to"],
          message: `"${recipient}" is not a valid email`,
        });
        break;
      }
    }
  }
});

export type ComposeEmailInput = z.infer<typeof composeEmailSchema>;
