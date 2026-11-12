"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { brand, navItems, type PortfolioSectionId } from "./content";
import { MobileNavigation } from "./MobileNavigation";
import { easeSnappy } from "./motion-presets";
import { focusRing, primaryButton } from "./styles";
import { cn } from "@/lib/utils";

function isSectionId(value: string): value is PortfolioSectionId {
  return navItems.some((item) => item.id === value);
}

export function PortfolioHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<PortfolioSectionId>("home");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const nodes = navItems
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.id;
        if (id && isSectionId(id)) setActiveId(id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.35, 0.6] }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const firstLink = document.getElementById(menuId)?.querySelector("a");
    firstLink?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, menuId]);

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pt-3 md:px-5 md:pt-4">
        <div
          className={cn(
            "mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 rounded-full border border-white/70 bg-white/55 px-3 shadow-[0_10px_40px_-18px_rgba(23,23,23,0.45)] backdrop-blur-xl transition-[background-color,box-shadow] duration-200 sm:px-4 md:px-5",
            scrolled || open ? "bg-white/75 shadow-[0_16px_44px_-16px_rgba(23,23,23,0.5)]" : ""
          )}
        >
          <a
            href="#home"
            className={cn(focusRing, "flex items-center gap-2 rounded text-sm font-semibold tracking-tight text-[#171717]")}
          >
            <span className="sr-only">{brand.name}. </span>
            <span aria-hidden="true" className="font-display text-lg font-semibold leading-none">
              {brand.mark}
            </span>
            <span aria-hidden="true" className="size-2 rounded-[3px] bg-[#2F5D50]" />
          </a>

          <nav aria-label="Portfolio sections" className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={activeId === item.id ? "true" : undefined}
                className={cn(
                  focusRing,
                  "relative py-1 text-sm transition-colors duration-200",
                  activeId === item.id
                    ? "font-semibold text-[#171717]"
                    : "text-[#66615B] hover:text-[#171717]"
                )}
              >
                {item.label}
                {activeId === item.id ? (
                  <motion.span
                    layoutId="portfolio-nav-underline"
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-[#2F5D50]"
                    transition={{ duration: reduce ? 0 : 0.3, ease: easeSnappy }}
                  />
                ) : null}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#contact"
              className={cn(primaryButton, "min-h-10 whitespace-nowrap px-3 text-xs sm:px-4 sm:text-sm")}
            >
              Free Website Audit
            </a>
            <button
              ref={menuButtonRef}
              type="button"
              className={cn(
                focusRing,
                "inline-flex size-11 items-center justify-center rounded-full border border-[#DED7CB] text-[#171717] md:hidden"
              )}
              aria-expanded={open}
              aria-controls={menuId}
              onClick={() => setOpen((current) => !current)}
            >
              {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            </button>
          </div>
        </div>
      </header>
      <MobileNavigation id={menuId} open={open} activeId={activeId} onNavigate={() => setOpen(false)} />
    </>
  );
}