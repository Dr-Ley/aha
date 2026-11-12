import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { portfolioMeta } from "@/components/portfolio/content";
import { canvasClass } from "@/components/portfolio/styles";
import { SITE_URL } from "@/lib/site-url";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-portfolio",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const canonical = `${SITE_URL}/portfolio`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: portfolioMeta.title,
  description: portfolioMeta.description,
  alternates: { canonical },
  openGraph: {
    type: "website",
    url: canonical,
    title: portfolioMeta.title,
    description: portfolioMeta.description,
    siteName: "Solutions Architect",
  },
};

const NOISE_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E";

export default function PortfolioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      data-portfolio-root
      className={`${manrope.variable} ${fraunces.variable} ${canvasClass} relative flex min-h-screen flex-1 flex-col text-[#171717] antialiased selection:bg-[#171717] selection:text-[#F5F0E6]`}
      style={{ fontFamily: "var(--font-portfolio), Manrope, ui-sans-serif, system-ui, sans-serif" }}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          html:has([data-portfolio-root]) { scroll-behavior: smooth; }
        }
        .font-display { font-family: var(--font-display), Georgia, "Times New Roman", serif; }
        .portfolio-canvas {
          background-image: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%);
          background-attachment: fixed;
        }
        .portfolio-night {
          background-image: linear-gradient(to top, #09203f 0%, #537895 100%);
        }
        .portfolio-noise {
          background-image: url("${NOISE_SVG}");
          opacity: 0.035;
        }
        .texture-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 48px 48px;
        }
      `}</style>
      <div aria-hidden="true" className="portfolio-noise pointer-events-none fixed inset-0 z-[5]" />
      <a
        href="#home"
        className="absolute left-4 top-4 z-50 -translate-y-24 rounded-full bg-[#171717] px-4 py-2 text-sm text-[#F5F0E6] focus:translate-y-0"
      >
        Skip to content
      </a>
      {children}
    </div>
  );
}