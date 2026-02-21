import { ContactForm } from "@/components/contact-form";
import { Container, Section } from "@/components/layout";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  Award,
  MessageCircle,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | African Home Adventure",
  description:
    "Get in touch with African Home Adventure. Request a custom safari quote, ask questions, or plan your perfect Kenya & Tanzania adventure.",
};

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
];

export default function ContactPage() {
  return (
    <>
      <section className="bg-primary py-16 lg:py-20">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Get in Touch
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl lg:text-5xl">
            Contact Us
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/70">
            Whether you have questions about our safaris, need a custom
            itinerary, or are ready to book, our team is here to help you plan
            the perfect African adventure.
          </p>
        </Container>
      </section>

      <Section variant="secondary">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {contactMethods.map((method) => (
              <div
                key={method.label}
                className="flex flex-col items-start rounded-xl border border-base-content/10 bg-base-100 p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <method.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-base-content">
                  {method.label}
                </h3>
                {method.href ? (
                  <a
                    href={method.href}
                    className="mt-1 break-all text-sm font-medium text-primary hover:underline"
                  >
                    {method.value}
                  </a>
                ) : (
                  <p className="mt-1 text-sm font-medium text-base-content">
                    {method.value}
                  </p>
                )}
                <p className="mt-1 text-xs text-base-content/60">
                  {method.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-3 items-start">
            <div className="lg:col-span-2">
              <h2 className="font-serif text-2xl font-bold text-base-content">
                Send Us a Message
              </h2>
              <p className="mt-2 text-base-content/70">
                Fill in the form below and our safari experts will get back to
                you within 24 hours with a personalized response.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>

            
              <aside className="lg:col-span-1">
                  <div className="sticky top-24 rounded-xl border border-base-content/10 bg-base-100 p-6 shadow-sm">
                    <h3 className="font-serif text-lg font-bold text-base-content mb-4">
                      Why Contact Us?
                    </h3>

                    <div className="mt-5 space-y-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <MessageCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-base-content">
                            Free Custom Quote
                          </p>
                          <p className="text-xs leading-relaxed text-base-content/60">
                            Tell us your dream safari and we will design a
                            personalized itinerary with transparent pricing.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-base-content">
                            Quick Response
                          </p>
                          <p className="text-xs leading-relaxed text-base-content/60">
                            We respond to all inquiries within 24 hours. Urgent
                            requests are handled immediately by phone.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-base-content">
                            KATO Protected
                          </p>
                          <p className="text-xs leading-relaxed text-base-content/60">
                            Your booking is protected under the KATO bonding
                            scheme, guaranteeing your holiday investment.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-base-content">
                            Expert Advice
                          </p>
                          <p className="text-xs leading-relaxed text-base-content/60">
                            Our team has over 25 years of experience and can advise
                            on the best season, destinations, and itinerary for
                            your trip.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sticky mt-6 rounded-xl border border-base-content/10 bg-base-100 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-base-content">
                      Operating Hours
                    </h3>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="text-base-content/60 text-xs">Monday - Friday</span>
                        <span className="font-medium text-xs text-base-content">
                          8:00 AM - 6:00 PM
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-base-content/60 text-xs">Saturday</span>
                        <span className="font-medium text-xs text-base-content">
                          9:00 AM - 4:00 PM
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-base-content/60 text-xs">Sunday</span>
                        <span className="font-medium text-xs text-base-content">
                          Emergency only
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-base-content/60">
                      All times are East Africa Time (EAT, UTC+3)
                    </p>
                  </div>
              </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
