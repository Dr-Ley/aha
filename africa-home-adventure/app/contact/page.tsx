import { ContactForm } from "@/components/contact-form"
import { Phone, Mail, MapPin, Clock, Shield, Award, MessageCircle } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us | Africa Home Adventure",
  description:
    "Get in touch with Africa Home Adventure. Request a custom safari quote, ask questions, or plan your perfect Kenya & Tanzania adventure.",
}

const contactMethods = [
  {
    icon: Phone,
    label: "Phone",
    value: "+254 722 760 661",
    href: "tel:+254722760661",
    description: "Call us directly for immediate assistance",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@africahomeadventure.com",
    href: "mailto:info@africahomeadventure.com",
    description: "We respond within 24 hours",
  },
  {
    icon: MapPin,
    label: "Nairobi Office",
    value: "Nairobi, Kenya",
    href: undefined,
    description: "Headquarters & main booking center",
  },
  {
    icon: MapPin,
    label: "Arusha Office",
    value: "Arusha, Tanzania",
    href: undefined,
    description: "Tanzania operations base",
  },
]

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
        <section className="bg-primary py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <p className="text-xs font-semibold tracking-widest uppercase text-accent">
              Get in Touch
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl text-balance">
              Contact Us
            </h1>
            <p className="mt-4 max-w-2xl text-primary-foreground/70 leading-relaxed">
              Whether you have questions about our safaris, need a custom itinerary, or are ready to
              book, our team is here to help you plan the perfect African adventure.
            </p>
          </div>
        </section>

        {/* Contact methods */}
        <section className="py-12 lg:py-16 bg-secondary">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {contactMethods.map((method) => (
                <div
                  key={method.label}
                  className="flex flex-col items-start rounded-lg bg-card border border-border p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <method.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-card-foreground">
                    {method.label}
                  </h3>
                  {method.href ? (
                    <a
                      href={method.href}
                      className="mt-1 text-sm font-medium text-primary hover:underline break-all"
                    >
                      {method.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-card-foreground">{method.value}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{method.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form + Info */}
        <section className="py-12 lg:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 lg:grid-cols-5">
              {/* Form */}
              <div className="lg:col-span-3">
                <h2 className="font-serif text-2xl font-bold text-foreground">
                  Send Us a Message
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Fill in the form below and our safari experts will get back to you within 24
                  hours with a personalized response.
                </p>
                <div className="mt-8">
                  <ContactForm />
                </div>
              </div>

              {/* Sidebar info */}
              <aside className="lg:col-span-2">
                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="font-serif text-lg font-bold text-card-foreground">
                    Why Contact Us?
                  </h3>

                  <div className="mt-5 space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MessageCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">
                          Free Custom Quote
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Tell us your dream safari and we will design a personalized itinerary with
                          transparent pricing.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">
                          Quick Response
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          We respond to all inquiries within 24 hours. Urgent requests are handled
                          immediately by phone.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">
                          KATO Protected
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Your booking is protected under the KATO bonding scheme, guaranteeing
                          your holiday investment.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Award className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">
                          Expert Advice
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Our team has over 25 years of experience and can advise on the best
                          season, destinations, and itinerary for your trip.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operating hours */}
                <div className="mt-6 rounded-lg border border-border bg-card p-6">
                  <h3 className="text-sm font-semibold text-card-foreground">Operating Hours</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monday - Friday</span>
                      <span className="font-medium text-card-foreground">8:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saturday</span>
                      <span className="font-medium text-card-foreground">9:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sunday</span>
                      <span className="font-medium text-card-foreground">
                        Emergency only
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    All times are East Africa Time (EAT, UTC+3)
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>
    </>
  )
}
