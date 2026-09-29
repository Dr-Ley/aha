import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COMPANY_COOKIE } from "@/lib/company-cookie";
import type { DashboardModuleId } from "@/lib/dashboard-modules";
import { listActiveMemberships } from "@/lib/membership";
import { parseCompanyId } from "@/lib/tenant";
import { requireStaffUser, requireTenantContext } from "@/server/tenancy";

export const CUSTOMER_MODULES: DashboardModuleId[] = ["bookings", "tours", "accommodation"];

export async function requireCustomersTenant(
  searchCompanyId?: string | null,
  requireEdit = false
) {
  const staff = await requireStaffUser();
  if (!staff.ok) redirect("/login");

  const cookieStore = await cookies();
  const raw =
    parseCompanyId(searchCompanyId) ??
    parseCompanyId(cookieStore.get(COMPANY_COOKIE)?.value) ??
    (await listActiveMemberships(staff.userId))[0]?.companyId ??
    null;

  const tenant = await requireTenantContext(raw, {
    module: CUSTOMER_MODULES,
    requireEdit,
  });
  if (!tenant.ok) {
    if (tenant.response.status === 401) redirect("/login");
    redirect("/");
  }
  return tenant.ctx;
}
