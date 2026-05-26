import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  getEffectiveUserRole,
  getUserIdFromSession,
} from "@/lib/permissions-server";
import { canAccessDashboard } from "@/lib/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = getUserIdFromSession(session);
  if (!userId) {
    redirect("/login");
  }
  const role = await getEffectiveUserRole(userId, session?.user?.role);
  if (!canAccessDashboard(role)) {
    redirect("/");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
