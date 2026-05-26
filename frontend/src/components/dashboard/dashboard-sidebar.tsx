"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  LayoutDashboard,
  BookOpenCheck,
  CreditCard,
  Landmark,
  ReceiptText,
  Settings,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Bed,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompany } from "@/store/company-context";
import {
  companyUsesBar,
  companyUsesHotelStays,
  companyUsesRestaurant,
  companyUsesSafariTours,
} from "@/types/company";
import type { CompanyId } from "@/types/company";
import type { LucideIcon } from "lucide-react";
import type { DashboardModuleId } from "@/lib/dashboard-modules";
import { NotificationBell } from "@/components/dashboard/notification-bell";

type NavKey =
  | "overview"
  | "settings"
  | "enquiries"
  | "revenue"
  | DashboardModuleId;

const navItems: {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Tenant product capability (e.g. BTH has no safaris). */
  companyOk: (id: CompanyId) => boolean;
  /** RBAC module key; overview/settings/revenue are special-cased. */
  moduleKey: NavKey;
}[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, companyOk: () => true, moduleKey: "overview" },
  {
    href: "/dashboard/bookings",
    label: "Safari bookings",
    icon: BookOpenCheck,
    companyOk: companyUsesSafariTours,
    moduleKey: "bookings",
  },
  {
    href: "/dashboard/hotel-stays",
    label: "Hotel stays",
    icon: Bed,
    companyOk: companyUsesHotelStays,
    moduleKey: "accommodation",
  },
  {
    href: "/dashboard/restaurant",
    label: "Restaurant",
    icon: UtensilsCrossed,
    companyOk: companyUsesRestaurant,
    moduleKey: "restaurant",
  },
  {
    href: "/dashboard/bar",
    label: "Bar",
    icon: Wine,
    companyOk: companyUsesBar,
    moduleKey: "bar",
  },
  {
    href: "/dashboard/payments",
    label: "Payments",
    icon: CreditCard,
    companyOk: () => true,
    moduleKey: "payments",
  },
  {
    href: "/dashboard/revenue",
    label: "Revenue",
    icon: Landmark,
    companyOk: () => true,
    moduleKey: "revenue",
  },
  {
    href: "/dashboard/expenses",
    label: "Expenses",
    icon: ReceiptText,
    companyOk: () => true,
    moduleKey: "expenses",
  },
  {
    href: "/dashboard/enquiries",
    label: "Enquiries",
    icon: MessageSquareText,
    companyOk: (id) => id === "aha",
    moduleKey: "enquiries",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    companyOk: () => true,
    moduleKey: "settings",
  },
];

type DashboardSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const {
    selectedCompanyId,
    permissionsLoading,
    isAdmin,
    canViewModule,
    canViewRevenue,
    hasOverviewAccess,
  } = useCompany();

  const links = useMemo(() => {
    if (permissionsLoading) return [];
    return navItems.filter((item) => {
      if (!item.companyOk(selectedCompanyId)) return false;
      if (item.moduleKey === "settings") return isAdmin;
      if (item.moduleKey === "overview")
        return canViewModule("overview") || hasOverviewAccess;
      if (item.moduleKey === "revenue") return canViewRevenue();
      if (item.moduleKey === "bookings") {
        return canViewModule("bookings") || canViewModule("tours");
      }
      return canViewModule(item.moduleKey);
    });
  }, [
    permissionsLoading,
    selectedCompanyId,
    isAdmin,
    hasOverviewAccess,
    canViewRevenue,
    canViewModule,
  ]);

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen flex flex-col border-r border-base-content/10 bg-neutral text-neutral-content transition-all duration-200",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-neutral-content/10 px-4">
        <span className={cn("font-semibold tracking-wide", collapsed && "sr-only")}>Dashboard</span>
        <button
          className="btn btn-ghost btn-sm btn-square text-neutral-content"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="p-3">
        <ul className="space-y-1">
          {permissionsLoading && (
            <li className="px-3 py-2 text-xs text-neutral-content/60">Loading access…</li>
          )}
          {!permissionsLoading && links.length === 0 && (
            <li className="px-3 py-2 text-xs text-neutral-content/60">No modules for this company.</li>
          )}
          {links.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive ? "bg-primary text-primary-content" : "text-neutral-content/80 hover:bg-white/10"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={cn("ml-3", collapsed && "hidden")}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto p-3 md:hidden">
        <ul className="space-y-1">
          <li className="flex items-center px-1">
            <NotificationBell />
            <span className={cn("ml-2 text-sm text-neutral-content/80", collapsed && "hidden")}>Alerts</span>
          </li>

          <li>
            <div className="dropdown dropdown-top w-full">
              <button className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-neutral-content/80 transition-colors hover:bg-white/10">
                <span className="avatar placeholder">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-content text-sm font-semibold">
                    {(session?.user?.name ?? "S").slice(0, 1).toUpperCase()}
                  </span>
                </span>
                <span className={cn("ml-3", collapsed && "hidden")}>
                  {session?.user?.name ?? "Staff User"}
                </span>
              </button>

              <ul className="menu dropdown-content z-50 mb-2 w-44 rounded-box border border-base-content/10 bg-base-100 p-2 shadow">
                <li>
                  <span className="text-xs text-base-content/60 capitalize">
                    Role: {session?.user?.role ?? "staff"}
                  </span>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </aside>
  );
}
