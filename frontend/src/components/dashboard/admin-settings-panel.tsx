"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCompany } from "@/store/company-context";
import { COMPANIES, type CompanyId } from "@/types/company";
import { DASHBOARD_MODULE_IDS, type DashboardModuleId } from "@/lib/dashboard-modules";

const MODULE_LABELS: Record<DashboardModuleId, string> = {
  overview: "Overview",
  tours: "Tours",
  accommodation: "Accommodation",
  restaurant: "Restaurant",
  bar: "Bar",
  bookings: "Bookings",
  payments: "Payments",
  expenses: "Expenses",
  enquiries: "Enquiries",
};

type StaffUser = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  dashboardNotificationsEnabled?: boolean;
};

type PermRow = {
  id: number;
  userId: number;
  companyId: string;
  module: string;
  canView: boolean;
  canEdit: boolean;
};

const ROLES = ["admin", "staff", "operations", "finance"] as const;

function emptyModuleState(): Record<DashboardModuleId, { view: boolean; edit: boolean }> {
  const o = {} as Record<DashboardModuleId, { view: boolean; edit: boolean }>;
  for (const m of DASHBOARD_MODULE_IDS) {
    o[m] = { view: false, edit: false };
  }
  return o;
}

function deriveFromRows(rows: PermRow[]) {
  const companyAccess: Record<CompanyId, boolean> = {
    aha: false,
    ewc: false,
    bth: false,
  };
  for (const r of rows) {
    if (r.companyId === "aha" || r.companyId === "ewc" || r.companyId === "bth") {
      companyAccess[r.companyId] = true;
    }
  }
  const moduleAccess = emptyModuleState();
  for (const m of DASHBOARD_MODULE_IDS) {
    const hits = rows.filter((r) => r.module === m);
    moduleAccess[m] = {
      view: hits.some((h) => h.canView),
      edit: hits.some((h) => h.canEdit),
    };
  }
  return { companyAccess, moduleAccess };
}

export function AdminSettingsPanel() {
  const { isAdmin } = useCompany();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [role, setRole] = useState<string>("staff");
  const [companyAccess, setCompanyAccess] = useState<Record<CompanyId, boolean>>({
    aha: false,
    ewc: false,
    bth: false,
  });
  const [moduleAccess, setModuleAccess] = useState(() => emptyModuleState());
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notifSavingId, setNotifSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoadingUsers(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((j: { users?: StaffUser[] }) => {
        if (cancelled) return;
        setUsers(j.users ?? []);
        if ((j.users?.length ?? 0) > 0) {
          setSelectedId(j.users![0].id);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const loadUser = useCallback(async (userId: number) => {
    setLoadingDetail(true);
    setMessage(null);
    try {
      const r = await fetch(`/api/admin/user-permissions?userId=${userId}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load user");
      setRole(j.user?.role ?? "staff");
      const { companyAccess: ca, moduleAccess: ma } = deriveFromRows(j.permissions ?? []);
      setCompanyAccess(ca);
      setModuleAccess(ma);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin || selectedId == null) return;
    void loadUser(selectedId);
  }, [isAdmin, selectedId, loadUser]);

  const payload = useMemo(() => {
    const permissions: {
      companyId: string;
      module: string;
      canView: boolean;
      canEdit: boolean;
    }[] = [];
    for (const c of COMPANIES) {
      if (!companyAccess[c.id]) continue;
      for (const m of DASHBOARD_MODULE_IDS) {
        if (m === "enquiries" && c.id !== "aha") continue;
        const cell = moduleAccess[m];
        const canView = cell.view || cell.edit;
        const canEdit = cell.edit;
        if (!canView && !canEdit) continue;
        permissions.push({ companyId: c.id, module: m, canView, canEdit });
      }
    }
    return permissions;
  }, [companyAccess, moduleAccess]);

  async function save() {
    if (selectedId == null) return;
    setSaving(true);
    setMessage(null);
    try {
      const r = await fetch("/api/admin/user-permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedId,
          role,
          permissions: payload,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      setMessage("Saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function setNotifForUser(userId: number, dashboardNotificationsEnabled: boolean) {
    setNotifSavingId(userId);
    setMessage(null);
    try {
      const r = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, dashboardNotificationsEnabled }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Update failed");
      setUsers((prev) => prev.map((x) => (x.id === userId ? { ...x, dashboardNotificationsEnabled } : x)));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Update failed");
    } finally {
      setNotifSavingId(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="alert alert-warning">
        <span>Only administrators can manage roles and permissions.</span>
      </div>
    );
  }

  if (loadingUsers) {
    return <div className="loading loading-spinner loading-md" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-base-content">Access control</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Assign dashboard role, company access, and per-module view or edit rights. Admins always have full access and
          are not limited by this matrix.
        </p>
      </div>

      <div className="rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
        <h3 className="text-base font-semibold text-base-content">Dashboard notifications</h3>
        <p className="mt-1 text-sm text-base-content/60">
          Turn the bell on or off per staff user. When off, they do not see dashboard notifications for any company.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>User</th>
                <th className="w-36 text-center">Notifications</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const enabled = u.dashboardNotificationsEnabled !== false;
                return (
                  <tr key={u.id}>
                    <td>
                      <span className="font-medium">{u.name ?? u.email}</span>
                      <span className="block text-xs text-base-content/50">{u.email}</span>
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm"
                        checked={enabled}
                        disabled={notifSavingId === u.id}
                        title={enabled ? "Notifications on" : "Notifications off"}
                        onChange={(e) => void setNotifForUser(u.id, e.target.checked)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="form-control">
        <label className="label pt-0" htmlFor="staff-user">
          <span className="label-text font-medium">Staff user</span>
        </label>
        <select
          id="staff-user"
          className="select select-bordered w-full max-w-md"
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value ? parseInt(e.target.value, 10) : null)}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.email} ({u.email}) — {u.role}
            </option>
          ))}
        </select>
      </div>

      {selectedId != null && (
        <>
          <div className="form-control">
            <label className="label pt-0" htmlFor="staff-role">
              <span className="label-text font-medium">Role</span>
            </label>
            <select
              id="staff-role"
              className="select select-bordered w-full max-w-md"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loadingDetail}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 font-medium">Company access</p>
            <div className="flex flex-wrap gap-4">
              {COMPANIES.map((c) => (
                <label key={c.id} className="label cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={companyAccess[c.id]}
                    disabled={loadingDetail}
                    onChange={(e) =>
                      setCompanyAccess((prev) => ({ ...prev, [c.id]: e.target.checked }))
                    }
                  />
                  <span className="label-text">{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium">Module permissions</p>
            <div className="overflow-x-auto rounded-xl border border-base-content/10">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>View</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {DASHBOARD_MODULE_IDS.map((m) => (
                    <tr key={m}>
                      <td>{MODULE_LABELS[m]}</td>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={moduleAccess[m].view}
                          disabled={loadingDetail}
                          onChange={(e) =>
                            setModuleAccess((prev) => ({
                              ...prev,
                              [m]: {
                                view: e.target.checked,
                                edit: e.target.checked ? prev[m].edit : false,
                              },
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={moduleAccess[m].edit}
                          disabled={loadingDetail}
                          onChange={(e) =>
                            setModuleAccess((prev) => ({
                              ...prev,
                              [m]: {
                                view: e.target.checked || prev[m].view,
                                edit: e.target.checked,
                              },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {message ? (
            <p className={`text-sm ${message === "Saved." ? "text-success" : "text-error"}`}>{message}</p>
          ) : null}

          <button type="button" className="btn btn-primary" disabled={saving || loadingDetail} onClick={() => void save()}>
            {saving ? "Saving…" : "Save access"}
          </button>
        </>
      )}
    </div>
  );
}
