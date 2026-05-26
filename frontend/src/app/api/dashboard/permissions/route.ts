import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import {
  getEffectiveUserRole,
  getUserIdFromSession,
  loadUserPermissionPayload,
} from "@/lib/permissions-server";
import { ensureOverviewPermissionModuleEnum } from "@/lib/ensure-permission-module-enum";

export async function GET() {
  try {
    await ensureOverviewPermissionModuleEnum();
    const session = await auth();
    const userId = getUserIdFromSession(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = await getEffectiveUserRole(userId, session?.user?.role);
    if (!canAccessDashboard(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const payload = await loadUserPermissionPayload(userId, session?.user?.role, role);
    return NextResponse.json({ success: true, ...payload });
  } catch (e) {
    console.error("dashboard/permissions GET", e);
    return NextResponse.json({ error: "Failed to load permissions" }, { status: 500 });
  }
}
