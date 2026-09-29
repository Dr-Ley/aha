export type TravellerCounts = {
  adults: number;
  children: number;
  infants: number;
};

export function travellerHeadcount(counts: TravellerCounts): number {
  return counts.adults + counts.children + counts.infants;
}

/** Infants may still have a catalog rate; this is headcount of non-infant travellers only. */
export function payingTravellerCount(counts: TravellerCounts): number {
  return Math.max(0, counts.adults + counts.children);
}

export function normalizeTravellerCounts(input: {
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  /** Legacy single guest count — treated as adults when age split is omitted. */
  guests?: number | null;
}): TravellerCounts {
  const hasSplit =
    input.adults != null || input.children != null || input.infants != null;
  if (!hasSplit) {
    const guests = Math.max(0, Math.floor(Number(input.guests ?? 0)));
    return { adults: guests, children: 0, infants: 0 };
  }
  return {
    adults: Math.max(0, Math.floor(Number(input.adults ?? 0))),
    children: Math.max(0, Math.floor(Number(input.children ?? 0))),
    infants: Math.max(0, Math.floor(Number(input.infants ?? 0))),
  };
}

export function travellerCountsLabel(counts: TravellerCounts): string {
  const parts: string[] = [];
  if (counts.adults) parts.push(`${counts.adults} adult${counts.adults === 1 ? "" : "s"}`);
  if (counts.children) parts.push(`${counts.children} child${counts.children === 1 ? "" : "ren"}`);
  if (counts.infants) parts.push(`${counts.infants} infant${counts.infants === 1 ? "" : "s"}`);
  return parts.join(", ") || "No travellers";
}

export type OccupantGuest = {
  name: string;
  email: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isGuestEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function parseOccupantGuests(raw: unknown): OccupantGuest[] {
  if (!Array.isArray(raw)) return [];
  const guests: OccupantGuest[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const name = item.trim();
      if (name) guests.push({ name, email: "" });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const row = item as { name?: unknown; email?: unknown; fullName?: unknown };
    const name =
      typeof row.name === "string"
        ? row.name.trim()
        : typeof row.fullName === "string"
          ? row.fullName.trim()
          : "";
    const email = typeof row.email === "string" ? row.email.trim() : "";
    if (name) guests.push({ name, email });
  }
  return guests;
}

export function parseOccupantNames(raw: unknown): string[] {
  return parseOccupantGuests(raw).map((guest) => guest.name);
}

export function occupantGuestLabel(guest: OccupantGuest): string {
  return guest.email ? `${guest.name} (${guest.email})` : guest.name;
}
