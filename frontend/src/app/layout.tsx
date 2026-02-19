import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

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
  title: "African Home Adventure | Kenya & Tanzania Safari Tours",
  description:
    "Premium safari tours in Kenya and Tanzania. Over 25 years of experience creating unforgettable African wildlife adventures. KATO certified tour operator.",
  keywords:
    "Kenya safari, Tanzania safari, Masai Mara, Serengeti, African adventure, wildlife tours, safari booking",
};

export const viewport: Viewport = {
  themeColor: "#2D5A3D",
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
    <html lang="en" data-theme="aha" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
