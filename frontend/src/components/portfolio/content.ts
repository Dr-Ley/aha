import type { LucideIcon } from "lucide-react";
import { portfolioBrandsKeVideos, portfolioDemoVideos } from "@/lib/shop-images";
import {
  Briefcase,
  Building2,
  Facebook,
  Handshake,
  Inbox,
  Instagram,
  Mail,
  MessageSquare,
  Monitor,
  MonitorOff,
  PanelsTopLeft,
  Search,
  Smartphone,
  Timer,
  Users,
} from "lucide-react";

export const portfolioMeta = {
  title: "Solutions Architect | Websites & Digital Solutions for Growing Businesses",
  description:
    "Helping small businesses establish a professional online presence through website development, landing pages and practical digital solutions.",
};

export const brand = {
  mark: "Sol.",
  name: "Solutions Architect",
};

export const navItems = [
  { id: "home", label: "Home" },
  { id: "problem", label: "The Problem" },
  { id: "services", label: "Services" },
  { id: "projects", label: "Projects" },
  { id: "why-me", label: "Why Me" },
  { id: "contact", label: "Contact" },
] as const;

export type PortfolioSectionId = (typeof navItems)[number]["id"];

/** Placeholder channels until personal contact details are supplied. */
export const contactChannels = {
  email: "bradleyouko911@gmail.com",
  phoneDisplay: "+254 700 000 000",
  phoneHref: "tel:+447887258617",
  linkedin: "https://www.linkedin.com/in/bradley-ouko-59626123b/",
};

export const problemPoints: { label: string; icon: LucideIcon; accent?: boolean }[] = [
  { label: "Active on Facebook.", icon: Facebook },
  { label: "Active on Instagram.", icon: Instagram },
  { label: "Getting business through referrals.", icon: Users },
  { label: "No professional website.", icon: MonitorOff, accent: false },
  { label: "Missing potential enquiries.", icon: Inbox, accent: false },
  { label: "Looking less established than competitors.", icon: Building2 },
];

export const services: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Website Development",
    body: "Professional, responsive websites that communicate your business clearly and make it easy for customers to get in touch.",
    icon: Monitor,
  },
  {
    title: "Landing Page Development",
    body: "Focused landing pages designed to communicate your offering and encourage visitors to take action.",
    icon: PanelsTopLeft,
  },
  {
    title: "Digital Presence Setup",
    body: "Get the essentials in place, including domain configuration, professional email, contact forms, analytics and website launch.",
    icon: Mail,
  },
  {
    title: "Website Audits",
    body: "Identify usability issues, missed opportunities, performance concerns and improvements that could strengthen your online presence.",
    icon: Search,
  },
];

export const whyReasons: { title: string; icon: LucideIcon }[] = [
  { title: "Business-focused approach.", icon: Briefcase },
  { title: "Fast and efficient delivery.", icon: Timer },
  { title: "Mobile-first development.", icon: Smartphone },
  { title: "SEO-ready foundations.", icon: Search },
  { title: "Clear communication.", icon: MessageSquare },
  { title: "Direct collaboration without unnecessary agency overhead.", icon: Handshake },
];

export const projects: {
  label: string;
  title: string;
  concept: string;
  shows: string[];
  url: string;
  videos: { desktop: string; mobile: string };
}[] = [
  {
    label: "Client demo project",
    title: "Lad & Lass",
    concept: "A clothing store for a Nairobi label, with the shop laid out for desktop and mobile.",
    shows: [
      "Desktop storefront.",
      "Mobile shopping layout.",
      "Product browsing and cart.",
      "Checkout on the same site.",
    ],
    url: "ladandlass.co.ke",
    videos: {
      desktop: `/api/shop/media/${portfolioDemoVideos.desktop}`,
      mobile: `/api/shop/media/${portfolioDemoVideos.mobile}`,
    },
  },
  {
    label: "Client demo project",
    title: "Brands KE",
    concept: "A clothing shop curated for Kenya, with the same store laid out for desktop and mobile.",
    shows: [
      "Desktop storefront.",
      "Mobile shopping layout.",
      "Product browsing and cart.",
      "Checkout on the same site.",
    ],
    url: "brandske.co.ke",
    videos: {
      desktop: `/api/shop/media/${portfolioBrandsKeVideos.desktop}`,
      mobile: `/api/shop/media/${portfolioBrandsKeVideos.mobile}`,
    },
  },
];