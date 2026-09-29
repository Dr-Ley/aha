export function normalizeCustomerEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function usableCustomerEmail(email: string | null | undefined): string | null {
  if (email == null) return null;
  const normalized = normalizeCustomerEmail(email);
  if (!normalized.includes("@") || normalized.length > 255) return null;
  return normalized;
}

/** Digits only; Kenyan 07xx / 2547xx values compare on the last 9 digits. */
export function phoneMatchKey(phone: string | null | undefined): string | null {
  if (phone == null) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return null;
  return digits.slice(-9);
}

export function phonesMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const left = phoneMatchKey(a);
  const right = phoneMatchKey(b);
  return left != null && left === right;
}

export function normalizePersonName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function displayCustomerName(row: {
  firstName: string;
  lastName?: string | null;
}): string {
  return [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
}

/** Exact normalized name only. Never used for automatic merges. */
export function namesLikelySame(a: string, b: string): boolean {
  const left = normalizePersonName(a);
  const right = normalizePersonName(b);
  return left.length > 0 && left === right;
}

export type CustomerGuestInput = {
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
};

export type CustomerDraft = {
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  country: string | null;
};

/** First token is given name; the rest is family name. Empty input becomes Guest. */
export function splitPersonName(fullName: string): { firstName: string; lastName: string | null } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Guest", lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export type HotelGuestInput = {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
};

/**
 * Snapshot fields for a customer profile. Email is optional.
 * Automatic matching still requires `draft.email`.
 */
export function customerDraftFromGuest(input: CustomerGuestInput): CustomerDraft | null {
  const firstName = input.firstName.trim() || "Guest";
  const lastName = input.lastName?.trim() || null;
  const phone = input.phone?.trim() || null;
  const place = input.country?.trim() || null;
  const email = usableCustomerEmail(input.email);
  if (!input.firstName.trim() && !email && !phone) return null;
  return {
    firstName,
    lastName,
    email,
    phone,
    nationality: place,
    country: place,
  };
}

/** Hotel stays store a single full name; email is not required for a draft. */
export function customerDraftFromHotelGuest(input: HotelGuestInput): CustomerDraft | null {
  const { firstName, lastName } = splitPersonName(input.fullName);
  return customerDraftFromGuest({
    firstName,
    lastName,
    email: input.email,
    phone: input.phone,
    country: input.country,
  });
}

/** Automatic create/link is email-only so two "John Kamau" walk-ins are never merged. */
export function canAutoMatchCustomer(draft: CustomerDraft | null): draft is CustomerDraft & { email: string } {
  return draft?.email != null && draft.email.includes("@");
}

/** Fill blank profile fields from a newer booking; never overwrite non-empty values. */
export function mergeCustomerProfile(
  existing: CustomerDraft,
  incoming: CustomerDraft
): CustomerDraft {
  return {
    firstName: existing.firstName.trim() ? existing.firstName : incoming.firstName,
    lastName: existing.lastName?.trim() ? existing.lastName : incoming.lastName,
    email: existing.email?.trim() ? existing.email : incoming.email,
    phone: existing.phone?.trim() ? existing.phone : incoming.phone,
    nationality: existing.nationality?.trim() ? existing.nationality : incoming.nationality,
    country: existing.country?.trim() ? existing.country : incoming.country,
  };
}

export type CustomerMatchReason = "email" | "phone" | "name";

export function rankCustomerMatch(
  guest: { fullName: string; email?: string | null; phone?: string | null },
  customer: {
    firstName: string;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  }
): CustomerMatchReason | null {
  const guestEmail = usableCustomerEmail(guest.email);
  const customerEmail = usableCustomerEmail(customer.email);
  if (guestEmail && customerEmail && guestEmail === customerEmail) return "email";
  if (phonesMatch(guest.phone, customer.phone)) return "phone";
  if (namesLikelySame(guest.fullName, displayCustomerName(customer))) return "name";
  return null;
}

export function matchReasonLabel(reason: CustomerMatchReason): string {
  switch (reason) {
    case "email":
      return "Same email";
    case "phone":
      return "Same phone";
    case "name":
      return "Same name — confirm this is the same person";
  }
}
