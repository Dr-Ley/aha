"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Check,
  ChevronRight,
  Shield,
  User,
  Calendar,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { tours } from "@/lib/data"

const steps = [
  { id: 1, label: "Trip Details", icon: Calendar },
  { id: 2, label: "Personal Info", icon: User },
  { id: 3, label: "Review & Confirm", icon: CreditCard },
]

export function BookingForm() {
  const searchParams = useSearchParams()
  const preselectedTour = searchParams.get("tour") || ""

  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)

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
  })

  const selectedTour = tours.find((t) => t.slug === form.tour)

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg text-center py-16">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Booking Request Received!
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Thank you, {form.firstName}! Our team will review your booking request and get back to
          you within 24 hours at <strong className="text-foreground">{form.email}</strong> with a
          detailed confirmation and payment instructions.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <a href="tel:+254722760661" className="flex items-center gap-2 hover:text-foreground transition-colors">
            <Phone className="h-4 w-4" /> +254 722 760 661
          </a>
          <a
            href="mailto:info@africahomeadventure.com"
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Mail className="h-4 w-4" /> info@africahomeadventure.com
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      {/* Form */}
      <div className="lg:col-span-2">
        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  step >= s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span
                className={`hidden text-sm sm:inline ${
                  step >= s.id ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Trip Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">Trip Details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select your tour, dates, and preferences.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="tour">Safari Tour</Label>
                <Select value={form.tour} onValueChange={(v) => updateField("tour", v)}>
                  <SelectTrigger id="tour" className="mt-1.5">
                    <SelectValue placeholder="Select a safari tour" />
                  </SelectTrigger>
                  <SelectContent>
                    {tours.map((t) => (
                      <SelectItem key={t.slug} value={t.slug}>
                        {t.title} — ${t.price}/pp
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="travelDate">Preferred Travel Date</Label>
                  <Input
                    id="travelDate"
                    type="date"
                    className="mt-1.5"
                    value={form.travelDate}
                    onChange={(e) => updateField("travelDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="guests">Number of Guests</Label>
                  <Select value={form.guests} onValueChange={(v) => updateField("guests", v)}>
                    <SelectTrigger id="guests" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} {n === 1 ? "Guest" : "Guests"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="accommodation">Accommodation Preference</Label>
                  <Select
                    value={form.accommodation}
                    onValueChange={(v) => updateField("accommodation", v)}
                  >
                    <SelectTrigger id="accommodation" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget (Tented Camps)</SelectItem>
                      <SelectItem value="mid-range">Mid-Range (Lodges)</SelectItem>
                      <SelectItem value="luxury">Luxury (Premium Lodges)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="transport">Transport Type</Label>
                  <Select
                    value={form.transport}
                    onValueChange={(v) => updateField("transport", v)}
                  >
                    <SelectTrigger id="transport" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4x4-landcruiser">4x4 Land Cruiser (Recommended)</SelectItem>
                      <SelectItem value="safari-van">Safari Van (Budget)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="specialRequests">Special Requests or Questions</Label>
                <Textarea
                  id="specialRequests"
                  className="mt-1.5"
                  rows={3}
                  placeholder="Any dietary requirements, celebrations, accessibility needs, or custom itinerary requests..."
                  value={form.specialRequests}
                  onChange={(e) => updateField("specialRequests", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!form.tour || !form.travelDate}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Personal Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">
                Personal Information
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us about yourself so we can confirm your booking.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    className="mt-1.5"
                    placeholder="John"
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    className="mt-1.5"
                    placeholder="Smith"
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  className="mt-1.5"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    className="mt-1.5"
                    placeholder="+1 234 567 890"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country of Residence</Label>
                  <Input
                    id="country"
                    className="mt-1.5"
                    placeholder="United Kingdom"
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!form.firstName || !form.email || !form.phone}
              >
                Review Booking <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">
                Review Your Booking
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Please review the details below before submitting. No payment is taken now.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card divide-y divide-border">
              <div className="p-5">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                  Trip Details
                </h3>
                <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Safari</dt>
                    <dd className="font-medium text-card-foreground">
                      {selectedTour?.title || form.tour}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Travel Date</dt>
                    <dd className="font-medium text-card-foreground">{form.travelDate}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Guests</dt>
                    <dd className="font-medium text-card-foreground">{form.guests}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Accommodation</dt>
                    <dd className="font-medium text-card-foreground capitalize">
                      {form.accommodation.replace("-", " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Transport</dt>
                    <dd className="font-medium text-card-foreground capitalize">
                      {form.transport.replace(/-/g, " ")}
                    </dd>
                  </div>
                  {form.specialRequests && (
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">Special Requests</dt>
                      <dd className="font-medium text-card-foreground">{form.specialRequests}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="p-5">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                  Contact Information
                </h3>
                <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium text-card-foreground">
                      {form.firstName} {form.lastName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-medium text-card-foreground">{form.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium text-card-foreground">{form.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Country</dt>
                    <dd className="font-medium text-card-foreground">{form.country}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {selectedTour && (
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-5">
                <h3 className="text-sm font-semibold text-foreground">Estimated Price</h3>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  ${selectedTour.price * Number(form.guests)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    (${selectedTour.price} x {form.guests} guests)
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Final price will be confirmed by our team based on accommodation and date
                  selection.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button size="lg" onClick={handleSubmit}>
                Submit Booking Request <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="lg:col-span-1">
        <div className="sticky top-24 rounded-lg border border-border bg-card p-6">
          <h3 className="font-serif text-lg font-bold text-card-foreground">Booking Summary</h3>

          {selectedTour ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="font-semibold text-card-foreground">{selectedTour.title}</p>
              <p className="text-muted-foreground">{selectedTour.duration}</p>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price per person</span>
                <span className="font-semibold text-card-foreground">${selectedTour.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guests</span>
                <span className="font-semibold text-card-foreground">{form.guests}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-semibold text-card-foreground">Estimated Total</span>
                <span className="font-bold text-foreground">
                  ${selectedTour.price * Number(form.guests)}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Select a tour to see pricing details.
            </p>
          )}

          <Separator className="my-5" />

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              No payment required now
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              Confirmation within 24 hours
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              Free cancellation up to 30 days
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
