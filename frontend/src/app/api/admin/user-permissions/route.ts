import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { userPermissions, users } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { checkAdminApi, getUserIdFromSession } from "@/lib/permissions-server";
import { isDashboardModuleId, type DashboardModuleId } from "@/lib/dashboard-modules";
import { isValidCompanyId } from "@/lib/tenant";
import { ensureOverviewPermissionModuleEnum } from "@/lib/ensure-permission-module-enum";

const roleSchema = z.enum(["admin", "staff", "operations", "finance", "customer"]);

const putSchema = z.object({
  userId: z.coerce.number().int().positive(),
  role: roleSchema.optional(),
  permissions: z.array(
    z.object({
      companyId: z.string().min(1).max(32),
      module: z.string().min(1).max(32),
      canView: z.boolean(),
      canEdit: z.boolean(),
    })
  ),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const denied = await checkAdminApi(session);
    if (denied) return denied;

    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const uid = parseInt(userId, 10);
    if (Number.isNaN(uid)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rows = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, uid));

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      permissions: rows,
    });
  } catch (e) {
    console.error("admin/user-permissions GET", e);
    return NextResponse.json({ error: "Failed to load permissions" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureOverviewPermissionModuleEnum();
    const session = await auth();
    const denied = await checkAdminApi(session);
    if (denied) return denied;
    const actingId = getUserIdFromSession(session);

    const parsed = putSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { userId, role, permissions } = parsed.data;

    if (actingId === userId) {
      return NextResponse.json({ error: "Cannot change your own access here" }, { status: 400 });
    }

    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    for (const p of permissions) {
      if (!isValidCompanyId(p.companyId)) {
        return NextResponse.json({ error: `Invalid company: ${p.companyId}` }, { status: 400 });
      }
      if (!isDashboardModuleId(p.module)) {
        return NextResponse.json({ error: `Invalid module: ${p.module}` }, { status: 400 });
      }
    }

    if (role) {
      await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
    }

    await db.delete(userPermissions).where(eq(userPermissions.userId, userId));

    if (permissions.length > 0) {
      await db.insert(userPermissions).values(
        permissions.map((p) => ({
          userId,
          companyId: p.companyId,
          module: p.module as DashboardModuleId,
          canView: p.canView,
          canEdit: p.canEdit,
          updatedAt: new Date(),
        }))
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("admin/user-permissions PUT", e);
    return NextResponse.json({ error: "Failed to save permissions" }, { status: 500 });
  }
}
