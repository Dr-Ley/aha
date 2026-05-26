/** Roles that may use the internal SaaS dashboard (Phase 1). `staff` is legacy DB compatibility. */
export const DASHBOARD_ROLES = ["admin", "operations", "finance", "staff"] as const;

export type AppUserRole =
  | "customer"
  | "admin"
  | "operations"
  | "finance"
  | "staff";

export function normalizeRole(role: string | undefined | null): string | undefined {
  const s = String(role ?? "").trim();
  return s === "" ? undefined : s.toLowerCase();
}

export function canAccessDashboard(role: string | undefined | null): boolean {
  const r = normalizeRole(role);
  if (!r) return false;
  return (DASHBOARD_ROLES as readonly string[]).includes(r);
}

export function isAdminRole(role: string | undefined | null): boolean {
  return normalizeRole(role) === "admin";
}
