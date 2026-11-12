import { services } from "./content";
import { MaskReveal } from "./MaskReveal";
import { SectionReveal } from "./SectionReveal";
import { sectionClass, shadowHoverApplied, shadowRest, wrapClass } from "./styles";
import { cn } from "@/lib/utils";

export function ServicesSection() {
  return (
    <section id="services" className={sectionClass}>
      <div className={wrapClass}>
        <SectionReveal>
          <h2 className="font-display max-w-2xl text-[clamp(2rem,3vw+0.8rem,3.1rem)] font-medium leading-tight tracking-tight text-[#171717] text-balance">
            <MaskReveal>Everything You Need to Build</MaskReveal>
            <MaskReveal delay={0.08}>Your Digital Presence.</MaskReveal>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#66615B]">
            Practical digital solutions designed to help your business establish credibility, reach customers and
            generate enquiries.
          </p>
        </SectionReveal>
        <ul className="mt-12 grid gap-4 md:grid-cols-2">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <li key={service.title}>
                <SectionReveal delay={index * 0.07} className="h-full">
                  <article
                    className={cn(
                      "group relative h-full overflow-hidden rounded-2xl border border-[#DED7CB] bg-[#FCFAF5] p-7 transition-all duration-300 hover:-translate-y-1.5 motion-reduce:transform-none motion-reduce:transition-none",
                      shadowRest,
                      shadowHoverApplied
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-7 top-0 h-0.5 origin-left scale-x-0 rounded-full bg-[#2F5D50] transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none"
                    />
                    <span className="flex size-10 items-center justify-center rounded-full border border-[#DED7CB] text-[#171717] transition-colors duration-300 group-hover:border-transparent group-hover:bg-[#E3EDE8] group-hover:text-[#2F5D50] motion-reduce:transition-none">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <h3 className="mt-6 text-xl font-semibold tracking-tight text-[#171717]">{service.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-[#66615B]">{service.body}</p>
                  </article>
                </SectionReveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}