"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { CompanyProvider, useCompany } from "@/store/company-context";
import { useCurrency } from "@/lib/currency-context";

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

  return <div className="flex-1 p-4 md:p-6">{children}</div>;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <CompanyProvider>
      <DashboardKesBaseCurrency>
        <div className="flex min-h-screen bg-base-200/30">
          <DashboardSidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <DashboardTopbar />
            <DashboardMain>{children}</DashboardMain>
          </div>
        </div>
      </DashboardKesBaseCurrency>
    </CompanyProvider>
  );
}
