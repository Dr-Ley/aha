"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  COMPANIES,
  DEFAULT_COMPANY_ID,
  type Company,
  type CompanyId,
} from "@/types/company";
import {
  DASHBOARD_MODULE_IDS,
  type DashboardModuleId,
  moduleForRevenue,
} from "@/lib/dashboard-modules";
import type { PermissionMatrix } from "@/lib/permissions-server";

const STORAGE_KEY = "aha:selected-company";

type CompanyContextValue = {
  selectedCompanyId: CompanyId;
  selectedCompany: Company;
  companies: readonly Company[];
  setSelectedCompanyId: (id: CompanyId) => void;
  permissionsLoading: boolean;
  isAdmin: boolean;
  canViewModule: (module: DashboardModuleId) => boolean;
  canEditModule: (module: DashboardModuleId) => boolean;
  /** Revenue page uses payments module. */
  canViewRevenue: () => boolean;
  canEditRevenue: () => boolean;
  hasOverviewAccess: boolean;
};

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [accessibleIds, setAccessibleIds] = useState<CompanyId[]>([]);
  const [selectedCompanyId, setSelectedCompanyIdState] =
    useState<CompanyId>(DEFAULT_COMPANY_ID);

  useEffect(() => {
    const cached = window.localStorage.getItem(STORAGE_KEY) as CompanyId | null;
    if (cached && COMPANIES.some((company) => company.id === cached)) {
      setSelectedCompanyIdState(cached);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setPermissionsLoading(false);
      setIsAdmin(false);
      setMatrix({});
      setAccessibleIds([]);
      return;
    }

    let cancelled = false;
    setPermissionsLoading(true);
    fetch("/api/dashboard/permissions")
      .then((r) => r.json())
      .then((d: { isAdmin?: boolean; companyIds?: CompanyId[]; matrix?: PermissionMatrix }) => {
        if (cancelled) return;
        setIsAdmin(!!d.isAdmin);
        setMatrix(d.matrix ?? {});
        setAccessibleIds((d.companyIds ?? []) as CompanyId[]);
      })
      .catch(() => {
        if (!cancelled) {
          setIsAdmin(false);
          setMatrix({});
          setAccessibleIds([]);
        }
      })
      .finally(() => {
        if (!cancelled) setPermissionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id]);

  const companies = useMemo(() => {
    if (isAdmin) return COMPANIES;
    return COMPANIES.filter((c) => accessibleIds.includes(c.id));
  }, [isAdmin, accessibleIds]);

  useEffect(() => {
    if (permissionsLoading) return;
    if (companies.length === 0) return;
    if (!companies.some((c) => c.id === selectedCompanyId)) {
      const next = companies[0].id;
      setSelectedCompanyIdState(next);
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, [permissionsLoading, companies, selectedCompanyId]);

  const setCompany = (id: CompanyId) => {
    setSelectedCompanyIdState(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  };

  const canViewModule = useCallback(
    (module: DashboardModuleId): boolean => {
      if (isAdmin) return true;
      const cell = matrix[selectedCompanyId]?.[module];
      return !!(cell?.view || cell?.edit);
    },
    [isAdmin, matrix, selectedCompanyId]
  );

  const canEditModule = useCallback(
    (module: DashboardModuleId): boolean => {
      if (isAdmin) return true;
      return matrix[selectedCompanyId]?.[module]?.edit === true;
    },
    [isAdmin, matrix, selectedCompanyId]
  );

  const canViewRevenue = useCallback(
    () => canViewModule(moduleForRevenue()),
    [canViewModule]
  );

  const canEditRevenue = useCallback(
    () => canEditModule(moduleForRevenue()),
    [canEditModule]
  );

  const hasOverviewAccess = useMemo(() => {
    if (isAdmin) return true;
    for (const m of DASHBOARD_MODULE_IDS) {
      const cell = matrix[selectedCompanyId]?.[m];
      if (cell?.view || cell?.edit) return true;
    }
    return false;
  }, [isAdmin, matrix, selectedCompanyId]);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? companies[0] ?? COMPANIES[0],
    [companies, selectedCompanyId]
  );

  const value = useMemo(
    () => ({
      selectedCompanyId,
      selectedCompany,
      companies,
      setSelectedCompanyId: setCompany,
      permissionsLoading,
      isAdmin,
      canViewModule,
      canEditModule,
      canViewRevenue,
      canEditRevenue,
      hasOverviewAccess,
    }),
    [
      selectedCompanyId,
      selectedCompany,
      companies,
      permissionsLoading,
      isAdmin,
      canViewModule,
      canEditModule,
      canViewRevenue,
      canEditRevenue,
      hasOverviewAccess,
    ]
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }
  return context;
}
