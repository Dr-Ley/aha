export const MEMBERSHIP_ROLES = [
  "owner",
  "admin",
  "sales",
  "operations",
  "guide",
  "finance",
] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const MEMBERSHIP_STATUSES = ["active", "invited", "suspended"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

/** Map the existing global `users.role` onto a per-company membership role. */
export function mapGlobalRoleToMembershipRole(
  globalRole: string | null | undefined
): MembershipRole {
  const r = String(globalRole ?? "").trim().toLowerCase();
  if (r === "admin") return "owner";
  if (r === "finance") return "finance";
  if (r === "operations" || r === "staff") return "operations";
  return "sales";
}

export type MembershipDraft = {
  companyId: string;
  role: MembershipRole;
  status: MembershipStatus;
};

/**
 * Keep existing per-company role/status when company access is unchanged.
 * New companies get `defaultRole` + active. Overrides win when present.
 */
export function mergeMemberships(args: {
  existing: MembershipDraft[];
  companyIds: string[];
  defaultRole: MembershipRole;
  overrides?: MembershipDraft[];
}): MembershipDraft[] {
  const existingByCompany = new Map(args.existing.map((row) => [row.companyId, row]));
  const overrideByCompany = new Map((args.overrides ?? []).map((row) => [row.companyId, row]));
  const uniqueIds = [...new Set(args.companyIds)];

  return uniqueIds.map((companyId) => {
    const override = overrideByCompany.get(companyId);
    if (override) {
      return { companyId, role: override.role, status: override.status };
    }
    const existing = existingByCompany.get(companyId);
    if (existing) {
      return { companyId, role: existing.role, status: existing.status };
    }
    return { companyId, role: args.defaultRole, status: "active" };
  });
}

/** Owner and company admin have full module access for that tenant. */
export function membershipGrantsFullCompanyAccess(
  role: MembershipRole | null | undefined,
  status: MembershipStatus | null | undefined
): boolean {
  return status === "active" && (role === "owner" || role === "admin");
}

/**
 * Tenant API / UI access for one company.
 * Platform `users.role = admin` remains a superuser.
 * Company owner/admin membership is enough without module permission rows.
 */
export function canProceedTenantAccess(args: {
  isPlatformAdmin: boolean;
  membership: { role: MembershipRole; status: MembershipStatus } | null;
  hasModuleAccess: boolean;
}): boolean {
  if (args.isPlatformAdmin) return true;
  if (!args.membership || args.membership.status !== "active") return false;
  if (membershipGrantsFullCompanyAccess(args.membership.role, args.membership.status)) {
    return true;
  }
  return args.hasModuleAccess;
}
