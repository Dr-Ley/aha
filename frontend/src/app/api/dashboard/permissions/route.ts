import { NextResponse } from "next/server";
import { requireStaffUser } from "@/server/tenancy";
import { loadUserPermissionPayload } from "@/lib/permissions-server";
import { ensureOverviewPermissionModuleEnum } from "@/lib/ensure-permission-module-enum";

export async function GET() {
  try {
    await ensureOverviewPermissionModuleEnum();
    const staff = await requireStaffUser();
    if (!staff.ok) return staff.response;
    const payload = await loadUserPermissionPayload(staff.userId, staff.session.user?.role);
    return NextResponse.json({ success: true, ...payload });
  } catch (e) {
    console.error("dashboard/permissions GET", e);
    return NextResponse.json({ error: "Failed to load permissions" }, { status: 500 });
  }
}
