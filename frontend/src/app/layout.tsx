import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/lib/currency-context";
import { SessionProvider } from "@/components/session-provider";
import { AuthProvider } from "@/lib/auth-context";
import { LikesProvider } from "@/lib/likes-context";
import { SITE_URL } from "@/lib/site-url";
import { Analytics } from "@vercel/analytics/next";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="aha"
      className={`${dmSans.variable} ${playfair.variable}`}
    >
      <body className="font-sans antialiased flex min-h-screen min-w-0 flex-col">
        <SessionProvider>
          <AuthProvider>
            <LikesProvider>
              <CurrencyProvider>
                <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">{children}</div>
              </CurrencyProvider>
            </LikesProvider>
          </AuthProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
