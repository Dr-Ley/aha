import type { Metadata, Viewport } from "next";
import { SiteChrome } from "@/components/site-chrome";
import { JsonLd } from "@/components/json-ld";
import { organizationJsonLd } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "African Home Adventure Safaris| Kenya & Tanzania Safari Tours",
  description:
    "Premium safari tours in Kenya and Tanzania. Over 25 years of experience creating unforgettable African wildlife adventures. KATO certified tour operator.",
  keywords:
    "Kenya safari, Tanzania safari, Masai Mara, Serengeti, African adventure, wildlife tours, safari booking",
  openGraph: {
    type: "website",
    siteName: "African Home Adventure",
    images: [{ url: "/AHA_logo.png", alt: "African Home Adventure" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2D5A3D",
};

/** Public African Home Adventure site. Route group does not change URLs. */
export default function AhaSiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <SiteChrome>{children}</SiteChrome>
    </>
  );
}
