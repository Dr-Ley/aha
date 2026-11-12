"use client";

import { motion, useReducedMotion } from "motion/react";
import type { PortfolioSectionId } from "./content";
import { navItems } from "./content";
import { easeSnappy } from "./motion-presets";
import { focusRing, primaryButton } from "./styles";
import { cn } from "@/lib/utils";

type MobileNavigationProps = {
  id: string;
  open: boolean;
  activeId: PortfolioSectionId;
  onNavigate: () => void;
};

export function MobileNavigation({ id, open, activeId, onNavigate }: MobileNavigationProps) {
  const reduce = useReducedMotion();
  if (!open) return null;

  return (
    <motion.nav
      id={id}
      aria-label="Portfolio sections"
      initial={reduce ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: easeSnappy }}
      className="fixed inset-x-3 bottom-3 top-[4.75rem] z-30 overflow-y-auto rounded-3xl border border-white/70 bg-white/75 px-6 py-6 shadow-[0_16px_44px_-16px_rgba(23,23,23,0.45)] backdrop-blur-xl md:hidden"
    >
      <ul className="flex flex-col">
        {navItems.map((item, index) => (
          <motion.li
            key={item.id}
            initial={reduce ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: reduce ? 0 : 0.05 + index * 0.03, ease: easeSnappy }}
          >
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? "true" : undefined}
              onClick={onNavigate}
              className={cn(
                focusRing,
                "flex min-h-12 items-center text-lg",
                activeId === item.id ? "font-semibold text-[#171717]" : "text-[#66615B]"
              )}
            >
              {item.label}
            </a>
          </motion.li>
        ))}
      </ul>
      <motion.a
        href="#contact"
        onClick={onNavigate}
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: reduce ? 0 : 0.26, ease: easeSnappy }}
        className={cn(primaryButton, "mt-6 w-full")}
      >
        Free Website Audit
      </motion.a>
    </motion.nav>
  );
}