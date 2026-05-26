import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { ExternalLink } from "lucide-react";

const safariLinks = [
  { label: "3-Day Masai Mara Safari", href: "/tours/3-day-masai-mara-safari" },
  { label: "5-Day Nakuru & Masai Mara", href: "/tours/5-day-nakuru-naivasha-masai-mara" },
  { label: "3-Day Amboseli Safari", href: "/tours/3-day-amboseli-safari" },
  { label: "6-Day Serengeti & Masai Mara", href: "/tours/6-day-serengeti-ngorongoro-masai-mara" },
  { label: "8-Day Kenya & Tanzania", href: "/tours/8-day-kenya-tanzania-combined" },
];

const companyLinks = [
  { label: "Blogs", href: "/blogs" },
  { label: "Volunteering", href: "https://www.kvcdp.org/index.html" },
  { label: "Contact Us", href: "/contact" },
  { label: "Get a Quote", href: "/contact" },
];

const partnerLogos = [
  { src: "/AHA_logo.png", alt: "African Home Adventure" },
  { src: "/yourafricansafari.svg", alt: "Your African Safari" },
  { src: "/kvcdp.png", alt: "KVCDP" },
  { src: "/kato.png", alt: "KATO bonded member" },
  { src: "/tripadvisorpartner.png", alt: "Tripadvisor" },
  { src: "/Logo-TRA.png", alt: "Tourism Regulatory Authority" },
  { src: "/award.png", alt: "Travel award" },
];

// Helper to detect external links
const isExternal = (href: string) => href.startsWith("http");

export function Footer() {
  return (
    <footer className="bg-primary text-primary-content">
      {/* Partner logos */}
      <div className="overflow-hidden border-b border-base-content/10 bg-white py-6 text-base-content">
        <div className="mb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
            Trusted Partners & Certifications
          </p>
        </div>
        <div className="partner-logo-marquee flex w-max items-center gap-14">
          {Array.from({ length: 2 }).flatMap((_, groupIndex) =>
            partnerLogos.map((logo) => (
              <div
                key={`${groupIndex}-${logo.src}`}
                className="flex h-24 w-44 shrink-0 items-center justify-center bg-white px-5 sm:h-28 sm:w-52"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-20 w-auto max-w-full object-contain sm:max-h-24"
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-content/10 font-serif text-lg font-bold">
              <img
                  src="/AHA.gif"
                  alt="African Home Adventure Logo Animation"
                  className="h-15 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold leading-tight">
                  African Home Adventure
                </span>
              </div>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-primary-content/70">
              Fully registered and licensed by the Ministry of Tourism and Wildlife. Creating
              unforgettable safari experiences in Kenya and Tanzania since 1998.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-widest uppercase text-primary-content/50">
              Popular Safaris
            </h3>
            <ul className="flex flex-col gap-2.5">
              {safariLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-content/70 transition-colors hover:text-primary-content"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-widest uppercase text-primary-content/50">
              Company
            </h3>
            <ul className="flex flex-col gap-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-content/70 transition-colors hover:text-primary-content inline-flex items-center gap-1"
                    target={isExternal(link.href) ? "_blank" : undefined}
                    rel={isExternal(link.href) ? "noopener noreferrer" : undefined}
                  >
                    {link.label}
                    {isExternal(link.href) && (
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-widest uppercase text-primary-content/50">
              Get in Touch
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="tel:+254722760661"
                className="flex items-center gap-3 text-sm text-primary-content/70 transition-colors hover:text-primary-content"
              >
                <Phone className="h-4 w-4 shrink-0" />
                +254 722 760 661
              </a>
              <a
                href="mailto:info@africahomeadventure.com"
                className="flex items-center gap-3 text-sm text-primary-content/70 transition-colors hover:text-primary-content break-all"
              >
                <Mail className="h-4 w-4 shrink-0" />
                info@africahomeadventure.com
              </a>
              <div className="flex items-start gap-3 text-sm text-primary-content/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>YWCA Parkview Suites, Ground Floor, Nyerere Road, Opposite Central Park</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-content/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 sm:flex-row">
          <p className="text-xs text-primary-content/50">
            &copy; {new Date().getFullYear()} African Home Adventure Safaris. All rights reserved.
          </p>
          <p className="text-xs text-primary-content/50">
            Kenya Association of Tour Operators (KATO) Member
          </p>
        </div>
      </div>
    </footer>
  );
}
