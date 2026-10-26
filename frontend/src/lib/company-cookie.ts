import type { CompanyId } from "@/types/company";

export const COMPANY_COOKIE = "enzi_company";

/** Cookie assignment written on company selection and on fallback to an allowed company. */
export function companyCookieAssignment(id: CompanyId): string {
  return `${COMPANY_COOKIE}=${id}; path=/; samesite=lax`;
}

/**
 * Normal selection keeps the requested company.
 * Fallback replaces a company the user cannot access with the first allowed id.
 * `changed` is true when the cookie value must be rewritten.
 */
export function companyIdFromCookieHeader(header: string): string | null {
  const raw = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COMPANY_COOKIE}=`));
  if (!raw) return null;
  return decodeURIComponent(raw.slice(COMPANY_COOKIE.length + 1));
}

export function resolveCompanySelection(input: {
  requestedId: CompanyId;
  currentCookie: string | null;
  allowedIds: readonly CompanyId[];
}): { id: CompanyId; cookie: string; changed: boolean } {
  const allowed =
    input.allowedIds.length === 0 || input.allowedIds.includes(input.requestedId)
      ? input.requestedId
      : input.allowedIds[0];
  return {
    id: allowed,
    cookie: companyCookieAssignment(allowed),
    changed: input.currentCookie !== allowed,
  };
}
