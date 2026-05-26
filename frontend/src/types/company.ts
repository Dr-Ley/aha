/** Canonical tenant IDs (DB `companies.id`, URLs, APIs). */
export const COMPANY_IDS = ["aha", "ewc", "bth"] as const;

export type CompanyId = (typeof COMPANY_IDS)[number];

export const COMPANIES = [
  { id: "aha", name: "African Home Adventure" },
  { id: "ewc", name: "Enchoro Wildlife Camp" },
  { id: "bth", name: "Bondo Travellers Hotel" },
] as const satisfies ReadonlyArray<{ id: CompanyId; name: string }>;

export type Company = (typeof COMPANIES)[number];

export const DEFAULT_COMPANY_ID: CompanyId = "aha";

/** AHA + EWC: public safari / tour `bookings` (not hotel stays). */
export function companyUsesSafariTours(id: CompanyId): boolean {
  return id === "aha" || id === "ewc";
}

/** EWC + BTH: `room_types` / `rooms` / `hotel_bookings`. */
export function companyUsesHotelStays(id: CompanyId): boolean {
  return id === "ewc" || id === "bth";
}

/** BTH only: restaurant F&B. */
export function companyUsesRestaurant(id: CompanyId): boolean {
  return id === "bth";
}

/** EWC + BTH: bar POS. */
export function companyUsesBar(id: CompanyId): boolean {
  return id === "ewc" || id === "bth";
}
