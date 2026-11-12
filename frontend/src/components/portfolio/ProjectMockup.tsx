import type { ReactNode } from "react";
import type { ProjectVariant } from "./content";
import { cn } from "@/lib/utils";

type FrameProps = {
  url: string;
  children: ReactNode;
  className?: string;
  label: string;
};

export function BrowserFrame({ url, children, className, label }: FrameProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "overflow-hidden rounded-2xl border border-[#DED7CB] bg-[#FCFAF5] shadow-[0_28px_60px_-40px_rgba(23,23,23,0.6)]",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-[#DED7CB] px-3 py-2.5">
        <span className="flex gap-1" aria-hidden="true">
          <span className="size-2 rounded-full bg-[#DED7CB]" />
          <span className="size-2 rounded-full bg-[#DED7CB]" />
          <span className="size-2 rounded-full bg-[#DED7CB]" />
        </span>
        <span className="ml-1 min-w-0 truncate rounded-full bg-[#E9E2D3] px-3 py-1 text-[11px] text-[#66615B]">{url}</span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function MobileFrame({ url, children, label }: { url: string; children: ReactNode; label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="overflow-hidden rounded-[1.4rem] border border-[#DED7CB] bg-[#FCFAF5] shadow-[0_18px_40px_-28px_rgba(23,23,23,0.7)]"
    >
      <div className="flex justify-center border-b border-[#DED7CB] px-2 py-1.5">
        <span className="h-1 w-10 rounded-full bg-[#DED7CB]" aria-hidden="true" />
        <span className="sr-only">{url}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function LocalServiceScreen({ compact = false }: { compact?: boolean }) {
  return (
    <div className="text-[#171717]">
      <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.14em] text-[#66615B]">
        <span className="flex items-center gap-1.5 font-semibold text-[#171717]">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-[#2F5D50]" />
          Local services
        </span>
        {compact ? null : <span>Services · Areas · Contact</span>}
      </div>
      <div
        className={cn(
          "mt-4 rounded-xl bg-gradient-to-br from-[#2F5D50] to-[#4E8774] text-[#F5F0E6]",
          compact ? "mt-3 p-3" : "p-4"
        )}
      >
        <p
          className={cn(
            "font-semibold leading-tight tracking-tight",
            compact ? "text-xs" : "max-w-xs text-lg"
          )}
        >
          A clear page for the work you already do.
        </p>
        {compact ? null : (
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#F5F0E6]/70">
            Services, areas covered, and a direct way to enquire.
          </p>
        )}
      </div>
      <div className={cn("grid gap-2", compact ? "mt-3" : "mt-3 grid-cols-3")}>
        {["Home visits", "Scheduled work", "Call-outs"].map((item, itemIndex) => (
          <div
            key={item}
            className={cn(
              "rounded-lg border px-2 py-2.5 text-center text-[11px]",
              itemIndex === 0
                ? "border-transparent bg-[#E3EDE8] font-medium text-[#2F5D50]"
                : "border-[#DED7CB] bg-[#F5F0E6]"
            )}
          >
            {item}
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2 rounded-xl border border-[#DED7CB] bg-[#F5F0E6] p-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#66615B]">Enquiry</p>
        <div className="h-7 rounded-md border border-[#DED7CB] bg-[#FCFAF5]" />
        {compact ? null : <div className="h-7 rounded-md border border-[#DED7CB] bg-[#FCFAF5]" />}
        <div className="inline-flex rounded-full bg-[#2F5D50] px-3 py-1.5 text-[11px] text-[#F5F0E6]">
          Send enquiry
        </div>
      </div>
    </div>
  );
}

function RecruitmentScreen({ compact = false }: { compact?: boolean }) {
  return (
    <div className="text-[#171717]">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[#66615B]">
        <span className="flex items-center gap-1.5 font-semibold text-[#171717]">
          <span aria-hidden="true" className="size-1.5 rounded-[2px] bg-[#2F5D50]" />
          Recruitment
        </span>
        {compact ? null : <span>Employers · Candidates</span>}
      </div>
      <p className={cn("font-semibold leading-tight tracking-tight", compact ? "mt-3 text-sm" : "mt-4 text-xl")}>
        One site for hiring and for finding a role.
      </p>
      <div className={cn("grid gap-2", compact ? "mt-3" : "mt-4 grid-cols-2")}>
        <div className="rounded-xl bg-[#262626] p-3 text-[#F5F0E6]">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#DED7CB]">Employers</p>
          <p className="mt-2 text-sm font-medium">Brief a role</p>
          <div className="mt-2 inline-flex rounded-full bg-[#2F5D50] px-2.5 py-1 text-[10px] text-[#F5F0E6]">
            Start hiring
          </div>
        </div>
        <div className="rounded-xl border border-[#DED7CB] bg-[#F5F0E6] p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#66615B]">Candidates</p>
          <p className="mt-2 text-sm font-medium">See how to apply</p>
          <div className="mt-2 inline-flex rounded-full bg-[#E3EDE8] px-2.5 py-1 text-[10px] font-medium text-[#2F5D50]">
            Browse roles
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsultantScreen({ compact = false }: { compact?: boolean }) {
  return (
    <div className="text-[#171717]">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[#66615B]">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-[#2F5D50]" />
        Independent practice
      </p>
      <p
        className={cn(
          "font-semibold leading-tight tracking-tight",
          compact ? "mt-3 text-sm" : "mt-4 max-w-xs text-2xl"
        )}
      >
        A quieter site for a personal reputation.
      </p>
      {compact ? null : (
        <ul className="mt-4 space-y-2 text-sm text-[#66615B]">
          {["How the work helps", "Where judgement is useful", "What a first conversation covers"].map((item) => (
            <li key={item} className="flex items-start gap-2 border-t border-[#DED7CB] pt-2">
              <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-[#2F5D50]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 inline-flex rounded-full bg-[#2F5D50] px-3 py-1.5 text-[11px] text-[#F5F0E6]">
        Book a consultation
      </div>
    </div>
  );
}

const screens: Record<ProjectVariant, { desktop: ReactNode; mobile: ReactNode; tilt: string }> = {
  "local-service": {
    desktop: <LocalServiceScreen />,
    mobile: <LocalServiceScreen compact />,
    tilt: "md:[transform:perspective(1100px)_rotateY(-6deg)] md:group-hover:[transform:perspective(1100px)_rotateY(0deg)]",
  },
  recruitment: {
    desktop: <RecruitmentScreen />,
    mobile: <RecruitmentScreen compact />,
    tilt: "md:[transform:perspective(1100px)_rotateY(6deg)] md:group-hover:[transform:perspective(1100px)_rotateY(0deg)]",
  },
  consultant: {
    desktop: <ConsultantScreen />,
    mobile: <ConsultantScreen compact />,
    tilt: "md:[transform:perspective(1100px)_rotateX(4deg)] md:group-hover:[transform:perspective(1100px)_rotateX(0deg)]",
  },
};

type ProjectMockupProps = {
  variant: ProjectVariant;
  url: string;
  title: string;
};

export function ProjectMockup({ variant, url, title }: ProjectMockupProps) {
  const screen = screens[variant];
  const phoneOnLeft = variant === "recruitment";

  return (
    <div className="group mx-auto flex w-full max-w-xl flex-col items-center gap-4 md:flex-row md:items-end">
      <div
        className={cn(
          "w-full min-w-0 transition-transform duration-500 motion-reduce:!transform-none",
          phoneOnLeft && "md:order-2",
          screen.tilt
        )}
      >
        <BrowserFrame url={url} label={`${title} desktop concept`}>
          {screen.desktop}
        </BrowserFrame>
      </div>
      <div className={cn("w-32 shrink-0 md:w-28", phoneOnLeft && "md:order-1")}>
        <MobileFrame url={url} label={`${title} mobile concept`}>
          {screen.mobile}
        </MobileFrame>
      </div>
    </div>
  );
}

export function HeroMockup() {
  return (
    <div className="mx-auto w-full max-w-xl md:[transform:perspective(1100px)_rotateY(-5deg)_translateY(8px)] motion-reduce:!transform-none">
      <BrowserFrame url="yourbusiness.com" label="Concept of a professional business homepage">
        <div className="text-[#171717]">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[#66615B]">
            <span className="flex items-center gap-1.5 font-semibold text-[#171717]">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-[#2F5D50]" />
              Your business
            </span>
            <span className="hidden sm:inline">Services · About · Contact</span>
          </div>
          <p className="mt-5 max-w-xs text-2xl font-semibold leading-tight tracking-tight">
            A homepage that tells people what you do.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#66615B]">
            Services, proof of care, and a direct way to enquire.
          </p>
          <div className="mt-5 inline-flex rounded-full bg-[#2F5D50] px-3 py-1.5 text-[11px] text-[#F5F0E6]">
            Get in touch
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {["Offer", "Process", "Contact"].map((item, index) => (
              <div
                key={item}
                className={cn(
                  "flex h-16 items-center justify-center rounded-lg border text-[11px]",
                  index === 0
                    ? "border-transparent bg-[#E3EDE8] font-medium text-[#2F5D50]"
                    : "border-[#DED7CB] bg-[#F5F0E6] text-[#66615B]"
                )}
                aria-hidden="true"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}