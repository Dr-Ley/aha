import { cn } from "@/lib/utils";

/** Soft blurred accent blob. Absolutely positioned by the caller. */
export function AccentBlob({
  className,
  opacity = 0.22,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute rounded-full blur-3xl", className)}
      style={{ background: `radial-gradient(closest-side, rgba(47,93,80,${opacity}), transparent)` }}
    />
  );
}

/** Thin outlined decorative ring. Absolutely positioned by the caller. */
export function Ring({
  className,
  color = "rgba(47,93,80,0.28)",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute rounded-full border", className)}
      style={{ borderColor: color }}
    />
  );
}
