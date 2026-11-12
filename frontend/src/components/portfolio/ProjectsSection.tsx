"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { projects } from "./content";
import { AccentBlob } from "./decor";
import { MaskReveal } from "./MaskReveal";
import { ProjectMockup } from "./ProjectMockup";
import { SectionReveal } from "./SectionReveal";
import { sectionClass, wrapClass } from "./styles";
import { cn } from "@/lib/utils";

export function ProjectsSection() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const yA = useTransform(scrollYProgress, [0, 1], [28, -28]);
  const yB = useTransform(scrollYProgress, [0, 1], [-28, 28]);

  return (
    <section
      id="projects"
      ref={sectionRef}
      className={cn(sectionClass, "relative overflow-hidden")}
    >
      <AccentBlob className="left-[30%] top-[35%] h-[380px] w-[380px]" opacity={0.14} />
      <div className={cn(wrapClass, "relative")}>
        <SectionReveal>
          <h2 className="font-display max-w-2xl text-[clamp(2rem,3vw+0.8rem,3.1rem)] font-medium leading-tight tracking-tight text-[#171717] text-balance">
            <MaskReveal>What Your Business Could</MaskReveal>
            <MaskReveal delay={0.08}>Look Like Online.</MaskReveal>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#66615B]">
            Explore examples of how different businesses can establish a stronger digital presence.
          </p>
        </SectionReveal>
        <div className="mt-16 space-y-20">
          {projects.map((project, index) => (
            <article key={project.variant} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <SectionReveal className={cn(index % 2 === 1 && "lg:order-2")} delay={0.05}>
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#66615B]">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-[#2F5D50]" />
                  Concept project
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#171717] sm:text-3xl">
                  {project.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-[#66615B]">{project.concept}</p>
                <ul className="mt-6 space-y-2 text-sm leading-relaxed text-[#171717]">
                  {project.shows.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-[7px] size-1 shrink-0 rounded-full bg-[#2F5D50]"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionReveal>
              <SectionReveal delay={0.12} className={cn(index % 2 === 1 && "lg:order-1")}>
                <motion.div style={reduce ? undefined : { y: index % 2 === 0 ? yA : yB }}>
                  <ProjectMockup variant={project.variant} url={project.url} title={project.title} />
                </motion.div>
              </SectionReveal>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}