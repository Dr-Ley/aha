import { NextResponse } from "next/server";
import { COMPANIES, type CompanyId } from "@/types/company";

/** Strict parse — returns null when missing or invalid. Never falls back to a default tenant. */
export function parseCompanyId(raw: string | null | undefined): CompanyId | null {
  if (raw == null || raw.trim() === "") return null;
  const id = raw.trim();
  return COMPANIES.some((c) => c.id === id) ? (id as CompanyId) : null;
}

export function isValidCompanyId(raw: string): raw is CompanyId {
  return parseCompanyId(raw) !== null;
}

export type RequiredCompanyIdResult =
  | { ok: true; companyId: CompanyId }
  | { ok: false; response: NextResponse };

/** Returns 400 when companyId is missing or not a known tenant. */
export function requireCompanyId(
  raw: string | null | undefined,
  message = "Valid companyId is required"
): RequiredCompanyIdResult {
  const companyId = parseCompanyId(raw);
  if (!companyId) {
    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 400 }),
    };
  }
  return { ok: true, companyId };
}
