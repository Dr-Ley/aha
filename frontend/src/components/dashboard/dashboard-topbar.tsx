"use client";

import { LogOut, Search } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useCompany } from "@/store/company-context";
import { NotificationBell } from "@/components/dashboard/notification-bell";

export function DashboardTopbar() {
  const { data: session } = useSession();
  const { selectedCompanyId, setSelectedCompanyId, companies } = useCompany();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-base-content/10 bg-base-100 px-4 md:px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-content">
          AHA
        </div>
        <span className="hidden font-semibold md:inline">Staff Console</span>
      </div>

      <div className="form-control ml-2">
        <select
          className="select select-bordered select-sm w-[220px]"
          value={selectedCompanyId}
          onChange={(event) => setSelectedCompanyId(event.target.value as typeof selectedCompanyId)}
          aria-label="Switch company"
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <label
        className="input input-sm input-bordered ml-auto hidden max-w-xs items-center gap-2 md:flex"
        style={{ outline: "1px solid gray" }}
      >
        <Search className="h-4 w-4 opacity-60" />
        <input type="text" className="grow" placeholder="Search..." />
      </label>

      <div className="hidden items-center gap-1 rounded-lg border border-base-content/10 bg-base-200/40 px-2 py-1 text-xs font-medium text-base-content/80 sm:flex">
        <span className="tabular-nums">KSh</span>
        {/* <span className="text-base-content/50">base · USD/EUR/£ convert</span> */}
      </div>

      <div className="ml-auto hidden items-center gap-2 md:flex md:ml-0">
        <NotificationBell />

        <div className="dropdown dropdown-end">
          <button type="button" tabIndex={0} className="btn btn-ghost btn-md my-2 gap-2 py-2">
            <span className="avatar placeholder">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-content">
                {(session?.user?.name ?? "S").slice(0, 1).toUpperCase()}
              </span>
            </span>
            <span className="hidden md:inline">{session?.user?.name ?? "Staff User"}</span>
          </button>
          <ul className="menu dropdown-content z-50 mt-2 w-52 rounded-box border border-base-content/10 bg-base-100 p-2 shadow">
            <li className="pointer-events-none px-3 py-2">
              <span className="text-xs capitalize text-base-content/60">
                Role: {session?.user?.role ?? "staff"}
              </span>
            </li>
            <li>
              <button
                type="button"
                className="gap-2 text-error active:bg-error/10"
                onClick={() => void signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Log out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
