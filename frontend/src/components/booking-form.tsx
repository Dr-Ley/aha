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
  Loader2,
} from "lucide-react";
import { usdToWholeInCurrency } from "@/lib/data";
import type { Tour } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { useCurrency, CurrencyFormSelect } from "@/lib/currency-context";
import {
  normalizeTravellerCounts,
  travellerCountsLabel,
  travellerHeadcount,
} from "@/lib/travellers";
import { priceLineLabel, quoteTourSafariPackage } from "@/lib/pricing";

const steps = [
  { id: 1, label: "Trip Details" },
  { id: 2, label: "Personal Info" },
  { id: 3, label: "Review & Confirm" },
];

export function BookingForm() {
  const searchParams = useSearchParams();
  const preselectedTour = searchParams?.get("tour") ?? "";
  const { user } = useAuth();
  const { formatPrice, formatMoney, currency, setCurrency } = useCurrency();

  const [tours, setTours] = useState<Tour[]>([]);
  const [toursLoading, setToursLoading] = useState(true);

  useEffect(() => {
    async function fetchTours() {
      try {
        const response = await fetch("/api/tours?companyId=aha");
        const data = await response.json();
        if (Array.isArray(data)) setTours(data);
      } catch {
        /* tours dropdown stays empty on failure */
      } finally {
        setToursLoading(false);
      }
    }
    void fetchTours();
  }, []);

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  const [form, setForm] = useState({
    tour: preselectedTour,
    travelDate: "",
    adults: "2",
    children: "0",
    infants: "0",
    accommodation: "mid-range",
    transport: "4x4-landcruiser",
    specialRequests: "",
    firstName: user?.name?.split(" ")[0] ?? "",
    lastName: user?.name?.split(" ").slice(1).join(" ") ?? "",
    email: user?.email ?? "",
    phone: "",
    country: "",
  });

  useEffect(() => {
    if (preselectedTour) setForm((prev) => ({ ...prev, tour: preselectedTour }));
  }, [preselectedTour]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        firstName: user.name?.split(" ")[0] ?? prev.firstName,
        lastName: user.name?.split(" ").slice(1).join(" ") ?? prev.lastName,
        email: user.email ?? prev.email,
      }));
    }
  }, [user]);

  const selectedTour = tours.find((t) => t.slug === form.tour);
  const travellerCounts = normalizeTravellerCounts({
    adults: Number(form.adults),
    children: Number(form.children),
    infants: Number(form.infants),
  });
  const travellerLabel = travellerCountsLabel(travellerCounts);
  const quote = selectedTour
    ? quoteTourSafariPackage(selectedTour, travellerCounts, currency)
    : null;

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      if (travellerHeadcount(travellerCounts) < 1) {
        setError("Add at least one adult, child, or infant.");
        setLoading(false);
        return;
      }
      const originalPricePerPerson =
        quote?.lines.find((line) => line.kind === "adult")?.unitAmount ??
        (selectedTour ? usdToWholeInCurrency(selectedTour.price, currency) : 0);
      const originalTotal = quote?.sellingPrice ?? 0;
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourSlug: form.tour,
          companyId: "aha",
          travelDate: form.travelDate,
          guests: Math.max(1, travellerHeadcount(travellerCounts)),
          adults: travellerCounts.adults,
          children: travellerCounts.children,
          infants: travellerCounts.infants,
          accommodation: form.accommodation,
          transport: form.transport,
          specialRequests: form.specialRequests || null,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || null,
          country: form.country || null,
          originalCurrency: currency,
          originalAmount: originalTotal,
          pricePerPerson: originalPricePerPerson,
          totalPrice: originalTotal,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBookingRef(
          data.booking?.id
            ? `BK-${String(data.booking.id).padStart(6, "0")}`
            : null
        );
        setSubmitted(true);
      } else {
        setError(data.error ?? "Failed to submit booking");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
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
          and get back to you within 2 hours at{" "}
          <strong className="text-base-content">{form.email}</strong> with a
          detailed confirmation and payment instructions.
        </p>
        {bookingRef && (
          <p className="mt-2 text-sm text-base-content/60">
            Booking Reference: #{bookingRef}
          </p>
        )}
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
                  disabled={toursLoading}
                >
                  <option value="">
                    {toursLoading ? "Loading tours..." : "Select a safari tour"}
                  </option>
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
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="form-control">
                  <label htmlFor="adults" className="label">
                    <span className="label-text mb-2">Adults</span>
                  </label>
                  <input
                    id="adults"
                    type="number"
                    min={0}
                    max={99}
                    className="input input-bordered w-full"
                    style={{ outline: "1px solid gray" }}
                    value={form.adults}
                    onChange={(e) => updateField("adults", e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label htmlFor="children" className="label">
                    <span className="label-text mb-2">Children</span>
                  </label>
                  <input
                    id="children"
                    type="number"
                    min={0}
                    max={99}
                    className="input input-bordered w-full"
                    style={{ outline: "1px solid gray" }}
                    value={form.children}
                    onChange={(e) => updateField("children", e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label htmlFor="infants" className="label">
                    <span className="label-text mb-2">Infants</span>
                  </label>
                  <input
                    id="infants"
                    type="number"
                    min={0}
                    max={99}
                    className="input input-bordered w-full"
                    style={{ outline: "1px solid gray" }}
                    value={form.infants}
                    onChange={(e) => updateField("infants", e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-base-content/60">
                Adult, child, and infant rates come from the tour. Infants are complimentary unless a rate is set. Estimated totals round up to the nearest 10.
              </p>

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
                    <dt className="text-base-content/60">Travellers</dt>
                    <dd className="font-medium text-base-content">
                      {travellerLabel}
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

            {selectedTour && quote ? (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
                <h3 className="text-sm font-semibold text-base-content">
                  Estimated Price
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-base-content/70">
                  {quote.lines.map((line) => (
                    <li key={line.kind} className="flex justify-between gap-3">
                      <span>{priceLineLabel(line)}</span>
                      <span>{formatMoney(line.amount, quote.currency)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-2xl font-bold text-base-content">
                  {formatMoney(quote.sellingPrice, quote.currency)}
                </p>
                {quote.roundedUpBy > 0 ? (
                  <p className="mt-1 text-xs text-base-content/60">
                    Rounded up from {formatMoney(quote.subtotal, quote.currency)} to the nearest 10.
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-base-content/60">
                  Final price will be confirmed by our team based on
                  accommodation and date selection.
                </p>
              </div>
            ) : null}

            {error && (
              <div className="rounded-lg bg-error/10 p-3 text-sm text-error">
                {error}
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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit Booking Request <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="lg:col-span-1">
        <div className="sticky top-24 rounded-xl border border-base-content/10 bg-base-100 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-serif text-lg font-bold text-base-content">Booking Summary</h3>
            <CurrencyFormSelect
              value={currency}
              onChange={setCurrency}
              className="select select-bordered select-sm w-[100px]"
              style={{ outline: "1px solid gray" }}
              aria-label="Display currency"
            />
          </div>

          {selectedTour ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="font-semibold text-base-content">
                {selectedTour.title}
              </p>
              <p className="text-base-content/60">{selectedTour.duration}</p>
              <div className="divider my-2" />
              <div className="flex justify-between">
                <span className="text-base-content/60">Adult rate</span>
                <span className="font-semibold text-base-content">
                  {formatPrice(selectedTour.price)}
                </span>
              </div>
              {quote
                ? quote.lines.map((line) => (
                    <div key={line.kind} className="flex justify-between">
                      <span className="text-base-content/60">{priceLineLabel(line)}</span>
                      <span className="font-semibold text-base-content">
                        {formatMoney(line.amount, quote.currency)}
                      </span>
                    </div>
                  ))
                : (
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Travellers</span>
                      <span className="font-semibold text-base-content">
                        {travellerLabel}
                      </span>
                    </div>
                  )}
              <div className="divider my-2" />
              <div className="flex justify-between text-base">
                <span className="font-semibold text-base-content">
                  Estimated Total
                </span>
                <span className="font-bold text-base-content">
                  {quote
                    ? formatMoney(quote.sellingPrice, quote.currency)
                    : formatPrice(selectedTour.price)}
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
              Confirmation within 2 hours
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
