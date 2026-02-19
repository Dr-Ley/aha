import Link from "next/link"
import { Phone, Mail, MapPin, Shield, Award, Users } from "lucide-react"

const safariLinks = [
  { label: "3-Day Masai Mara Safari", href: "/tours/3-day-masai-mara-safari" },
  { label: "5-Day Nakuru & Masai Mara", href: "/tours/5-day-nakuru-naivasha-masai-mara" },
  { label: "3-Day Amboseli Safari", href: "/tours/3-day-amboseli-safari" },
  { label: "6-Day Serengeti & Masai Mara", href: "/tours/6-day-serengeti-ngorongoro-masai-mara" },
  { label: "8-Day Kenya & Tanzania", href: "/tours/8-day-kenya-tanzania-combined" },
]

const companyLinks = [
  { label: "About Us", href: "/contact" },
  { label: "All Safaris", href: "/tours" },
  { label: "Contact Us", href: "/contact" },
  { label: "Get a Quote", href: "/contact" },
]

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Trust badges */}
      <div className="border-b border-primary-foreground/10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-10 sm:grid-cols-3">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">KATO Certified</p>
              <p className="text-xs text-primary-foreground/60">
                Member FE/459 bonding scheme protection
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Licensed Operator</p>
              <p className="text-xs text-primary-foreground/60">
                Ministry of Tourism & Wildlife registered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">25+ Years Experience</p>
              <p className="text-xs text-primary-foreground/60">
                Thousands of happy clients worldwide
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 font-serif text-lg font-bold">
                A
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold leading-tight">Africa Home</span>
                <span className="text-xs tracking-widest uppercase text-primary-foreground/60">
                  Adventure
                </span>
              </div>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
              Fully registered and licensed by the Ministry of Tourism and Wildlife. Creating
              unforgettable safari experiences in Kenya and Tanzania since 1998.
            </p>
          </div>

          {/* Safari Links */}
          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-widest uppercase text-primary-foreground/50">
              Popular Safaris
            </h3>
            <ul className="flex flex-col gap-2.5">
              {safariLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-widest uppercase text-primary-foreground/50">
              Company
            </h3>
            <ul className="flex flex-col gap-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-widest uppercase text-primary-foreground/50">
              Get in Touch
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="tel:+254722760661"
                className="flex items-center gap-3 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
              >
                <Phone className="h-4 w-4 shrink-0" />
                +254 722 760 661
              </a>
              <a
                href="mailto:info@africahomeadventure.com"
                className="flex items-center gap-3 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
              >
                <Mail className="h-4 w-4 shrink-0" />
                info@africahomeadventure.com
              </a>
              <div className="flex items-start gap-3 text-sm text-primary-foreground/70">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Nairobi, Kenya & Arusha, Tanzania</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 sm:flex-row">
          <p className="text-xs text-primary-foreground/50">
            &copy; {new Date().getFullYear()} Africa Home Adventure Safaris. All rights reserved.
          </p>
          <p className="text-xs text-primary-foreground/50">
            Kenya Association of Tour Operators (KATO) Member
          </p>
        </div>
      </div>
    </footer>
  )
}
