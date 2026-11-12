import type { LucideIcon } from "lucide-react";
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
  email: "hello@example.com",
  phoneDisplay: "+254 700 000 000",
  phoneHref: "tel:+254700000000",
  linkedin: "https://www.linkedin.com/in/your-profile",
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

export type ProjectVariant = "local-service" | "recruitment" | "consultant";

export const projects: {
  variant: ProjectVariant;
  title: string;
  concept: string;
  shows: string[];
  url: string;
}[] = [
  {
    variant: "local-service",
    title: "Local Service Business",
    concept: "Transforming a Facebook-based local service business into a professional website.",
    shows: [
      "Professional homepage mockup.",
      "Clear service presentation.",
      "Contact and enquiry form.",
      "Mobile-responsive layout.",
    ],
    url: "local-service.example",
  },
  {
    variant: "recruitment",
    title: "Recruitment Agency",
    concept: "Transforming a basic social media presence into a professional recruitment website.",
    shows: [
      "Corporate-style homepage.",
      "Candidate and employer enquiry pathways.",
      "Clear service presentation.",
      "Professional branding.",
    ],
    url: "recruitment.example",
  },
  {
    variant: "consultant",
    title: "Independent Consultant",
    concept: "Creating a professional online presence for an independent consultant.",
    shows: [
      "Personal brand website.",
      "Services and expertise.",
      "Professional introduction.",
      "Consultation booking CTA.",
    ],
    url: "consultant.example",
  },
];