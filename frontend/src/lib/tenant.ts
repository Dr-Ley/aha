import { COMPANIES, DEFAULT_COMPANY_ID, type CompanyId } from "@/types/company";

export function resolveCompanyId(
  raw: string | null | undefined,
  fallback: CompanyId = DEFAULT_COMPANY_ID
): CompanyId {
  if (!raw) return fallback;
  const id = raw.trim();
  return COMPANIES.some((c) => c.id === id) ? (id as CompanyId) : fallback;
}

export function isValidCompanyId(raw: string): raw is CompanyId {
  return COMPANIES.some((c) => c.id === raw);
}
