import type { Metadata } from "next";
import HomePage from "./home-page";
import { withCanonical } from "@/lib/site-url";

export const metadata: Metadata = withCanonical("/", {
  title: "African Home Adventure Safaris| Kenya & Tanzania Safari Tours",
  description:
    "Premium safari tours in Kenya and Tanzania. Over 25 years of experience creating unforgettable African wildlife adventures. KATO certified tour operator.",
  keywords:
    "Kenya safari, Tanzania safari, Masai Mara, Serengeti, African adventure, wildlife tours, safari booking",
});

export default function Page() {
  return <HomePage />;
}
