"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Phone, Mail, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Tours", href: "/tours" },
  { label: "Contact", href: "/contact" },
]

const tourCategories = [
  { label: "Budget Safaris", href: "/tours?tier=budget" },
  { label: "Luxury Safaris", href: "/tours?tier=luxury" },
  { label: "Kilimanjaro Climbing", href: "/tours?type=kilimanjaro" },
  { label: "Beach Holidays", href: "/tours?type=beach" },
  { label: "Day Trips", href: "/tours?duration=day" },
  { label: "Kenya Safaris", href: "/tours?country=Kenya" },
  { label: "Tanzania Safaris", href: "/tours?country=Tanzania" },
  { label: "Combined Safaris", href: "/tours?country=Kenya+%26+Tanzania" },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Top bar */}
      <div className="hidden md:block bg-primary text-primary-foreground">
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
            <span className="text-primary-foreground/40">|</span>
            <span>Licensed Tour Operator</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-serif text-lg font-bold">
              A
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold leading-tight text-foreground">
                Africa Home
              </span>
              <span className="text-xs tracking-widest uppercase text-muted-foreground">
                Adventure
              </span>
            </div>
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <Link
              href="/"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              Home
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground outline-none">
                Tours <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem asChild>
                  <Link href="/tours">All Safaris</Link>
                </DropdownMenuItem>
                {tourCategories.map((cat) => (
                  <DropdownMenuItem key={cat.label} asChild>
                    <Link href={cat.href}>{cat.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/contact"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </nav>

          {/* CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Button variant="outline" size="sm" asChild>
              <Link href="/contact">Get a Quote</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/tours">Book Now</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden p-2 -mr-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-border md:hidden bg-background">
            <nav className="flex flex-col px-6 py-4 gap-0.5" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-foreground active:bg-secondary/80"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <p className="mt-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Safari categories
              </p>
              {tourCategories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="rounded-md px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground pl-5"
                  onClick={() => setMobileOpen(false)}
                >
                  {cat.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
                <a
                  href="tel:+254722760661"
                  className="flex items-center gap-2 px-3 text-sm text-muted-foreground"
                >
                  <Phone className="h-4 w-4" /> +254 722 760 661
                </a>
                <a
                  href="mailto:info@africahomeadventure.com"
                  className="flex items-center gap-2 px-3 text-sm text-muted-foreground"
                >
                  <Mail className="h-4 w-4" /> info@africahomeadventure.com
                </a>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="/contact" onClick={() => setMobileOpen(false)}>
                      Get a Quote
                    </Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href="/tours" onClick={() => setMobileOpen(false)}>
                      Book Now
                    </Link>
                  </Button>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
