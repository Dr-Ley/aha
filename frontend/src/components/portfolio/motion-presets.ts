import type { Variants } from "motion/react";

export const easeOut = [0.22, 1, 0.36, 1] as const;
export const easeSnappy = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.55, ease: easeOut } },
};

export const staggerContainer = (stagger = 0.07): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger } },
});
