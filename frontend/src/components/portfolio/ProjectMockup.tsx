"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type FrameProps = {
  url: string;
  children: ReactNode;
  className?: string;
  label: string;
  media?: boolean;
};

export function BrowserFrame({ url, children, className, label, media = false }: FrameProps) {
  return (
    <div
      role={media ? undefined : "img"}
      aria-label={media ? undefined : label}
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
      {media ? children : <div className="p-4 sm:p-5">{children}</div>}
    </div>
  );
}

function MobileFrame({
  url,
  children,
  label,
  media = false,
}: {
  url: string;
  children: ReactNode;
  label: string;
  media?: boolean;
}) {
  return (
    <div
      role={media ? undefined : "img"}
      aria-label={media ? undefined : label}
      className="overflow-hidden rounded-[1.4rem] border border-[#DED7CB] bg-[#FCFAF5] shadow-[0_18px_40px_-28px_rgba(23,23,23,0.7)]"
    >
      <div className="flex justify-center border-b border-[#DED7CB] px-2 py-1.5">
        <span className="h-1 w-10 rounded-full bg-[#DED7CB]" aria-hidden="true" />
        <span className="sr-only">{url}</span>
      </div>
      {media ? children : <div className="p-3">{children}</div>}
    </div>
  );
}

function FrameVideo({ src, label, aspect }: { src: string; label: string; aspect: "desktop" | "mobile" }) {
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    if (reduce) {
      video.pause();
      return;
    }
    void video.play().catch(() => {});
  }, [reduce, src]);

  return (
    <video
      ref={videoRef}
      className={cn(
        "w-full bg-[#171717] object-cover object-top",
        aspect === "desktop" ? "aspect-[16/10]" : "aspect-[9/16]"
      )}
      src={src}
      aria-label={label}
      muted
      loop
      playsInline
      autoPlay={reduce !== true}
      controls={reduce === true}
      preload={reduce ? "metadata" : "auto"}
    />
  );
}

type ProjectMockupProps = {
  url: string;
  title: string;
  videos: { desktop: string; mobile: string };
};

export function ProjectMockup({ url, title, videos }: ProjectMockupProps) {
  return (
    <div className="group mx-auto flex w-full max-w-xl flex-col items-center gap-4 md:flex-row md:items-end">
      <div className="w-full min-w-0 transition-transform duration-500 motion-reduce:!transform-none md:[transform:perspective(1100px)_rotateY(-6deg)] md:group-hover:[transform:perspective(1100px)_rotateY(0deg)]">
        <BrowserFrame url={url} label={`${title} desktop`} media>
          <FrameVideo src={videos.desktop} label={`${title} on desktop`} aspect="desktop" />
        </BrowserFrame>
      </div>
      <div className="w-32 shrink-0 md:w-28">
        <MobileFrame url={url} label={`${title} on mobile`} media>
          <FrameVideo src={videos.mobile} label={`${title} on a phone`} aspect="mobile" />
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