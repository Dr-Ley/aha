"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Phone, Mail, ChevronDown } from "lucide-react";
import { useCurrency } from "@/lib/currency-context"
import { CURRENCIES } from "@/lib/data"
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/lib/auth-context";




const navLinks = [
  { label: "Home", href: "/" },
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
  { label: "Balloon Safaris", href: "/tours?type=balloon" },
];

const campsCategories = [
  { label: "Tented Camps", href: "/camps?type=tented-camp" },
  { label: "Luxury Lodges", href: "/camps?type=lodge" },
];

const infoCategories = [
  { label: "Flights", href: "/info/flights" },
  { label: "ETA/Visa", href: "/info/visa" },
  { label: "Seasons & Pricing", href: "/info/seasons" },
];

function CurrencyDropdown() {
  const { currency, setCurrency } = useCurrency()
  const current = CURRENCIES.find((c) => c.code === currency)!

  return (
    <div 
    className="dropdown dropdown-end"
    >
      {/* Trigger */}
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-sm border border-border text-xs font-medium"
      >
        {current.code}
        <svg
          className="ml-1 h-3 w-3 opacity-70"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown Content */}
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-[1] mt-2 w-56 p-2 shadow"
      >
        {CURRENCIES.map((c) => (
          <li key={c.code}>
            <button
              onClick={() => setCurrency(c.code)}
              className={currency === c.code ? "active font-semibold" : ""}
            >
             {c.code} - {c.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CurrencyDropdown
export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const { user, logout } = useAuth();
  const [mobileToursExpanded, setMobileToursExpanded] = useState(false);
  const [mobileCampsExpanded, setMobileCampsExpanded] = useState(false);
  const [mobileInfoExpanded, setMobileInfoExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [gifPlaying, setGifPlaying] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const toursRef = useRef<HTMLDivElement>(null);
  const campsRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        toursRef.current && !toursRef.current.contains(event.target as Node) &&
        campsRef.current && !campsRef.current.contains(event.target as Node) &&
        infoRef.current && !infoRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // GIF cycle effect
  useEffect(() => {
    let isPlaying = true;
    const cycleGif = () => {
      setGifPlaying(true);
      isPlaying = true;
      const stopTimer = setTimeout(() => {
        setGifPlaying(false);
        isPlaying = false;
      }, 6000);
      return stopTimer;
    };

    let stopTimer = cycleGif();
    const interval = setInterval(() => {
      clearTimeout(stopTimer);
      stopTimer = cycleGif();
    }, 20000);

    return () => {
      clearInterval(interval);
      clearTimeout(stopTimer);
    };
  }, []);

  const handleDropdownEnter = (dropdown: string) => {
    setActiveDropdown(dropdown);
  };

  const handleDropdownLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const relatedTarget = e.relatedTarget as Node;
    // Check if we're moving to another dropdown or staying in nav
    if (
      toursRef.current?.contains(relatedTarget) ||
      campsRef.current?.contains(relatedTarget) ||
      infoRef.current?.contains(relatedTarget)
    ) {
      return;
    }
    setActiveDropdown(null);
  };


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
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-500 ${
            scrolled ? "py-0.5" : "py-4"
          }`}
        >
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div
              className={`relative rounded-full  transition-all duration-500 ${
                scrolled ? "h-14 w-22" : "h-12 w-16"
              }`}
            >
              {gifPlaying ? (
                <img
                  src="/AHA.gif"
                  alt="African Home Adventure Logo Animation"
                  className="h-15 object-contain"
                />
              ) : (
                <img
                  src="/AHA_STATIC.png"
                  alt="African Home Adventure Logo"
                  className="h-15 object-contain"
                />
              )}
            </div>

            <div
              className={`flex flex-col transition-all duration-500 ${
                scrolled ? "-translate-y-6 opacity-0" : "translate-y-0 opacity-100"
              }`}
            >
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

            {/* Tours Dropdown - Hover */}
            <div
              className="relative group"
              ref={toursRef}
              onMouseEnter={() => handleDropdownEnter("tours")}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium text-base-content/80 transition-colors hover:text-base-content outline-none py-2"
                aria-expanded={activeDropdown === "tours"}
                aria-haspopup="true"
              >
                Safaris <ChevronDown className={`h-3.5 w-3.5 transition-transform ${activeDropdown === "tours" ? "rotate-180" : ""}`} />
              </button>
              <div className="absolute left-0 top-full pt-1 w-56 -translate-x-1/4 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
                <div className="rounded-lg border border-base-content/10 bg-white dark:bg-base-100 py-1 shadow-lg">
                  <Link
                    href="/tours"
                    className="block px-4 py-2 text-sm hover:bg-base-200"
                    onClick={() => setActiveDropdown(null)}
                  >
                    All Safaris
                  </Link>
                  {tourCategories.map((cat) => (
                    <Link
                      key={cat.label}
                      href={cat.href}
                      className="block px-4 py-2 text-sm hover:bg-base-200"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Camps Dropdown - Hover */}
            <div
              className="relative group"
              ref={campsRef}
              onMouseEnter={() => handleDropdownEnter("camps")}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium text-base-content/80 transition-colors hover:text-base-content outline-none py-2"
                aria-expanded={activeDropdown === "camps"}
                aria-haspopup="true"
              >
                Camps <ChevronDown className={`h-3.5 w-3.5 transition-transform ${activeDropdown === "camps" ? "rotate-180" : ""}`} />
              </button>
              <div className="absolute left-0 top-full pt-1 w-56 -translate-x-1/4 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
                <div className="rounded-lg border border-base-content/10 bg-white dark:bg-base-100 py-1 shadow-lg">
                  {campsCategories.map((cat) => (
                    <Link
                      key={cat.label}
                      href={cat.href}
                      className="block px-4 py-2 text-sm hover:bg-base-200"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Info Dropdown - Hover */}
            <div
              className="relative group"
              ref={infoRef}
              onMouseEnter={() => handleDropdownEnter("info")}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium text-base-content/80 transition-colors hover:text-base-content outline-none py-2"
                aria-expanded={activeDropdown === "info"}
                aria-haspopup="true"
              >
                Travel Tips <ChevronDown className={`h-3.5 w-3.5 transition-transform ${activeDropdown === "info" ? "rotate-180" : ""}`} />
              </button>
              <div className="absolute left-0 top-full pt-1 w-56 -translate-x-1/4 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
                <div className="rounded-lg border border-base-content/10 bg-white dark:bg-base-100 py-1 shadow-lg">
                  {infoCategories.map((cat) => (
                    <Link
                      key={cat.label}
                      href={cat.href}
                      className="block px-4 py-2 text-sm hover:bg-base-200"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/contact"
              className="text-sm font-medium text-base-content/80 transition-colors hover:text-base-content"
            >
              Contact
            </Link>
          </nav>
          <div>
            <CurrencyDropdown />
          </div>  
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <div className="dropdown dropdown-end">
                <button className="btn btn-ghost btn-circle avatar">
                  <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                    {user.avatar}
                  </div>
                </button>
                <ul className="menu dropdown-content z-50 mt-3 w-52 rounded-box bg-base-100 p-2 shadow">
                  <li><a>Profile</a></li>
                  <li><a>My Bookings</a></li>
                  {user.role === "staff" && <li><a>Staff Dashboard</a></li>}
                  <li><button onClick={logout}>Logout</button></li>
                </ul>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => { setAuthTab("login"); setShowAuthModal(true); }}
                  className="btn btn-outline btn-sm"
                >
                  Sign In
                </button>
                <Link href="/tours" className="btn btn-primary btn-sm">
              My Tours
            </Link>
              </>
            )}
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
          

        {/* Mobile menu - Collapsible dropdowns */}
        {mobileOpen && (
          <div className="border-t border-base-content/10 md:hidden bg-base-100">
            <nav className="flex flex-col gap-0.5 px-6 py-4" aria-label="Mobile navigation">
              
              {/* Home Link */}
              <Link
                href="/"
                className="rounded-md px-3 py-3 text-sm font-medium text-base-content transition-colors hover:bg-base-200 active:bg-base-200/80"
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>

              {/* Tours - Collapsible */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setMobileToursExpanded(!mobileToursExpanded)}
                  className="flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium text-base-content transition-colors hover:bg-base-200"
                >
                  Safaris
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileToursExpanded ? "rotate-180" : ""}`} />
                </button>
                {mobileToursExpanded && (
                  <div className="flex flex-col pl-4">
                    <Link
                      href="/tours"
                      className="rounded-md px-3 py-2.5 text-sm text-base-content/80 transition-colors hover:bg-base-200 hover:text-base-content"
                      onClick={() => setMobileOpen(false)}
                    >
                      All Safaris
                    </Link>
                    {tourCategories.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        className="rounded-md px-3 py-2.5 text-sm text-base-content/80 transition-colors hover:bg-base-200 hover:text-base-content"
                        onClick={() => setMobileOpen(false)}
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Camps - Collapsible */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setMobileCampsExpanded(!mobileCampsExpanded)}
                  className="flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium text-base-content transition-colors hover:bg-base-200"
                >
                  Camps
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileCampsExpanded ? "rotate-180" : ""}`} />
                </button>
                {mobileCampsExpanded && (
                  <div className="flex flex-col pl-4">
                    {campsCategories.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        className="rounded-md px-3 py-2.5 text-sm text-base-content/80 transition-colors hover:bg-base-200 hover:text-base-content"
                        onClick={() => setMobileOpen(false)}
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Info - Collapsible */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setMobileInfoExpanded(!mobileInfoExpanded)}
                  className="flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium text-base-content transition-colors hover:bg-base-200"
                >
                  Travel Tips
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileInfoExpanded ? "rotate-180" : ""}`} />
                </button>
                {mobileInfoExpanded && (
                  <div className="flex flex-col pl-4">
                    {infoCategories.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        className="rounded-md px-3 py-2.5 text-sm text-base-content/80 transition-colors hover:bg-base-200 hover:text-base-content"
                        onClick={() => setMobileOpen(false)}
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Link */}
              <Link
                href="/contact"
                className="rounded-md px-3 py-3 text-sm font-medium text-base-content transition-colors hover:bg-base-200 active:bg-base-200/80"
                onClick={() => setMobileOpen(false)}
              >
                Contact
              </Link>

              {/* Contact info and CTAs */}
              <div className="mt-3 flex flex-col gap-2 border-t border-base-content/10 pt-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                        {user.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-base-content">{user.name}</p>
                        <p className="text-xs text-base-content/60 capitalize">{user.role}</p>
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-base-content/80 hover:bg-base-200 rounded-md"
                      onClick={() => setMobileOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/bookings"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-base-content/80 hover:bg-base-200 rounded-md"
                      onClick={() => setMobileOpen(false)}
                    >
                      My Bookings
                    </Link>
                    {user.role === "staff" && (
                      <Link
                        href="/staff/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-base-content/80 hover:bg-base-200 rounded-md"
                        onClick={() => setMobileOpen(false)}
                      >
                        Staff Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10 rounded-md"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
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
                      <button
                        onClick={() => {
                          setAuthTab("login");
                          setShowAuthModal(true);
                          setMobileOpen(false);
                        }}
                        className="btn btn-outline btn-sm flex-1"
                      >
                        Sign In
                      </button>
                      <Link
                        href="/tours"
                        className="btn btn-primary btn-sm flex-1"
                        onClick={() => setMobileOpen(false)}
                      >
                        Book Now
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultTab={authTab}
      />
    </>
  );
}