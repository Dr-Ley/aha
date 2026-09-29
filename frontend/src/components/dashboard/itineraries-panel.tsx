"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCompany } from "@/store/company-context";
import { formatPaymentAmountLabel } from "@/lib/email/payment-acknowledgement-template";

type Row = {
  id?: number;
  publicToken: string;
  status: string;
  title: string | null;
  guestName: string | null;
  guestEmail: string | null;
  sellingPrice: number | null;
  currency: string;
  startDate: string | null;
  bookingId: number | null;
  viewUrl: string;
};

export function ItinerariesPanel() {
  const { selectedCompanyId } = useCompany();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [busyToken, setBusyToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/itineraries?companyId=${selectedCompanyId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load itineraries");
    setRows(data.itineraries ?? []);
  }, [selectedCompanyId]);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Could not load itineraries"));
  }, [load]);

  async function act(row: Row, path: "approve" | "convert-to-booking") {
    setBusyToken(row.publicToken);
    setError("");
    try {
      const res = await fetch(
        `/api/itineraries/${row.id ?? row.publicToken}/${path}?companyId=${selectedCompanyId}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyToken(null);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Safari itineraries</h1>
        <p className="text-sm text-base-content/60">
          Review AI-assisted itineraries, approve them, and convert accepted plans into safari bookings.
        </p>
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-base-content/10 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Itinerary</th>
              <th>Guest</th>
              <th>Status</th>
              <th>Quote</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-sm text-base-content/60">
                  No itineraries yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.publicToken}>
                  <td>
                    <p className="font-medium">{row.title || "Untitled"}</p>
                    <p className="text-xs text-base-content/60">{row.startDate || "Dates TBC"}</p>
                  </td>
                  <td>
                    <p>{row.guestName || "—"}</p>
                    <p className="text-xs text-base-content/60">{row.guestEmail}</p>
                  </td>
                  <td>
                    <span className="badge badge-ghost">{row.status}</span>
                    {row.bookingId ? (
                      <p className="text-xs text-base-content/60">Linked safari booking</p>
                    ) : null}
                  </td>
                  <td>
                    {row.sellingPrice != null
                      ? formatPaymentAmountLabel(row.currency, row.sellingPrice)
                      : "—"}
                  </td>
                  <td className="space-x-2 whitespace-nowrap">
                    <Link className="btn btn-ghost btn-xs" href={row.viewUrl} target="_blank">
                      View
                    </Link>
                    {row.status === "accepted" ? (
                      <button
                        className="btn btn-outline btn-xs"
                        disabled={busyToken === row.publicToken}
                        onClick={() => void act(row, "approve")}
                      >
                        Approve
                      </button>
                    ) : null}
                    {row.status === "accepted" || row.status === "approved" ? (
                      <button
                        className="btn btn-primary btn-xs"
                        disabled={busyToken === row.publicToken}
                        onClick={() => void act(row, "convert-to-booking")}
                      >
                        Convert
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
