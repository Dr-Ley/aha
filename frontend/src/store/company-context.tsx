"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  COMPANIES,
  DEFAULT_COMPANY_ID,
  type Company,
  type CompanyId,
} from "@/types/company";
import { type DashboardModuleId, moduleForRevenue } from "@/lib/dashboard-modules";
import { companyIdFromCookieHeader, resolveCompanySelection } from "@/lib/company-cookie";
import type { PermissionMatrix } from "@/lib/permissions-server";

const STORAGE_KEY = "aha:selected-company";
const DELETE_VISIBLE_KEY = "aha:delete-visible-for-all";

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
  deleteVisibleForAll: boolean;
  setDeleteVisibleForAll: (v: boolean) => void;
};

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

function commitCompany(requestedId: CompanyId, allowedIds: readonly CompanyId[]) {
  const next = resolveCompanySelection({
    requestedId,
    currentCookie: companyIdFromCookieHeader(document.cookie),
    allowedIds,
  });
  window.localStorage.setItem(STORAGE_KEY, next.id);
  document.cookie = next.cookie;
  return next;
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [accessibleIds, setAccessibleIds] = useState<CompanyId[]>([]);
  const [selectedCompanyId, setSelectedCompanyIdState] =
    useState<CompanyId>(DEFAULT_COMPANY_ID);
  const [deleteVisibleForAll, setDeleteVisibleForAllState] = useState(false);

  useEffect(() => {
    const cached = window.localStorage.getItem(STORAGE_KEY) as CompanyId | null;
    if (cached && COMPANIES.some((company) => company.id === cached)) {
      const next = commitCompany(cached, COMPANIES.map((company) => company.id));
      setSelectedCompanyIdState(next.id);
      if (next.changed) router.refresh();
    }
    const delVisible = window.localStorage.getItem(DELETE_VISIBLE_KEY);
    if (delVisible === "true") setDeleteVisibleForAllState(true);
  }, [router]);

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
      .then((d: { isAdmin?: boolean; companyIds?: CompanyId[]; companyAdminIds?: CompanyId[]; matrix?: PermissionMatrix }) => {
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
    const next = commitCompany(
      selectedCompanyId,
      companies.map((company) => company.id)
    );
    if (next.id !== selectedCompanyId) setSelectedCompanyIdState(next.id);
    if (next.changed) router.refresh();
  }, [permissionsLoading, companies, selectedCompanyId, router]);

  const setCompany = (id: CompanyId) => {
    const allowed = companies.map((company) => company.id);
    const next = commitCompany(id, allowed.length > 0 ? allowed : COMPANIES.map((company) => company.id));
    setSelectedCompanyIdState(next.id);
  };

  const setDeleteVisibleForAll = (v: boolean) => {
    setDeleteVisibleForAllState(v);
    window.localStorage.setItem(DELETE_VISIBLE_KEY, v ? "true" : "false");
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

  const hasOverviewAccess = canViewModule("overview");

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
      deleteVisibleForAll,
      setDeleteVisibleForAll,
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
      deleteVisibleForAll,
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
