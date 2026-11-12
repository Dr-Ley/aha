"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Linkedin, Mail, Phone } from "lucide-react";
import { z } from "zod";
import { contactChannels } from "./content";
import { AccentBlob } from "./decor";
import { MaskReveal } from "./MaskReveal";
import { SectionReveal } from "./SectionReveal";
import { focusRingDark, primaryButton, sectionClass, wrapClass } from "./styles";
import { cn } from "@/lib/utils";

const enquirySchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  businessName: z.string().trim().min(2, "Enter your business name."),
  email: z.string().trim().email("Enter a valid email address."),
  presence: z
    .string()
    .trim()
    .min(3, "Enter a website or social media URL.")
    .refine(
      (value) => /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(value) || /^@?[\w.]{2,}$/i.test(value),
      "Enter a website, Facebook page, or Instagram address."
    ),
  message: z.string().trim().min(12, "Tell me briefly what you need help with."),
});

type EnquiryInput = z.infer<typeof enquirySchema>;

type EnquiryResult =
  | { ok: false; fieldErrors: Partial<Record<keyof EnquiryInput, string>> }
  | { ok: true; status: "unconnected" };

const UNCONNECTED_NOTICE =
  "This form is not connected yet. Nothing was saved or emailed. Use the email, phone, or LinkedIn links until a backend is connected.";

/** Validates the enquiry and stops. Replace the success branch with a real endpoint later. */
export function submitEnquiry(input: EnquiryInput): EnquiryResult {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof EnquiryInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key as keyof EnquiryInput] = issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }
  return { ok: true, status: "unconnected" };
}

const fieldClass = cn(
  focusRingDark,
  "mt-2 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-3 text-base text-[#F5F0E6] placeholder:text-[#8A8478] transition-colors duration-200 focus:border-[#4E8774]"
);

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-[#F5F0E6]">
        {label}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-[#E5735B]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ContactSection() {
  const [errors, setErrors] = useState<Partial<Record<keyof EnquiryInput, string>>>({});
  const [notice, setNotice] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input: EnquiryInput = {
      fullName: String(data.get("fullName") ?? ""),
      businessName: String(data.get("businessName") ?? ""),
      email: String(data.get("email") ?? ""),
      presence: String(data.get("presence") ?? ""),
      message: String(data.get("message") ?? ""),
    };
    const result = submitEnquiry(input);
    if (!result.ok) {
      setNotice("");
      setErrors(result.fieldErrors);
      const order = ["fullName", "businessName", "email", "presence", "message"] as const;
      const firstKey = order.find((key) => result.fieldErrors[key]);
      if (firstKey) form.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }
    setErrors({});
    setNotice(UNCONNECTED_NOTICE);
  }

  return (
    <section id="contact" className={cn(sectionClass, "relative overflow-hidden text-[#F5F0E6]")}>
      <div aria-hidden="true" className="texture-grid pointer-events-none absolute inset-0 opacity-60" />
      <AccentBlob className="bottom-[-6rem] left-[-6rem] h-[360px] w-[360px]" opacity={0.2} />
      <div
        className={cn(
          wrapClass,
          "relative grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start"
        )}
      >
        <SectionReveal>
          <h2 className="font-display max-w-md text-[clamp(2rem,3vw+0.8rem,3.1rem)] font-medium leading-tight tracking-tight text-[#F5F0E6] text-balance">
            <MaskReveal>Ready to Get Your</MaskReveal>
            <MaskReveal delay={0.08}>Business Online?</MaskReveal>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-[#B9B2A6]">
            Whether you&apos;re starting from a Facebook page or improving an existing website, let&apos;s discuss how
            to create a stronger online presence for your business.
          </p>
          <ul className="mt-8 space-y-3 text-base">
            <li>
              <a
                href={`mailto:${contactChannels.email}`}
                className={cn(focusRingDark, "inline-flex min-h-11 items-center gap-3 text-[#F5F0E6] transition-colors duration-200 hover:text-[#4E8774]")}
              >
                <Mail className="size-4 text-[#4E8774]" aria-hidden="true" />
                <span>
                  Email <span className="text-[#B9B2A6]">{contactChannels.email}</span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={contactChannels.linkedin}
                className={cn(focusRingDark, "inline-flex min-h-11 items-center gap-3 text-[#F5F0E6] transition-colors duration-200 hover:text-[#4E8774]")}
                rel="noopener noreferrer"
              >
                <Linkedin className="size-4 text-[#4E8774]" aria-hidden="true" />
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href={contactChannels.phoneHref}
                className={cn(focusRingDark, "inline-flex min-h-11 items-center gap-3 text-[#F5F0E6] transition-colors duration-200 hover:text-[#4E8774]")}
              >
                <Phone className="size-4 text-[#4E8774]" aria-hidden="true" />
                <span>
                  Phone <span className="text-[#B9B2A6]">{contactChannels.phoneDisplay}</span>
                </span>
              </a>
            </li>
          </ul>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-[#8A8478]">
            Email, phone, and LinkedIn are placeholders until your own details are added.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.08}>
          <form
            noValidate
            onSubmit={onSubmit}
            className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-md sm:p-8"
            aria-describedby={notice ? "enquiry-notice" : undefined}
          >
            <div className="grid gap-5">
              <Field id="full-name" label="Full name" error={errors.fullName}>
                <input
                  id="full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  aria-invalid={errors.fullName ? true : undefined}
                  aria-describedby={errors.fullName ? "full-name-error" : undefined}
                  className={fieldClass}
                />
              </Field>
              <Field id="business-name" label="Business name" error={errors.businessName}>
                <input
                  id="business-name"
                  name="businessName"
                  type="text"
                  autoComplete="organization"
                  required
                  aria-invalid={errors.businessName ? true : undefined}
                  aria-describedby={errors.businessName ? "business-name-error" : undefined}
                  className={fieldClass}
                />
              </Field>
              <Field id="email" label="Email address" error={errors.email}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={fieldClass}
                />
              </Field>
              <Field id="presence" label="Current website or social media URL" error={errors.presence}>
                <input
                  id="presence"
                  name="presence"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="facebook.com/your-page"
                  required
                  aria-invalid={errors.presence ? true : undefined}
                  aria-describedby={errors.presence ? "presence-error" : undefined}
                  className={fieldClass}
                />
              </Field>
              <Field id="message" label="What do you need help with?" error={errors.message}>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={errors.message ? "message-error" : undefined}
                  className={cn(fieldClass, "resize-y")}
                />
              </Field>
            </div>
            <button type="submit" className={cn(primaryButton, "mt-6 w-full sm:w-auto")}>
              Book a Free Website Audit
            </button>
            {notice ? (
              <p id="enquiry-notice" role="status" className="mt-4 text-sm leading-relaxed text-[#F5F0E6]/80">
                {notice}
              </p>
            ) : null}
          </form>
        </SectionReveal>
      </div>
    </section>
  );
}