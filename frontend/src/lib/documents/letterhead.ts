import type { CompanyId } from "@/types/company";

/** Letterhead blocks matching current AHA / EWC paper forms. */
export type CompanyLetterhead = {
  companyId: CompanyId;
  legalName: string;
  tagline?: string;
  lines: string[];
  phones: string[];
  email: string;
  website: string;
  whatsapp?: string;
  reservationEmail?: string;
  /** Image URL or same-origin path from `companies.logo`. */
  logo: string | null;
};

export const COMPANY_LETTERHEADS: Record<"aha" | "ewc" | "bth", CompanyLetterhead> = {
  aha: {
    companyId: "aha",
    legalName: "African Home Adventure Safaris",
    tagline: "Tours, Safaris & Car Hire",
    lines: ["YWCA Parkview Suites Ground Floor, Nyerere Road, Nairobi, Kenya"],
    phones: ["+254 722 760 661 / +254 793852450"],
    email: "info@africahomeadventure.com",
    website: "www.africanhomeadventure.com",
    logo: "/AHA_STATIC.png",
  },
  ewc: {
    companyId: "ewc",
    legalName: "Enchoro Wildlife Camp",
    tagline: "Masai Mara Game Reserve",
    lines: [
      "YMCA, Park View Suite, Ground Floor, Nyerere Road",
      "opp. Central Park, Nairobi",
    ],
    phones: ["+254 710 322 787"],
    email: "info@enchorowildlifecamp.com",
    website: "www.enchorowildlifecamp.com",
    whatsapp: "+254 793 852 450",
    reservationEmail: "reservation@enchorowildlifecamp.com",
    logo: "/EWClogo.png",
  },
  bth: {
    companyId: "bth",
    legalName: "Bondo Travellers Hotel",
    tagline: "Hotel stays & hospitality",
    lines: ["Bondo, Kenya"],
    phones: ["+254 740751127"],
    email: "info@bondotravelershotel.com",
    website: "www.bondotravelershotel.com",
    logo: null,
  },
};

export function getCompanyLetterhead(
  companyId: string,
  options?: { logo?: string | null }
): CompanyLetterhead {
  const base =
    companyId === "ewc" || companyId === "bth" || companyId === "aha"
      ? COMPANY_LETTERHEADS[companyId]
      : COMPANY_LETTERHEADS.aha;
  const override = options?.logo?.trim();
  return { ...base, logo: override || base.logo };
}

/** Amount in words for receipt forms (KES whole shillings, simple). */
export function amountInWordsKes(amount: number): string {
  const n = Math.max(0, Math.round(Number(amount) || 0));
  if (n === 0) return "Zero shillings only";
  const words = numberToWords(n);
  return `${capitalize(words)} shillings only`;
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function numberToWords(n: number): string {
  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

  if (n < 20) return ones[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o ? `${tens[t]}-${ones[o]}` : tens[t];
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return rest ? `${ones[h]} hundred and ${numberToWords(rest)}` : `${ones[h]} hundred`;
  }
  if (n < 1_000_000) {
    const th = Math.floor(n / 1000);
    const rest = n % 1000;
    return rest
      ? `${numberToWords(th)} thousand ${numberToWords(rest)}`
      : `${numberToWords(th)} thousand`;
  }
  const mil = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  return rest
    ? `${numberToWords(mil)} million ${numberToWords(rest)}`
    : `${numberToWords(mil)} million`;
}
