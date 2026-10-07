import type { Metadata } from "next";
import { withCanonical } from "@/lib/site-url";

export const metadata: Metadata = withCanonical("/visa", {
  title: "Kenya & Tanzania Visa Guide | African Home Adventure",
  description:
    "eTA and visa requirements for Kenya and Tanzania safari travel.",
});

export default function VisaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
