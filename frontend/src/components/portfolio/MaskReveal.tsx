"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { easeOut } from "./motion-presets";

type MaskRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/**
 * Line-mask reveal: content slides up from behind an overflow-hidden clip.
 * Render inside headings (`h1`/`h2`) — uses spans, so it stays valid phrasing content.
 *
 * Watch the clip, not the sliding line. The line starts fully outside the clip,
 * so observing it never intersects the viewport and the headline stays hidden.
 */
export function MaskReveal({ children, className, delay = 0 }: MaskRevealProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <span className={cn("block", className)}>{children}</span>;
  }
  return (
    <motion.span
      className={cn("block overflow-hidden", className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
    >
      <motion.span
        className="block"
        variants={{
          hidden: { y: "105%" },
          show: {
            y: "0%",
            transition: { duration: 0.7, delay, ease: easeOut },
          },
        }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}
