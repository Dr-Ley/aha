import type { Metadata } from "next";

/** Public site origin. Must match the Vercel production host (www). */
export const SITE_URL = "https://www.africanhomeadventure.com";

/** Absolute www URL for a site path (`/` or `/tours/...`). */
export function absoluteUrl(path: string = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    const parsed = new URL(path);
    return `${SITE_URL}${parsed.pathname}${parsed.search}`;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return SITE_URL;
  return `${SITE_URL}${normalized}`;
}

/** Canonical and Open Graph URL on the www host. */
export function withCanonical(path: string, metadata: Metadata = {}): Metadata {
  const url = absoluteUrl(path);
  const { openGraph, alternates, ...rest } = metadata;
  const title = rest.title;
  const description = rest.description;
  return {
    ...rest,
    alternates: {
      ...alternates,
      canonical: url,
    },
    openGraph: {
      type: "website",
      siteName: "African Home Adventure",
      ...(typeof title === "string" ? { title } : {}),
      ...(typeof description === "string" ? { description } : {}),
      ...openGraph,
      url,
    },
  };
}
