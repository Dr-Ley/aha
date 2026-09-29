import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import {
  canAccessDashboardFromSession,
  getUserIdFromSession,
} from "@/lib/permissions-server";
import { requireCompanyId, type RequiredCompanyIdResult } from "@/lib/tenant";

export type AuthenticatedResult =
  | { ok: true; session: Session; userId: number }
  | { ok: false; response: NextResponse };

export async function requireAuthenticatedUser(
  session?: Session | null
): Promise<AuthenticatedResult> {
  const resolved = session ?? (await auth());
  const userId = getUserIdFromSession(resolved);
  if (!userId || !resolved) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, session: resolved, userId };
}

export async function requireStaffUser(
  session?: Session | null
): Promise<AuthenticatedResult> {
  const authResult = await requireAuthenticatedUser(session);
  if (!authResult.ok) return authResult;
  if (!(await canAccessDashboardFromSession(authResult.session))) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return authResult;
}

export function requireCompanyIdFromSearchParams(
  searchParams: URLSearchParams,
  key = "companyId"
): RequiredCompanyIdResult {
  return requireCompanyId(searchParams.get(key));
}
