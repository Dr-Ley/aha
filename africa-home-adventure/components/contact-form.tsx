"use client"

import { useState } from "react"
import { Check, Send, Phone, Mail } from "lucide-react"
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
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Check className="h-7 w-7 text-primary" />
        </div>
        <h3 className="font-serif text-xl font-bold text-card-foreground">Message Sent!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for reaching out. Our team will get back to you within 24 hours at{" "}
          <strong className="text-card-foreground">{form.email}</strong>.
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <a href="tel:+254722760661" className="flex items-center gap-2 hover:text-foreground transition-colors">
            <Phone className="h-4 w-4" /> Call Us Now
          </a>
          <a
            href="mailto:info@africahomeadventure.com"
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Mail className="h-4 w-4" /> Email Us
          </a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-firstName">First Name</Label>
          <Input
            id="contact-firstName"
            className="mt-1.5"
            placeholder="John"
            required
            value={form.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="contact-lastName">Last Name</Label>
          <Input
            id="contact-lastName"
            className="mt-1.5"
            placeholder="Smith"
            value={form.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-email">Email Address</Label>
          <Input
            id="contact-email"
            type="email"
            className="mt-1.5"
            placeholder="john@example.com"
            required
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="contact-phone">Phone Number (optional)</Label>
          <Input
            id="contact-phone"
            type="tel"
            className="mt-1.5"
            placeholder="+1 234 567 890"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="contact-subject">Subject</Label>
        <Select value={form.subject} onValueChange={(v) => updateField("subject", v)} required>
          <SelectTrigger id="contact-subject" className="mt-1.5">
            <SelectValue placeholder="What is your inquiry about?" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="contact-message">Your Message</Label>
        <Textarea
          id="contact-message"
          className="mt-1.5"
          rows={5}
          placeholder="Tell us about your dream safari, preferred travel dates, group size, budget, or any questions you have..."
          required
          value={form.message}
          onChange={(e) => updateField("message", e.target.value)}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={!form.firstName || !form.email || !form.subject || !form.message}
      >
        Send Message <Send className="ml-2 h-4 w-4" />
      </Button>
    </form>
  )
}
