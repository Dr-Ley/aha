import Link from "next/link";
import { notFound } from "next/navigation";
import { displayCustomerName } from "@/lib/customer-identity";
import { getCustomerWithHistory } from "@/lib/customers";
import { companyUsesHotelStays, companyUsesSafariTours } from "@/types/company";
import { updateCustomerNotesAction } from "../actions";
import { requireCustomersTenant } from "../tenant";

function money(amount: number | null | undefined, currency?: string | null) {
  if (amount == null) return "—";
  return `${currency ?? "KES"} ${amount.toLocaleString()}`;
}

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ companyId?: string; error?: string }>;
}) {
  const { id: rawId } = await params;
  const query = await searchParams;
  const id = parseInt(rawId, 10);
  if (Number.isNaN(id)) notFound();

  const ctx = await requireCustomersTenant(query.companyId);
  const packed = await getCustomerWithHistory(ctx.companyId, id);
  if (!packed) notFound();

  const { customer, safaris, stays } = packed;
  const name = displayCustomerName(customer) || customer.email || "Guest";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/customers" className="link link-hover text-sm">
          ← Customers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{name}</h1>
        <p className="text-sm text-base-content/60">
          {[customer.email, customer.phone, customer.nationality ?? customer.country]
            .filter(Boolean)
            .join(" · ") || "No contact details on file"}
        </p>
      </div>

      {query.error ? <p className="text-sm text-error">{query.error}</p> : null}

      <form action={updateCustomerNotesAction} className="space-y-2 rounded-xl border border-base-content/10 p-4">
        <input type="hidden" name="companyId" value={ctx.companyId} />
        <input type="hidden" name="id" value={customer.id} />
        <label className="text-sm font-medium" htmlFor="customer-notes">
          Notes
        </label>
        <textarea
          id="customer-notes"
          name="notes"
          className="textarea textarea-bordered w-full"
          rows={4}
          defaultValue={customer.notes ?? ""}
        />
        <button type="submit" className="btn btn-primary btn-sm">
          Save notes
        </button>
      </form>

      {companyUsesSafariTours(ctx.companyId) || safaris.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Safari bookings</h2>
          <div className="overflow-x-auto rounded-xl border border-base-content/10">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Package</th>
                  <th>Travel</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {safaris.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-base-content/60">
                      No safari bookings linked to this customer.
                    </td>
                  </tr>
                ) : (
                  safaris.map((row) => (
                    <tr key={row.id}>
                      <td>#{row.id}</td>
                      <td>{row.safariPackage || "—"}</td>
                      <td>{row.startDate || row.travelDate || "—"}</td>
                      <td>{row.status}</td>
                      <td>{row.paymentStatus}</td>
                      <td>{money(row.originalAmount ?? row.totalPrice, row.originalCurrency)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {companyUsesHotelStays(ctx.companyId) || stays.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Hotel stays</h2>
          <div className="overflow-x-auto rounded-xl border border-base-content/10">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {stays.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-base-content/60">
                      No hotel stays linked to this customer.
                    </td>
                  </tr>
                ) : (
                  stays.map((row) => (
                    <tr key={row.id}>
                      <td>#{row.id}</td>
                      <td>{row.checkInDate}</td>
                      <td>{row.checkOutDate}</td>
                      <td>{row.status}</td>
                      <td>{row.paymentStatus}</td>
                      <td>{money(row.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
