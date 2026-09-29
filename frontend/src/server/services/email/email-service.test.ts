import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildResendPayload, getResendFromEmail } from "./resend-adapter";
import { renderEmailTemplate } from "./templates";

describe("buildResendPayload", () => {
  it("normalizes recipients and applies default from", () => {
    const payload = buildResendPayload({
      to: ["  guest@example.com ", "guest@example.com"],
      subject: " Hello ",
      html: "<p>Hi</p>",
      text: " Hi ",
    });
    assert.ok(payload);
    assert.deepEqual(payload!.to, ["guest@example.com"]);
    assert.equal(payload!.subject, "Hello");
    assert.equal(payload!.text, "Hi");
    assert.equal(payload!.from, getResendFromEmail());
  });

  it("rejects empty recipient or subject", () => {
    assert.equal(buildResendPayload({ to: "  ", subject: "X", html: "y" }), null);
    assert.equal(buildResendPayload({ to: "a@b.com", subject: "  ", html: "y" }), null);
  });
});

describe("renderEmailTemplate", () => {
  it("renders itinerary_generated with company branding", () => {
    const mail = renderEmailTemplate("itinerary_generated", {
      companyName: "African Home Adventure",
      guestName: "Ada",
      itineraryId: 9,
      destination: "Maasai Mara",
      travelDate: "2026-09-12",
      amountLabel: "KSh 95,000",
    });
    assert.match(mail.subject, /Maasai Mara/);
    assert.match(mail.text, /Itinerary #9/);
    assert.match(mail.text, /African Home Adventure/);
    assert.match(mail.html, /KSh 95,000/);
  });
});
