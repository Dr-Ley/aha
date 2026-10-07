import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildResendPayload, getResendFromEmail } from "./email-service";
import {
  buildPaymentAcknowledgementEmail,
  formatPaymentAmountLabel,
} from "./payment-acknowledgement-template";
import { buildBookingConfirmationEmail } from "./booking-confirmation-template";
import { buildEnquiryAcknowledgementEmail } from "./enquiry-acknowledgement-template";
import { buildHotelStayConfirmationEmail } from "./hotel-stay-confirmation-template";
import { buildItineraryGeneratedEmail } from "./itinerary-generated-template";

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

describe("formatPaymentAmountLabel", () => {
  it("formats KES with KSh prefix", () => {
    assert.match(formatPaymentAmountLabel("KES", 12000), /KSh/);
    assert.match(formatPaymentAmountLabel("KES", 12000), /12/);
  });
});

describe("buildPaymentAcknowledgementEmail", () => {
  it("includes amount, payment id, and company name", () => {
    const mail = buildPaymentAcknowledgementEmail({
      companyName: "African Home Adventure",
      guestName: "Jane Doe",
      paymentId: 42,
      amountLabel: "KSh 12,000",
      method: "M-Pesa",
    });
    assert.match(mail.subject, /African Home Adventure/);
    assert.match(mail.text, /Jane Doe/);
    assert.match(mail.text, /KSh 12,000/);
    assert.match(mail.text, /Payment #42/);
    assert.match(mail.text, /M-Pesa/);
    assert.match(mail.html, /KSh 12,000/);
  });

  it("escapes html in guest-facing fields", () => {
    const mail = buildPaymentAcknowledgementEmail({
      companyName: "A & B <Camp>",
      guestName: 'Sam "Guest"',
      paymentId: 1,
      amountLabel: "KES 100",
    });
    assert.match(mail.html, /A &amp; B &lt;Camp&gt;/);
    assert.doesNotMatch(mail.html, /<Camp>/);
  });
});

describe("buildBookingConfirmationEmail", () => {
  it("includes package, travel date, and booking reference", () => {
    const mail = buildBookingConfirmationEmail({
      companyName: "African Home Adventure",
      guestName: "Ada",
      bookingId: 7,
      safariPackage: "Masai Mara 3D2N",
      travelDate: "2026-09-01",
      travellersLabel: "2 adults",
      amountLabel: "KSh 95,000",
    });
    assert.match(mail.subject, /Masai Mara/);
    assert.match(mail.text, /Booking #7/);
    assert.match(mail.text, /2026-09-01/);
    assert.match(mail.text, /2 adults/);
    assert.match(mail.html, /KSh 95,000/);
  });
});

describe("buildEnquiryAcknowledgementEmail", () => {
  it("includes enquiry subject and reference", () => {
    const mail = buildEnquiryAcknowledgementEmail({
      companyName: "African Home Adventure",
      guestName: "Lee",
      enquiryId: 3,
      subject: "Group safari timing",
    });
    assert.match(mail.subject, /enquiry/i);
    assert.match(mail.text, /Enquiry #3/);
    assert.match(mail.text, /Group safari timing/);
    assert.match(mail.html, /Enquiry #3/);
  });
});

describe("buildHotelStayConfirmationEmail", () => {
  it("includes room, dates, nights, and stay reference", () => {
    const mail = buildHotelStayConfirmationEmail({
      companyName: "Bondo Travellers Hotel",
      guestName: "Nora",
      stayId: 15,
      roomLabel: "R12 — Twin",
      checkInDate: "2026-10-01",
      checkOutDate: "2026-10-03",
      nights: 2,
      travellersLabel: "2 adults",
      amountLabel: "KSh 18,000",
    });
    assert.match(mail.subject, /Stay reservation/);
    assert.match(mail.text, /Stay #15/);
    assert.match(mail.text, /R12/);
    assert.match(mail.text, /2026-10-01/);
    assert.match(mail.text, /2 nights/);
    assert.match(mail.html, /KSh 18,000/);
  });
});

describe("buildItineraryGeneratedEmail", () => {
  it("includes destination, itinerary reference, and company name", () => {
    const mail = buildItineraryGeneratedEmail({
      companyName: "African Home Adventure",
      guestName: "Ada",
      itineraryId: 9,
      destination: "Serengeti",
      travelDate: "2026-10-01",
      amountLabel: "KSh 120,000",
      viewUrl: "https://www.africanhomeadventure.com/itineraries/tok",
    });
    assert.match(mail.subject, /Serengeti/);
    assert.match(mail.text, /Itinerary #9/);
    assert.match(mail.text, /African Home Adventure/);
    assert.match(mail.text, /itineraries\/tok/);
    assert.match(mail.html, /KSh 120,000/);
  });
});
