"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronRight,
  Shield,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
} from "lucide-react";
import { tours } from "@/lib/data";

const steps = [
  { id: 1, label: "Trip Details" },
  { id: 2, label: "Personal Info" },
  { id: 3, label: "Review & Confirm" },
];

export function BookingForm() {
  const searchParams = useSearchParams();
  const preselectedTour = searchParams?.get("tour") ?? "";

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    tour: preselectedTour,
    travelDate: "",
    guests: "2",
    accommodation: "mid-range",
    transport: "4x4-landcruiser",
    specialRequests: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
  });

  useEffect(() => {
    if (preselectedTour) setForm((prev) => ({ ...prev, tour: preselectedTour }));
  }, [preselectedTour]);

  const selectedTour = tours.find((t) => t.slug === form.tour);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-16 rounded-lg border border-base-content/10 bg-base-100 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-base-content">
          Booking Request Received!
        </h2>
        <p className="mt-4 leading-relaxed text-base-content/70">
          Thank you, {form.firstName}! Our team will review your booking request
          and get back to you within 24 hours at{" "}
          <strong className="text-base-content">{form.email}</strong> with a
          detailed confirmation and payment instructions.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-base-content/60">
          <a
            href="tel:+254722760661"
            className="flex items-center gap-2 transition-colors hover:text-base-content"
          >
            <Phone className="h-4 w-4" /> Call Us Now
          </a>
          <a
            href="mailto:info@africahomeadventure.com"
            className="flex items-center gap-2 transition-colors hover:text-base-content"
          >
            <Mail className="h-4 w-4" /> Email Us
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  step >= s.id
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 text-base-content/60"
                }`}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span
                className={`hidden text-sm sm:inline ${
                  step >= s.id ? "font-medium text-base-content" : "text-base-content/60"
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="mx-1 h-4 w-4 text-base-content/40" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Trip Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-base-content">
                Trip Details
              </h2>
              <p className="mt-1 text-sm text-base-content/60 mb-4">
                Select your tour, dates, and preferences.
              </p>
            </div>

            <div className="space-y-4">
              <div className="form-control">
                <label htmlFor="tour" className="label">
                  <span className="label-text mb-2">Safari Tour</span>
                </label>
                <select
                  id="tour"
                  className="select select-bordered w-full"
                  style={{ outline: "1px solid gray" }}
                  value={form.tour}
                  onChange={(e) => updateField("tour", e.target.value)}
                >
                  <option value="">Select a safari tour</option>
                  {tours.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.title} — ${t.price}/pp
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="form-control">
                  <label htmlFor="travelDate" className="label">
                    <span className="label-text mb-2">Preferred Travel Date</span>
                  </label>
                  <input
                    id="travelDate"
                    type="date"
                    className="input input-bordered w-full"
                    style={{ outline: "1px solid gray" }}
                    value={form.travelDate}
                    onChange={(e) => updateField("travelDate", e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label htmlFor="guests" className="label">
                    <span className="label-text mb-2">Number of Guests</span>
                  </label>
                  <select
                    id="guests"
                    className="select select-bordered w-full"
                    value={form.guests}
                    style={{ outline: "1px solid gray" }}
                    onChange={(e) => updateField("guests", e.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={String(n)}>
                        {n} {n === 1 ? "Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="form-control">
                  <label htmlFor="accommodation" className="label">
                    <span className="label-text mb-2">Accommodation Preference</span>
                  </label>
                  <select
                    id="accommodation"
                    className="select select-bordered w-full"
                    style={{ outline: "1px solid gray" }}
                    value={form.accommodation}
                    onChange={(e) => updateField("accommodation", e.target.value)}
                  >
                    <option value="budget">Budget (Tented Camps)</option>
                    <option value="mid-range">Mid-Range (Lodges)</option>
                    <option value="luxury">Luxury (Premium Lodges)</option>
                  </select>
                </div>
                <div className="form-control">
                  <label htmlFor="transport" className="label">
                    <span className="label-text mb-2">Transport Type</span>
                  </label>
                  <select
                    id="transport"
                    className="select select-bordered w-full"
                    style={{ outline: "1px solid gray" }}
                    value={form.transport}
                    onChange={(e) => updateField("transport", e.target.value)}
                  >
                    <option value="4x4-landcruiser">
                      4x4 Land Cruiser (Recommended)
                    </option>
                    <option value="safari-van">Safari Van (Budget)</option>
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label htmlFor="specialRequests" className="label">
                  <span className="label-text mb-2">
                    Special Requests or Questions
                  </span>
                </label>
                <textarea
                  id="specialRequests"
                  className="textarea textarea-bordered px-2 py-2 h-24 w-full"
                  style={{ outline: "1px solid gray" }}
                  placeholder="Any dietary requirements, celebrations, accessibility needs, or custom itinerary requests..."
                  value={form.specialRequests}
                  onChange={(e) => updateField("specialRequests", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-primary mt-2 gap-2"
                disabled={!form.tour || !form.travelDate}
                onClick={() => setStep(2)}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Personal Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-base-content">
                Personal Information
              </h2>
              <p className="mt-1 text-sm text-base-content/60 mb-4">
                Tell us about yourself so we can confirm your booking.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="form-control">
                  <label htmlFor="firstName" className="label">
                    <span className="label-text mb-2">First Name</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="John"
                    style={{ outline: "1px solid gray" }}
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label htmlFor="lastName" className="label">
                    <span className="label-text mb-2">Last Name</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className="input input-bordered w-full"
                    style={{ outline: "1px solid gray" }}
                    placeholder="Smith"
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-control">
                <label htmlFor="email" className="label">
                  <span className="label-text mb-2">Email Address</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="input input-bordered w-full"
                  placeholder="john@example.com"
                  style={{ outline: "1px solid gray" }}
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="form-control">
                  <label htmlFor="phone" className="label">
                    <span className="label-text mb-2">Phone Number</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className="input input-bordered w-full"
                    style={{ outline: "1px solid gray" }}
                    placeholder="+1 234 567 890"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label htmlFor="country" className="label">
                    <span className="label-text mb-2">Country of Residence</span>
                  </label>
                  <input
                    id="country"
                    type="text"
                    className="input input-bordered w-full"
                    style={{ outline: "1px solid gray" }}
                    placeholder="United Kingdom"
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button
                type="button"
                className="btn btn-outline gap-2"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                className="btn btn-primary gap-2"
                disabled={!form.firstName || !form.email || !form.phone}
                onClick={() => setStep(3)}
              >
                Review Booking <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-base-content">
                Review Your Booking
              </h2>
              <p className="mt-1 text-sm text-base-content/60 mb-4">
                Please review the details below before submitting. No payment is
                taken now.
              </p>
            </div>

            <div className="rounded-xl border border-base-content/10 bg-base-100 divide-y divide-base-content/10 mb-4">
              <div className="p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Trip Details
                </h3>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-base-content/60">Safari</dt>
                    <dd className="font-medium text-base-content">
                      {selectedTour?.title ?? form.tour}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-base-content/60">Travel Date</dt>
                    <dd className="font-medium text-base-content">
                      {form.travelDate}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-base-content/60">Guests</dt>
                    <dd className="font-medium text-base-content">
                      {form.guests}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-base-content/60">Accommodation</dt>
                    <dd className="font-medium capitalize text-base-content">
                      {form.accommodation.replace("-", " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-base-content/60">Transport</dt>
                    <dd className="font-medium capitalize text-base-content">
                      {form.transport.replace(/-/g, " ")}
                    </dd>
                  </div>
                  {form.specialRequests && (
                    <div className="sm:col-span-2">
                      <dt className="text-base-content/60">Special Requests</dt>
                      <dd className="font-medium text-base-content">
                        {form.specialRequests}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Contact Information
                </h3>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-base-content/60">Name</dt>
                    <dd className="font-medium text-base-content">
                      {form.firstName} {form.lastName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-base-content/60">Email</dt>
                    <dd className="font-medium text-base-content">
                      {form.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-base-content/60">Phone</dt>
                    <dd className="font-medium text-base-content">
                      {form.phone}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-base-content/60">Country</dt>
                    <dd className="font-medium text-base-content">
                      {form.country}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {selectedTour && (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
                <h3 className="text-sm font-semibold text-base-content">
                  Estimated Price
                </h3>
                <p className="mt-1 text-2xl font-bold text-base-content">
                  ${selectedTour.price * Number(form.guests)}
                  <span className="text-sm font-normal text-base-content/60">
                    {" "}
                    (${selectedTour.price} x {form.guests} guests)
                  </span>
                </p>
                <p className="mt-1 text-xs text-base-content/60">
                  Final price will be confirmed by our team based on
                  accommodation and date selection.
                </p>
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button
                type="button"
                className="btn btn-outline gap-2"
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                className="btn btn-primary gap-2"
                onClick={handleSubmit}
              >
                Submit Booking Request <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="lg:col-span-1">
        <div className="sticky top-24 rounded-xl border border-base-content/10 bg-base-100 p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-base-content">
            Booking Summary
          </h3>

          {selectedTour ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="font-semibold text-base-content">
                {selectedTour.title}
              </p>
              <p className="text-base-content/60">{selectedTour.duration}</p>
              <div className="divider my-2" />
              <div className="flex justify-between">
                <span className="text-base-content/60">Price per person</span>
                <span className="font-semibold text-base-content">
                  ${selectedTour.price}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Guests</span>
                <span className="font-semibold text-base-content">
                  {form.guests}
                </span>
              </div>
              <div className="divider my-2" />
              <div className="flex justify-between text-base">
                <span className="font-semibold text-base-content">
                  Estimated Total
                </span>
                <span className="font-bold text-base-content">
                  ${selectedTour.price * Number(form.guests)}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-base-content/60">
              Select a tour to see pricing details.
            </p>
          )}

          <div className="divider" />

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-base-content/60">
              <Shield className="h-4 w-4 text-primary" />
              No payment required now
            </div>
            <div className="flex items-center gap-2 text-base-content/60">
              <Check className="h-4 w-4 text-primary" />
              Confirmation within 24 hours
            </div>
            <div className="flex items-center gap-2 text-base-content/60">
              <Check className="h-4 w-4 text-primary" />
              Free cancellation up to 30 days
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
