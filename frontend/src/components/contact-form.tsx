"use client"

import { useState } from "react"
import { Check, Send, Phone, Mail } from "lucide-react"

const subjects = [
  "General Inquiry",
  "Custom Safari Quote",
  "Booking Question",
  "Group Safari Inquiry",
  "4x4 Vehicle Hire",
  "Partnership Inquiry",
]

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-base-content/10 bg-base-100 py-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Check className="h-7 w-7 text-primary" />
        </div>
        <h3 className="font-serif text-xl font-bold text-base-content">Message Sent!</h3>
        <p className="mt-2 text-sm text-base-content/70">
          Thank you for reaching out. Our team will get back to you within 24 hours at{" "}
          <strong className="text-base-content">{form.email}</strong>.
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-base-content/60">
          <a href="tel:+254722760661" className="flex items-center gap-2 hover:text-base-content transition-colors">
            <Phone className="h-4 w-4" /> Call Us Now
          </a>
          <a
            href="mailto:info@africahomeadventure.com"
            className="flex items-center gap-2 hover:text-base-content transition-colors"
          >
            <Mail className="h-4 w-4" /> Email Us
          </a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Removed mb-3, using space-y-5 from parent */}
      <div className="grid gap-4 sm:grid-cols-2 mb-3">
        <div className="form-control">
          <label className="label mb-2" htmlFor="contact-firstName">
            <span className="label-text">First Name</span>
          </label>
          <input
            id="contact-firstName"
            type="text"
            className="input input-bordered w-full"
            style={{ outline: "1px solid gray" }}
            placeholder="John"
            required
            value={form.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label mb-2" htmlFor="contact-lastName">
            <span className="label-text">Last Name</span>
          </label>
          <input
            id="contact-lastName"
            type="text"
            className="input input-bordered w-full"
            placeholder="Smith"
            style={{ outline: "1px solid gray" }}
            value={form.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
          />
        </div>
      </div>

      {/* Removed mb-3 */}
      <div className="grid gap-4 sm:grid-cols-2 mb-3">
        <div className="form-control">
          <label className="label mb-2" htmlFor="contact-email">
            <span className="label-text">Email Address</span>
          </label>
          <input
            id="contact-email"
            type="email"
            className="input input-bordered w-full"
            placeholder="john@example.com"
            style={{ outline: "1px solid gray" }}
            required
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label mb-2" htmlFor="contact-phone">
            <span className="label-text">Phone Number (optional)</span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            className="input input-bordered w-full"
            style={{ outline: "1px solid gray" }}
            placeholder="+1 234 567 890"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>
      </div>


      <div className="form-control mb-3">
        <label className="label mb-2" htmlFor="contact-subject">
          <span className="label-text">Subject</span>
        </label>
        <select
          id="contact-subject"
          className="select select-bordered w-full"
          value={form.subject}
          style={{ outline: "1px solid gray" }}
          onChange={(e) => updateField("subject", e.target.value)}
          required
        >
          <option value="" disabled>
            What is your inquiry about?
          </option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>


      <div className="form-control mb-3">
        <label className="label mb-2" htmlFor="contact-message">
          <span className="label-text">Your Message</span>
        </label>
        <textarea
          id="contact-message"
          className="textarea textarea-bordered w-full px-2 py-2"
          rows={5}
          placeholder="Tell us about your dream safari, preferred travel dates, group size, budget, or any questions you have..."
          required
          style={{ outline: "1px solid gray" }}
          value={form.message}
          onChange={(e) => updateField("message", e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={!form.firstName || !form.email || !form.subject || !form.message}
      >
        Send Message <Send className="ml-2 h-4 w-4" />
      </button>
    </form>
  )
}