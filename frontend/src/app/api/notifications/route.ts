import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/schema";
import { isAdminRole } from "@/lib/roles";
import { getEffectiveUserRole } from "@/lib/permissions-server";
import { requireStaffUser, requireTenantContext } from "@/server/tenancy";
import { ensureEnquiryNotificationEnum } from "@/lib/ensure-notification-entity-enum";
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
    const tenant = await requireTenantContext(new URL(request.url).searchParams.get("companyId"), {
      overview: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const userId = tenant.ctx.userId;
    const role = await getEffectiveUserRole(userId, tenant.ctx.session.user?.role);

    await ensureDashboardNotificationsColumn();
    await ensureEnquiryNotificationEnum();

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
      whereParts.push(sql`${notifications.type}::text <> 'payment'`);
      whereParts.push(sql`${notifications.type}::text <> 'enquiry'`);
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
    const body = patchSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = body.data;
    if (d.markAllRead) {
      const tenant = await requireTenantContext(d.companyId, { overview: true });
      if (!tenant.ok) return tenant.response;
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.companyId, tenant.ctx.companyId));
      return NextResponse.json({ success: true });
    }
    if (!d.id) {
      return NextResponse.json({ error: "id or markAllRead required" }, { status: 400 });
    }
    const staff = await requireStaffUser();
    if (!staff.ok) return staff.response;
    const [row] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, d.id))
      .limit(1);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const tenant = await requireTenantContext(row.companyId, { overview: true });
    if (!tenant.ok) return tenant.response;
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
