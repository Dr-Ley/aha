"use client";

import { useEffect, useState } from "react";
import { brand } from "./content";
import { MeetPages } from "./MeetPages";
import { focusRingDark } from "./styles";

export function PortfolioFooter() {
  const year = new Date().getFullYear();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.getElementById("meet-me")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  return (
    <>
      <footer className="relative overflow-hidden border-t border-white/15 px-6 pb-10 pt-12 md:px-8">
        <p
          aria-hidden="true"
          className="font-display pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 select-none whitespace-nowrap text-[15vw] font-medium leading-none text-white/[0.05] md:text-[12vw]"
        >
          Solutions Architect
        </p>
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-[#F5F0E6]">{brand.name}</p>
            <p className="mt-2 text-sm text-[#8A8478]">
              © {year} {brand.name}. All rights reserved.
            </p>
          </div>
          <nav aria-label="Footer">
            <button
              type="button"
              aria-expanded={open}
              aria-controls="meet-me"
              className={`${focusRingDark} text-sm text-[#B9B2A6] transition-colors duration-200 hover:text-[#F5F0E6]`}
              onClick={() => setOpen((current) => !current)}
            >
              Meet me
            </button>
          </nav>
        </div>
      </footer>
      <MeetPages open={open} />
    </>
  );
}
