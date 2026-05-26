import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userPermissions, users } from "@/lib/schema";
import { canAccessDashboard, isAdminRole } from "@/lib/roles";
import type { DashboardModuleId } from "@/lib/dashboard-modules";
import { isDashboardModuleId } from "@/lib/dashboard-modules";
import { COMPANY_IDS, type CompanyId } from "@/types/company";

export type PermissionMatrix = Record<
  string,
  Partial<Record<DashboardModuleId, { view: boolean; edit: boolean }>>
>;

export function getUserIdFromSession(session: {
  user?: { id?: string | null };
} | null): number | null {
  if (!session?.user?.id) return null;
  const id = session.user.id;
  return typeof id === "string" ? parseInt(id, 10) : Number(id);
}

/** Prefer DB role over JWT so dashboard access matches persisted users.role (fixes missing/stale session.role). */
export async function getEffectiveUserRole(
  userId: number,
  sessionRole: string | undefined | null
): Promise<string | undefined> {
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const dbRole = row?.role != null ? String(row.role) : undefined;
  const jwtRole =
    sessionRole != null && String(sessionRole).trim() !== ""
      ? String(sessionRole).trim()
      : undefined;
  return dbRole ?? jwtRole;
}

export async function canAccessDashboardFromSession(session: {
  user?: { id?: string | null; role?: string | null };
} | null): Promise<boolean> {
  const userId = getUserIdFromSession(session);
  if (!userId) return false;
  const role = await getEffectiveUserRole(userId, session?.user?.role);
  return canAccessDashboard(role);
}

export async function userHasModuleAccess(
  userId: number,
  companyId: string,
  module: DashboardModuleId,
  requireEdit: boolean
): Promise<boolean> {
  const [row] = await db
    .select()
    .from(userPermissions)
    .where(
      and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.companyId, companyId),
        eq(userPermissions.module, module)
      )
    )
    .limit(1);
  if (!row) return false;
  if (requireEdit) return row.canEdit;
  return row.canView;
}

/** Any module with view or edit grants overview-style access for that company. */
export async function userHasAnyModuleAccess(
  userId: number,
  companyId: string
): Promise<boolean> {
  const rows = await db
    .select()
    .from(userPermissions)
    .where(
      and(eq(userPermissions.userId, userId), eq(userPermissions.companyId, companyId))
    );
  return rows.some((r) => r.canView || r.canEdit);
}

export async function loadUserPermissionPayload(
  userId: number,
  sessionRole: string | undefined | null,
  resolvedRole?: string | undefined
): Promise<{
  isAdmin: boolean;
  companyIds: CompanyId[];
  matrix: PermissionMatrix;
}> {
  const role =
    resolvedRole ?? (await getEffectiveUserRole(userId, sessionRole));
  if (isAdminRole(role)) {
    return {
      isAdmin: true,
      companyIds: [...COMPANY_IDS],
      matrix: {},
    };
  }

  const rows = await db
    .select()
    .from(userPermissions)
    .where(eq(userPermissions.userId, userId));

  const companySet = new Set<CompanyId>();
  const matrix: PermissionMatrix = {};

  for (const r of rows) {
    if (!isDashboardModuleId(r.module)) continue;
    if (r.canView || r.canEdit) {
      companySet.add(r.companyId as CompanyId);
    }
    matrix[r.companyId] = matrix[r.companyId] || {};
    matrix[r.companyId]![r.module] = {
      view: r.canView,
      edit: r.canEdit,
    };
  }

  return {
    isAdmin: false,
    companyIds: [...companySet],
    matrix,
  };
}

/**
 * Returns `NextResponse` on failure, or `null` when the caller may proceed.
 */
export async function checkApiPermission(
  session: { user?: { id?: string | null; role?: string | null } } | null,
  companyId: string,
  module: DashboardModuleId,
  requireEdit: boolean
): Promise<NextResponse | null> {
  const userId = getUserIdFromSession(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = await getEffectiveUserRole(userId, session?.user?.role);
  if (!canAccessDashboard(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (isAdminRole(role)) {
    return null;
  }
  const ok = await userHasModuleAccess(userId, companyId, module, requireEdit);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function checkAdminApi(
  session: { user?: { id?: string | null; role?: string | null } } | null
): Promise<NextResponse | null> {
  const userId = getUserIdFromSession(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = await getEffectiveUserRole(userId, session?.user?.role);
  if (!isAdminRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Dashboard overview: any module with view/edit for the company. */
export async function checkOverviewApi(
  session: { user?: { id?: string | null; role?: string | null } } | null,
  companyId: string
): Promise<NextResponse | null> {
  const userId = getUserIdFromSession(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = await getEffectiveUserRole(userId, session?.user?.role);
  if (!canAccessDashboard(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (isAdminRole(role)) {
    return null;
  }
  const ok = await userHasAnyModuleAccess(userId, companyId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** First matching module grants access (OR). */
export async function checkAnyApiPermission(
  session: { user?: { id?: string | null; role?: string | null } } | null,
  companyId: string,
  modules: DashboardModuleId[],
  requireEdit: boolean
): Promise<NextResponse | null> {
  const userId = getUserIdFromSession(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = await getEffectiveUserRole(userId, session?.user?.role);
  if (!canAccessDashboard(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (isAdminRole(role)) {
    return null;
  }
  for (const m of modules) {
    if (await userHasModuleAccess(userId, companyId, m, requireEdit)) {
      return null;
    }
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
