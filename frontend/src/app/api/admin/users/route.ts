import { NextRequest, NextResponse } from "next/server";
import { eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { checkAdminApi } from "@/lib/permissions-server";
import { z } from "zod";

const patchSchema = z.object({
  userId: z.number().int().positive(),
  dashboardNotificationsEnabled: z.boolean(),
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

export async function GET() {
  try {
    const session = await auth();
    const denied = await checkAdminApi(session);
    if (denied) return denied;

    await ensureDashboardNotificationsColumn();

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        dashboardNotificationsEnabled: users.dashboardNotificationsEnabled,
      })
      .from(users)
      .where(ne(users.role, "customer"));

    return NextResponse.json({ success: true, users: rows });
  } catch (e) {
    console.error("admin/users GET", e);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    const denied = await checkAdminApi(session);
    if (denied) return denied;

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { userId, dashboardNotificationsEnabled } = parsed.data;

    await ensureDashboardNotificationsColumn();

    await db
      .update(users)
      .set({
        dashboardNotificationsEnabled,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("admin/users PATCH", e);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
