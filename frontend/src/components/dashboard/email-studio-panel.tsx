"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Send, Smartphone } from "lucide-react";
import { useCompany } from "@/store/company-context";

type DeliveryMeta = {
  from: string;
  replyTo: string;
  configured: boolean;
  companyName: string;
};

export function EmailStudioPanel() {
  const { selectedCompany, selectedCompanyId } = useCompany();
  const previewGen = useRef(0);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("A note from the team");
  const [preheader, setPreheader] = useState("");
  const [heading, setHeading] = useState("We are looking forward to hosting you");
  const [recipientName, setRecipientName] = useState("");
  const [body, setBody] = useState(
    "Write the message here.\n\nA blank line starts a new paragraph. The preview on the right is the React Email that Resend will send."
  );
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [meta, setMeta] = useState<DeliveryMeta | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewState, setPreviewState] = useState<"idle" | "updating" | "ready" | "error">("idle");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMeta(null);
    void (async () => {
      try {
        const res = await fetch(`/api/emails/compose?companyId=${encodeURIComponent(selectedCompanyId)}`);
        const data = (await res.json()) as DeliveryMeta & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setNotice({ type: "error", message: data.error ?? "Could not load the sending address" });
          return;
        }
        setMeta(data);
      } catch {
        if (!cancelled) setNotice({ type: "error", message: "Could not load the sending address" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId]);

  useEffect(() => {
    const generation = ++previewGen.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        setPreviewState("updating");
        try {
          const res = await fetch("/api/emails/compose", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companyId: selectedCompanyId,
              preview: true,
              subject,
              preheader,
              heading,
              recipientName,
              body,
              buttonLabel,
              buttonUrl,
            }),
          });
          const data = (await res.json()) as { html?: string; error?: string };
          if (generation !== previewGen.current) return;
          if (!res.ok || !data.html) {
            setPreviewState("error");
            setNotice({ type: "error", message: data.error ?? "Could not render the preview" });
            return;
          }
          setPreviewHtml(data.html);
          setPreviewState("ready");
        } catch {
          if (generation !== previewGen.current) return;
          setPreviewState("error");
          setNotice({ type: "error", message: "Could not render the preview" });
        }
      })();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [selectedCompanyId, subject, preheader, heading, recipientName, body, buttonLabel, buttonUrl]);

  async function send() {
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/emails/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          preview: false,
          to,
          subject,
          preheader,
          heading,
          recipientName,
          body,
          buttonLabel,
          buttonUrl,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        skipped?: boolean;
        reason?: string;
        id?: string | null;
      };
      if (!res.ok) {
        setNotice({ type: "error", message: data.error ?? "Send failed" });
        return;
      }
      setConfirming(false);
      if (data.skipped) {
        setNotice({
          type: "info",
          message: data.reason ?? "Sending was skipped because Resend is not configured.",
        });
        return;
      }
      setNotice({
        type: "success",
        message: data.id ? `Sent. Resend id ${data.id}.` : "Sent.",
      });
    } catch {
      setNotice({ type: "error", message: "Send failed" });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Emails</h1>
          <p className="text-sm text-base-content/60">
            Design a React Email for {selectedCompany.name}, check the preview, then send it with Resend.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm gap-2"
          onClick={() => {
            setNotice(null);
            setConfirming(true);
          }}
          disabled={sending}
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </div>

      {meta && !meta.configured ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          Resend is not configured. You can still design and preview. Sending stays skipped until RESEND_API_KEY is set.
        </div>
      ) : null}

      {notice ? (
        <div
          className={
            notice.type === "error"
              ? "rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
              : notice.type === "success"
                ? "rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm"
                : "rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm"
          }
        >
          {notice.message}
        </div>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="grid gap-3 rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm md:grid-cols-2">
          <label className="form-control md:col-span-2">
            <span className="label-text mb-1 text-xs font-medium">To</span>
            <input
              className="input input-bordered input-sm w-full"
              type="text"
              autoComplete="off"
              placeholder="guest@example.com"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
            <span className="mt-1 text-xs text-base-content/50">Separate extra addresses with commas.</span>
          </label>
          <label className="form-control">
            <span className="label-text mb-1 text-xs font-medium">Subject</span>
            <input
              className="input input-bordered input-sm w-full"
              value={subject}
              maxLength={200}
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1 text-xs font-medium">Inbox preview text</span>
            <input
              className="input input-bordered input-sm w-full"
              value={preheader}
              maxLength={180}
              placeholder="Shown beside the subject in the inbox"
              onChange={(event) => setPreheader(event.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1 text-xs font-medium">Heading</span>
            <input
              className="input input-bordered input-sm w-full"
              value={heading}
              maxLength={160}
              onChange={(event) => setHeading(event.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1 text-xs font-medium">Recipient name</span>
            <input
              className="input input-bordered input-sm w-full"
              value={recipientName}
              maxLength={120}
              placeholder="Optional, used in the greeting"
              onChange={(event) => setRecipientName(event.target.value)}
            />
          </label>
          <label className="form-control md:col-span-2">
            <span className="label-text mb-1 text-xs font-medium">Message</span>
            <textarea
              className="textarea textarea-bordered w-full text-sm"
              rows={10}
              maxLength={8000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1 text-xs font-medium">Button label</span>
            <input
              className="input input-bordered input-sm w-full"
              value={buttonLabel}
              maxLength={40}
              placeholder="Optional"
              onChange={(event) => setButtonLabel(event.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1 text-xs font-medium">Button link</span>
            <input
              className="input input-bordered input-sm w-full"
              value={buttonUrl}
              maxLength={500}
              placeholder="https://"
              onChange={(event) => setButtonUrl(event.target.value)}
            />
          </label>
          <p className="text-xs text-base-content/60 md:col-span-2">
            From {meta?.from ?? "the configured Resend address"}
            {meta?.replyTo ? ` · Reply-to ${meta.replyTo}` : ""}
          </p>
        </div>

        <aside className="overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-base-content/10 px-3 py-2">
            <div>
              <p className="text-sm font-medium">Preview</p>
              <p className="text-xs text-base-content/50">
                {previewState === "updating" ? "Updating…" : subject || "No subject yet"}
              </p>
            </div>
            <div className="join">
              <button
                type="button"
                className={`btn btn-xs join-item ${viewport === "desktop" ? "btn-primary" : "btn-ghost"}`}
                aria-label="Desktop preview"
                onClick={() => setViewport("desktop")}
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className={`btn btn-xs join-item ${viewport === "mobile" ? "btn-primary" : "btn-ghost"}`}
                aria-label="Mobile preview"
                onClick={() => setViewport("mobile")}
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex justify-center bg-base-200/70 p-3">
            <iframe
              title="Email preview"
              sandbox=""
              srcDoc={
                previewHtml ||
                "<p style=\"font-family:Georgia,serif;color:#6b6560;padding:24px\">The preview appears as you design.</p>"
              }
              className="h-160 border-0 bg-white shadow-sm"
              style={{ width: viewport === "mobile" ? 375 : "100%", maxWidth: viewport === "desktop" ? 600 : 375 }}
            />
          </div>
        </aside>
      </div>

      {confirming ? (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h2 className="text-lg font-semibold">Send this email?</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-base-content/50">To</dt>
                <dd>{to || "No recipient yet"}</dd>
              </div>
              <div>
                <dt className="text-base-content/50">Subject</dt>
                <dd>{subject || "No subject yet"}</dd>
              </div>
              <div>
                <dt className="text-base-content/50">From</dt>
                <dd>{meta?.from ?? "Configured Resend address"}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-base-content/70">
              The preview is the React Email that will be sent for {selectedCompany.name}.
            </p>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)} disabled={sending}>
                Keep editing
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => void send()} disabled={sending}>
                {sending ? "Sending…" : "Send email"}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop bg-black/40"
            aria-label="Close dialog"
            onClick={() => {
              if (!sending) setConfirming(false);
            }}
          />
        </dialog>
      ) : null}
    </section>
  );
}
