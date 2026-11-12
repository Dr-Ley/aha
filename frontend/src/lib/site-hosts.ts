/**
 * Host map for this deployment.
 *
 * African Home Adventure keeps every current URL, including on localhost
 * and preview hosts. A dedicated portfolio host rewrites its public paths
 * to `/portfolio` and never replaces the safari homepage.
 * Staff, auth, and API paths stay on their existing URLs for every host.
 */

export const SITE_HEADER = "x-site-id";

export const AHA_HOSTS = ["www.africanhomeadventure.com", "africanhomeadventure.com"] as const;

export type SiteId = "aha" | "portfolio";

const RESERVED_AHA_HOSTS = new Set<string>(AHA_HOSTS);

const SHARED_PREFIXES = ["/dashboard", "/print", "/login", "/api", "/portfolio", "/shop"] as const;

export function hostnameFromHeader(hostHeader: string | null): string {
  const first = (hostHeader ?? "").split(",")[0] ?? "";
  return first.trim().toLowerCase().replace(/:\d+$/, "");
}

export function portfolioHostsFromEnv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((host) => host.trim().toLowerCase().replace(/:\d+$/, ""))
    .filter((host) => host.length > 0 && !RESERVED_AHA_HOSTS.has(host));
}

export function siteIdForHostname(hostname: string, portfolioHosts: readonly string[]): SiteId {
  if (RESERVED_AHA_HOSTS.has(hostname)) return "aha";
  if (portfolioHosts.includes(hostname)) return "portfolio";
  return "aha";
}

export function siteIdFromHost(hostHeader: string | null): SiteId {
  return siteIdForHostname(hostnameFromHeader(hostHeader), portfolioHostsFromEnv(process.env.PORTFOLIO_HOSTS));
}

function isSharedPath(pathname: string): boolean {
  return SHARED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Internal rewrite, or null when the browser path should be served as-is. */
export function rewritePathForSite(siteId: SiteId, pathname: string): string | null {
  if (siteId !== "portfolio") return null;
  if (isSharedPath(pathname)) return null;
  return "/portfolio";
}
