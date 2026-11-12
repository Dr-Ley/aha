"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { AccentBlob, Ring } from "./decor";
import { MaskReveal } from "./MaskReveal";
import { easeOut } from "./motion-presets";
import { HeroMockup } from "./ProjectMockup";
import { primaryButton, secondaryButton, sectionClass, wrapClass } from "./styles";
import { cn } from "@/lib/utils";

function Entrance({ children, className, delay }: { children: ReactNode; className?: string; delay: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

export function HeroSection() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <section
      id="home"
      ref={sectionRef}
      className={cn(sectionClass, "relative overflow-hidden pb-16 pt-16 md:pb-24 md:pt-24")}
    >
      <AccentBlob className="-top-24 right-[-8rem] h-[420px] w-[420px] md:right-[-4rem]" />
      <AccentBlob className="bottom-[-6rem] left-[-10rem] h-[320px] w-[320px]" opacity={0.14} />
      <Ring className="-left-20 top-28 h-48 w-48" />
      <div
        className={cn(
          wrapClass,
          "relative grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16"
        )}
      >
        <motion.div style={reduce ? undefined : { y: textY }}>
          <Entrance delay={0.05}>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#66615B]">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-[#2F5D50]" />
              Solutions architect
            </p>
          </Entrance>
          <h1 className="font-display mt-5 max-w-xl text-[clamp(2.6rem,5.5vw+1rem,4.9rem)] font-medium leading-[1.05] tracking-tight text-[#171717] text-balance">
            <MaskReveal>Your Business Deserves</MaskReveal>
            <MaskReveal delay={0.08}>More Than a Social</MaskReveal>
            <MaskReveal delay={0.16}>Media Page.</MaskReveal>
          </h1>
          <Entrance delay={0.24}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#66615B]">
              I help businesses with an active social media presence turn visitors into enquiries with professional
              websites and practical digital solutions.
            </p>
          </Entrance>
          <Entrance delay={0.34} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#contact" className={primaryButton}>
              Book a Free Website Audit
            </a>
            <a href="#services" className={secondaryButton}>
              Explore My Services
            </a>
          </Entrance>
        </motion.div>

        {reduce ? (
          <HeroMockup />
        ) : (
          <motion.div style={{ y: mockupY }}>
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: easeOut }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
              >
                <HeroMockup />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}