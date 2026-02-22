"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Phone, Mail, ChevronDown } from "lucide-react";
import Image from "next/image";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Tours", href: "/tours" },
  { label: "Contact", href: "/contact" },
];

const tourCategories = [
  { label: "Budget Safaris", href: "/tours?tier=budget" },
  { label: "Luxury Safaris", href: "/tours?tier=luxury" },
  { label: "Kilimanjaro Climbing", href: "/tours?type=kilimanjaro" },
  { label: "Beach Holidays", href: "/tours?type=beach" },
  { label: "Day Trips", href: "/tours?duration=day" },
  { label: "Kenya Safaris", href: "/tours?country=Kenya" },
  { label: "Tanzania Safaris", href: "/tours?country=Tanzania" },
  { label: "Combined Safaris", href: "/tours?country=Kenya+%26+Tanzania" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toursOpen, setToursOpen] = useState(false);
  const toursRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toursRef.current && !toursRef.current.contains(event.target as Node)) {
        setToursOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Top bar */}
      <div className="hidden md:block bg-primary text-primary-content">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-sm">
          <div className="flex items-center gap-6">
            <a
              href="tel:+254722760661"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Phone className="h-3.5 w-3.5" />
              +254 722 760 661
            </a>
            <a
              href="mailto:info@africahomeadventure.com"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Mail className="h-3.5 w-3.5" />
              info@africahomeadventure.com
            </a>
          </div>
          <div className="flex items-center gap-4 text-xs tracking-wide uppercase">
            <span>KATO Member FE/459</span>
            <span className="opacity-40">|</span>
            <span>Licensed Tour Operator</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header className="sticky top-0 z-50 border-b border-base-content/10 bg-base-100/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-primary">
              <Image
                src="https://aha-africanhomeadventure.s3.eu-north-1.amazonaws.com/aha-logo/AHA_LOGO_2025.png"
                alt="African Home Adventure Logo"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold leading-tight text-base-content">
                African Home
              </span>
              <span className="text-xs tracking-widest uppercase text-base-content/60">
                Adventure
              </span>
            </div>
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <Link
              href="/"
              className="text-sm font-medium text-base-content/80 transition-colors hover:text-base-content"
            >
              Home
            </Link>

            <div className="relative" ref={toursRef}>
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium text-base-content/80 transition-colors hover:text-base-content outline-none"
                onClick={() => setToursOpen(!toursOpen)}
                aria-expanded={toursOpen}
                aria-haspopup="true"
              >
                Tours <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {toursOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-1 w-56 -translate-x-1/2 rounded-lg border border-base-content/10 bg-white dark:bg-base-100 py-1 shadow-lg">
                  <Link
                    href="/tours"
                    className="block px-4 py-2 text-sm hover:bg-base-200"
                    onClick={() => setToursOpen(false)}
                  >
                    All Safaris
                  </Link>
                  {tourCategories.map((cat) => (
                    <Link
                      key={cat.label}
                      href={cat.href}
                      className="block px-4 py-2 text-sm hover:bg-base-200"
                      onClick={() => setToursOpen(false)}
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/contact"
              className="text-sm font-medium text-base-content/80 transition-colors hover:text-base-content"
            >
              Contact
            </Link>
          </nav>

          {/* CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/contact" className="btn btn-outline btn-sm">
              Get a Quote
            </Link>
            <Link href="/tours" className="btn btn-primary btn-sm">
              Book Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="btn btn-ghost btn-square md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-base-content/10 md:hidden bg-base-100">
            <nav className="flex flex-col gap-0.5 px-6 py-4" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-3 text-sm font-medium text-base-content transition-colors hover:bg-base-200 active:bg-base-200/80"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <p className="mt-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Safari categories
              </p>
              {tourCategories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="rounded-md pl-5 py-2.5 text-sm text-base-content/80 transition-colors hover:bg-base-200 hover:text-base-content"
                  onClick={() => setMobileOpen(false)}
                >
                  {cat.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-base-content/10 pt-4">
                <a
                  href="tel:+254722760661"
                  className="flex items-center gap-2 px-3 text-sm text-base-content/60"
                >
                  <Phone className="h-4 w-4" /> +254 722 760 661
                </a>
                <a
                  href="mailto:info@africahomeadventure.com"
                  className="flex items-center gap-2 px-3 text-sm text-base-content/60"
                >
                  <Mail className="h-4 w-4" /> info@africahomeadventure.com
                </a>
                <div className="mt-2 flex gap-2">
                  <Link
                    href="/contact"
                    className="btn btn-outline btn-sm flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get a Quote
                  </Link>
                  <Link
                    href="/tours"
                    className="btn btn-primary btn-sm flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
