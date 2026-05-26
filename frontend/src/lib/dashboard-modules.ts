/**
 * Dashboard RBAC modules — keep in sync with `permission_module` enum in schema.
 * Adding a module: update DB enum (migration), this list, and sidebar mapping.
 */
export const DASHBOARD_MODULE_IDS = [
  "overview",
  "tours",
  "accommodation",
  "restaurant",
  "bar",
  "bookings",
  "payments",
  "expenses",
  "enquiries",
] as const;

export type DashboardModuleId = (typeof DASHBOARD_MODULE_IDS)[number];

export function isDashboardModuleId(v: string): v is DashboardModuleId {
  return (DASHBOARD_MODULE_IDS as readonly string[]).includes(v);
}

/** Revenue UI follows payments access. */
export function moduleForRevenue(): DashboardModuleId {
  return "payments";
}
