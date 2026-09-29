import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser, requireStaffUser } from "@/lib/api-auth";
import type { DashboardModuleId } from "@/lib/dashboard-modules";
import { getActiveMembership } from "@/lib/membership";
import type { MembershipRole } from "@/lib/membership-role";
import {
  checkAnyApiPermission,
  checkApiPermission,
  checkOverviewApi,
  getEffectiveUserRole,
} from "@/lib/permissions-server";
import { isAdminRole } from "@/lib/roles";
import { requireCompanyId } from "@/lib/tenant";
import type { CompanyId } from "@/types/company";

export type TenantContext = {
  companyId: CompanyId;
  userId: number;
  membershipId: number | null;
  role: MembershipRole | "platform_admin";
  session: Session;
};

export type TenantContextResult =
  | { ok: true; ctx: TenantContext }
  | { ok: false; response: NextResponse };

export type TenantContextOptions = {
  module?: DashboardModuleId | DashboardModuleId[];
  requireEdit?: boolean;
  overview?: boolean;
};

/**
 * Per-request tenant context from the session + membership.
 * Company id from the client is validated, then authorized — never trusted alone.
 */
export async function requireTenantContext(
  rawCompanyId: string | null | undefined,
  options: TenantContextOptions = {}
): Promise<TenantContextResult> {
  const staff = await requireStaffUser();
  if (!staff.ok) return staff;

  const company = requireCompanyId(rawCompanyId);
  if (!company.ok) return company;

  const requireEdit = options.requireEdit === true;
  const denied = options.overview
    ? await checkOverviewApi(staff.session, company.companyId)
    : Array.isArray(options.module)
      ? await checkAnyApiPermission(staff.session, company.companyId, options.module, requireEdit)
      : options.module
        ? await checkApiPermission(staff.session, company.companyId, options.module, requireEdit)
        : await checkOverviewApi(staff.session, company.companyId);
  if (denied) return { ok: false, response: denied };

  const membership = await getActiveMembership(staff.userId, company.companyId);
  const platformRole = await getEffectiveUserRole(staff.userId, staff.session.user?.role);
  const isPlatformAdmin = isAdminRole(platformRole);
  if (!membership && !isPlatformAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    ctx: {
      companyId: company.companyId,
      userId: staff.userId,
      membershipId: membership?.id ?? null,
      role: isPlatformAdmin && !membership ? "platform_admin" : (membership?.role ?? "sales"),
      session: staff.session,
    },
  };
}

export { requireAuthenticatedUser, requireStaffUser };
