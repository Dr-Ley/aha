"use client";

import { useEffect, useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { CompanyProvider, useCompany } from "@/store/company-context";
import { useCurrency } from "@/lib/currency-context";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isMobile;
}

/** Dashboard amounts are shown and edited with Kenya Shillings as base; USD/EUR/GBP convert via rates. */
function DashboardKesBaseCurrency({ children }: { children: React.ReactNode }) {
  const { setCurrency } = useCurrency();
  useEffect(() => {
    setCurrency("KES");
  }, [setCurrency]);
  return <>{children}</>;
}

function DashboardMain({ children }: { children: React.ReactNode }) {
  const { permissionsLoading, companies } = useCompany();

  if (permissionsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md rounded-2xl border border-warning/30 bg-warning/10 p-6 text-center text-sm text-base-content">
          You do not have access to any companies. Ask an administrator to grant company and module permissions in
          Settings.
        </div>
      </div>
    );
  }

  return <div className="min-w-0 flex-1 overflow-x-hidden p-4 pb-20 md:p-6 md:pb-20">{children}</div>;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  return (
    <CompanyProvider>
      <DashboardKesBaseCurrency>
        <div className="relative flex min-h-screen bg-base-200/30">
          {isMobile && !collapsed && (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-black/40 md:hidden"
              aria-label="Close menu"
              onClick={() => setCollapsed(true)}
            />
          )}
          {isMobile && collapsed && (
            <button
              type="button"
              className="fixed left-0 top-20 z-50 flex h-10 w-9 items-center justify-center rounded-r-lg border border-l-0 border-base-content/10 bg-neutral text-neutral-content shadow-lg md:hidden"
              aria-label="Open menu"
              onClick={() => setCollapsed(false)}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
          <DashboardSidebar
            collapsed={collapsed}
            isMobile={isMobile}
            onToggle={() => setCollapsed((prev) => !prev)}
            onNavigate={isMobile ? () => setCollapsed(true) : undefined}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <DashboardTopbar />
            <DashboardMain>{children}</DashboardMain>
          </div>
        </div>
      </DashboardKesBaseCurrency>
    </CompanyProvider>
  );
}
