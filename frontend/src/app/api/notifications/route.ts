import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { canAccessDashboard, isAdminRole } from "@/lib/roles";
import {
  getEffectiveUserRole,
  getUserIdFromSession,
  userHasAnyModuleAccess,
} from "@/lib/permissions-server";
import { isValidCompanyId, resolveCompanyId } from "@/lib/tenant";
import { z } from "zod";

const patchSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  markAllRead: z.boolean().optional(),
  companyId: z.string().min(1).max(32).optional(),
});

let dashboardNotificationsColumnEnsured = false;

async function ensureDashboardNotificationsColumn(): Promise<void> {
  if (dashboardNotificationsColumnEnsured) return;
  await db.execute(sql`
    ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "dashboard_notifications_enabled" boolean DEFAULT true NOT NULL
  `);
  dashboardNotificationsColumnEnsured = true;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromSession(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = await getEffectiveUserRole(userId, session?.user?.role);
    if (!canAccessDashboard(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const companyId = resolveCompanyId(new URL(request.url).searchParams.get("companyId"));
    if (!isValidCompanyId(companyId)) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 });
    }
    if (!isAdminRole(role)) {
      const ok = await userHasAnyModuleAccess(userId, companyId);
      if (!ok) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await ensureDashboardNotificationsColumn();

    const [pref] = await db
      .select({ dashboardNotificationsEnabled: users.dashboardNotificationsEnabled })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (pref?.dashboardNotificationsEnabled === false) {
      return NextResponse.json({
        success: true,
        notifications: [],
        unreadCount: 0,
        notificationsDisabled: true,
      });
    }

    const { ensureArrivalDayNotifications } = await import("@/lib/arrival-day-notifications");
    await ensureArrivalDayNotifications(companyId);

    const whereParts = [eq(notifications.companyId, companyId)];
    if (!isAdminRole(role)) {
      whereParts.push(sql`${notifications.type} <> 'payment'`);
      whereParts.push(sql`${notifications.type} <> 'enquiry'`);
    }
    if (companyId !== "aha") {
      whereParts.push(sql`${notifications.type} <> 'enquiry'`);
    }

    const whereClause = and(...whereParts);

    const list = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(80);

    const [countRow] = await db
      .select({ c: count() })
      .from(notifications)
      .where(and(whereClause, eq(notifications.isRead, false)));

    return NextResponse.json({
      success: true,
      notifications: list,
      unreadCount: Number(countRow?.c ?? 0),
    });
  } catch (e) {
    console.error("notifications GET", e);
    return NextResponse.json({ error: "Failed to list notifications" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromSession(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = await getEffectiveUserRole(userId, session?.user?.role);
    if (!canAccessDashboard(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = patchSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = body.data;
    const companyId = d.companyId ? resolveCompanyId(d.companyId) : null;
    if (d.markAllRead) {
      if (!companyId || !isValidCompanyId(companyId)) {
        return NextResponse.json({ error: "companyId required" }, { status: 400 });
      }
      if (!isAdminRole(role)) {
        const ok = await userHasAnyModuleAccess(userId, companyId);
        if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.companyId, companyId));
      return NextResponse.json({ success: true });
    }
    if (!d.id) {
      return NextResponse.json({ error: "id or markAllRead required" }, { status: 400 });
    }
    const [row] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, d.id))
      .limit(1);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!isAdminRole(role)) {
      const ok = await userHasAnyModuleAccess(userId, row.companyId);
      if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, d.id));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("notifications PATCH", e);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
