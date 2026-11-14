"use client";

import { motion, useReducedMotion } from "motion/react";
import type { SyntheticEvent } from "react";
import { contactChannels } from "./content";
import { easeSnappy } from "./motion-presets";

function slideSrc(event: SyntheticEvent<HTMLImageElement>, fallback: string) {
  if (event.currentTarget.src.endsWith(fallback)) return;
  event.currentTarget.src = fallback;
}

export function MeetPages({ open }: { open: boolean }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      id="meet-me"
      initial={false}
      animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.45, ease: easeSnappy }}
      className="overflow-hidden"
      aria-hidden={!open}
      inert={!open}
    >
      <a
        href={contactChannels.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Meet Bradley Ouko on LinkedIn"
        className="block"
      >
        <img
          src="/brad1.png"
          alt="Bradley Ouko, Solutions Architect"
          className="hidden h-dvh w-full object-cover md:block"
        />
        <img
          src="/brad1a.png"
          alt="Bradley Ouko, Solutions Architect"
          className="h-dvh w-full object-cover md:hidden"
          onError={(event) => slideSrc(event, "/brad1.png")}
        />
      </a>
      <a href={`mailto:${contactChannels.email}`} aria-label="Email Bradley Ouko" className="block">
        <img
          src="/brad2.png"
          alt="Let's get to work"
          className="hidden h-dvh w-full object-cover md:block"
        />
        <img
          src="/brad2a.png"
          alt="Let's get to work"
          className="h-dvh w-full object-cover md:hidden"
          onError={(event) => slideSrc(event, "/brad2.png")}
        />
      </a>
    </motion.div>
  );
}
