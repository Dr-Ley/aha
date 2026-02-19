import { BookingForm } from "@/components/booking-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Book Your Safari | Africa Home Adventure",
  description:
    "Complete your safari booking with Africa Home Adventure. Secure your East African wildlife adventure today.",
}

export default function BookingPage() {
  return (
    <>
      <section className="bg-primary py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-accent">
            Secure Your Adventure
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-foreground sm:text-4xl text-balance">
            Book Your Safari
          </h1>
          <p className="mt-3 max-w-xl text-primary-foreground/70">
            Fill in your details below and our team will confirm your booking within 24 hours. No
            payment required until confirmation.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <BookingForm />
        </div>
      </section>
    </>
  )
}
