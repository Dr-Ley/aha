import Link from "next/link";
import { displayCustomerName } from "@/lib/customer-identity";
import { listCustomersForCompany } from "@/lib/customers";
import { COMPANIES } from "@/types/company";
import { createCustomerAction } from "./actions";
import { CustomersTableExport } from "./customers-export";
import { requireCustomersTenant } from "./tenant";

type Search = { q?: string; page?: string; companyId?: string; error?: string };

function displayName(row: { firstName: string; lastName: string | null; email: string | null }): string {
  return displayCustomerName(row) || row.email || "Guest";
}

const PAGE_SIZE = 10;

export default async function DashboardCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const ctx = await requireCustomersTenant(params.companyId);
  const query = params.q?.trim() ?? "";
  const rows = await listCustomersForCompany(ctx.companyId, query || undefined);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(Math.max(parseInt(params.page ?? "1", 10) || 1, 1), pageCount);
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const companyName = COMPANIES.find((c) => c.id === ctx.companyId)?.name ?? ctx.companyId;
  const qs = (next: Partial<Search>) => {
    const sp = new URLSearchParams();
    const q = next.q ?? query;
    const p = next.page ?? String(page);
    if (q) sp.set("q", q);
    if (p && p !== "1") sp.set("page", p);
    sp.set("companyId", ctx.companyId);
    const s = sp.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="text-sm text-base-content/60">
          {companyName} guest profiles. Stay and safari snapshots keep historical name and contact
          details. Email is the automatic match key; staff can still create a customer without one.
        </p>
      </div>

      {params.error ? <p className="text-sm text-error">{params.error}</p> : null}

      <form className="flex flex-wrap items-center gap-3" action="/dashboard/customers" method="get">
        <input type="hidden" name="companyId" value={ctx.companyId} />
        <input
          className="input input-bordered input-sm w-full max-w-xs"
          name="q"
          defaultValue={query}
          placeholder="Search name, email, phone"
        />
        <button type="submit" className="btn btn-sm">
          Search
        </button>
        <CustomersTableExport
          title={`Customers ${ctx.companyId}`}
          rows={rows.map((row) => ({
            id: row.id,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone,
            nationality: row.nationality,
            notes: row.notes,
            bookingCount: row.bookingCount,
            hotelStayCount: row.hotelStayCount ?? 0,
            lastActivity: row.lastActivity,
          }))}
        />
      </form>

      <details className="collapse collapse-arrow rounded-xl border border-base-content/10 bg-base-100">
        <summary className="collapse-title text-sm font-medium">Add customer</summary>
        <form action={createCustomerAction} className="collapse-content grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="companyId" value={ctx.companyId} />
          <input className="input input-bordered input-sm" name="firstName" placeholder="First name" required />
          <input className="input input-bordered input-sm" name="lastName" placeholder="Last name" />
          <input className="input input-bordered input-sm" name="email" type="email" placeholder="Email (optional)" />
          <input className="input input-bordered input-sm" name="phone" placeholder="Phone" />
          <input className="input input-bordered input-sm sm:col-span-2" name="nationality" placeholder="Nationality" />
          <button type="submit" className="btn btn-primary btn-sm sm:col-span-2 w-fit">
            Create customer
          </button>
        </form>
      </details>

      <div className="overflow-x-auto rounded-xl border border-base-content/10">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Nationality</th>
              <th>Safaris</th>
              <th>Stays</th>
              <th>Last activity</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-base-content/60">
                  No customers for this company yet. Safari bookings with an email, or a staff
                  identification from a hotel stay, create a profile.
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">
                    <Link className="link link-hover" href={`/dashboard/customers/${row.id}`}>
                      {displayName(row)}
                    </Link>
                  </td>
                  <td>{row.email ?? "—"}</td>
                  <td>{row.phone ?? "—"}</td>
                  <td>{row.nationality ?? row.country ?? "—"}</td>
                  <td>{row.bookingCount}</td>
                  <td>{row.hotelStayCount ?? 0}</td>
                  <td>{row.lastActivity ?? "—"}</td>
                  <td className="max-w-[16rem] truncate">{row.notes?.trim() || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="join">
          {page > 1 ? (
            <Link className="btn join-item btn-xs" href={`/dashboard/customers${qs({ page: String(page - 1) })}`}>
              Previous
            </Link>
          ) : (
            <span className="btn join-item btn-xs btn-disabled">Previous</span>
          )}
          <span className="btn join-item btn-xs pointer-events-none">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link className="btn join-item btn-xs" href={`/dashboard/customers${qs({ page: String(page + 1) })}`}>
              Next
            </Link>
          ) : (
            <span className="btn join-item btn-xs btn-disabled">Next</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
