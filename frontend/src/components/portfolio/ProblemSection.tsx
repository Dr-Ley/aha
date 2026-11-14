import { problemPoints } from "./content";
import { AccentBlob } from "./decor";
import { MaskReveal } from "./MaskReveal";
import { SectionReveal } from "./SectionReveal";
import { cardClass, sectionClass, shadowHoverApplied, wrapClass } from "./styles";
import { cn } from "@/lib/utils";

export function ProblemSection() {
  return (
    <section id="problem" className={cn(sectionClass, "relative overflow-hidden")}>
      <AccentBlob className="bottom-[-8rem] left-[-8rem] h-[380px] w-[380px]" opacity={0.14} />
      <div className={cn(wrapClass, "relative")}>
        <SectionReveal>
          <h2 className="font-display max-w-2xl text-[clamp(2rem,3vw+0.8rem,3.1rem)] font-medium leading-tight tracking-tight text-[#171717] text-balance">
            <MaskReveal>Your Customers Are Looking.</MaskReveal>
            <MaskReveal delay={0.08}>Can They Find You?</MaskReveal>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#66615B]">
            Customers should not have to scroll through everything you sell to find what they want. A website makes that
            search simple.
          </p>
        </SectionReveal>
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {problemPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <li key={point.label}>
                <SectionReveal delay={index * 0.06} className="h-full">
                  <div
                    className={cn(
                      cardClass,
                      shadowHoverApplied,
                      "flex h-full items-start gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                        point.accent
                          ? "border-transparent bg-[#E3EDE8] text-[#2F5D50]"
                          : "border-[#DED7CB] text-[#171717]"
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <p className="pt-2 text-base leading-snug text-[#171717]">{point.label}</p>
                  </div>
                </SectionReveal>
              </li>
            );
          })}
        </ul>
        <SectionReveal delay={0.15}>
          <p className="mt-12 max-w-2xl border-l-2 border-[#2F5D50] pl-5 text-lg leading-relaxed text-[#171717]">
            A website keeps working for your business, even when you are not there to reply.
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}