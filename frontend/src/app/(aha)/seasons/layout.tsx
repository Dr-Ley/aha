import type { Metadata } from "next";
import { withCanonical } from "@/lib/site-url";

export const metadata: Metadata = withCanonical("/seasons", {
  title: "Seasons & Pricing | African Home Adventure",
  description:
    "Best time to visit Kenya and Tanzania for wildlife, weather, and safari pricing.",
});

export default function SeasonsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
