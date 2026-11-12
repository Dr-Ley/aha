import { whyReasons } from "./content";
import { AccentBlob, Ring } from "./decor";
import { MaskReveal } from "./MaskReveal";
import { SectionReveal } from "./SectionReveal";
import { sectionClass, wrapClass } from "./styles";
import { cn } from "@/lib/utils";

export function WhyMeSection() {
  return (
    <section
      id="why-me"
      className={cn(sectionClass, "relative overflow-hidden text-[#F5F0E6]")}
    >
      <div aria-hidden="true" className="texture-grid pointer-events-none absolute inset-0 opacity-60" />
      <AccentBlob className="-right-32 top-[-4rem] h-[380px] w-[380px]" opacity={0.2} />
      <Ring className="-left-16 bottom-10 h-52 w-52" color="rgba(245,240,230,0.08)" />
      <div className={cn(wrapClass, "relative")}>
        <SectionReveal>
          <h2 className="font-display max-w-2xl text-[clamp(2rem,3vw+0.8rem,3.1rem)] font-medium leading-tight tracking-tight text-[#F5F0E6] text-balance">
            <MaskReveal>Practical Digital Solutions.</MaskReveal>
            <MaskReveal delay={0.08}>Without the Agency Overhead.</MaskReveal>
          </h2>
        </SectionReveal>
        <ul className="mt-12 grid gap-4 md:grid-cols-2">
          {whyReasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <li key={reason.title}>
                <SectionReveal delay={index * 0.06} className="h-full">
                  <div className="h-full rounded-2xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur-md transition-colors duration-300 hover:border-white/20">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#2F5D50] text-[#F5F0E6]">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <p className="mt-5 text-lg leading-snug text-[#F5F0E6]">{reason.title}</p>
                  </div>
                </SectionReveal>
              </li>
            );
          })}
        </ul>
        <SectionReveal delay={0.1}>
          <p className="mt-10 max-w-2xl border-l-2 border-[#4E8774] pl-5 text-lg leading-relaxed text-[#B9B2A6]">
            The goal isn&apos;t simply to build a website. It&apos;s to create a useful digital presence that supports
            your business and makes it easier for customers to choose you.
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}