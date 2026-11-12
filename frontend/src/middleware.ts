import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import { rewritePathForSite, SITE_HEADER, siteIdFromHost } from "@/lib/site-hosts";

const { auth } = NextAuth(authConfig);

function withSiteHeader(req: { headers: Headers }, siteId: string) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(SITE_HEADER, siteId);
  return requestHeaders;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const siteId = siteIdFromHost(req.headers.get("host") ?? req.headers.get("x-forwarded-host"));
  const requestHeaders = withSiteHeader(req, siteId);
  const isLoggedIn = !!req.auth;

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/print")) {
    if (!isLoggedIn) {
      const login = new URL("/login", req.nextUrl.origin);
      login.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
      return NextResponse.redirect(login);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (pathname === "/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const rewritePath = rewritePathForSite(siteId, pathname);
  if (rewritePath) {
    const url = req.nextUrl.clone();
    url.pathname = rewritePath;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff2?)$).*)",
  ],
};
