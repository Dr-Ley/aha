"use client";

import { useEffect, useState } from "react";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { displayCustomerName, matchReasonLabel, splitPersonName, type CustomerMatchReason } from "@/lib/customer-identity";

type StayGuest = {
  fullName: string;
  email: string | null;
  phone: string | null;
  customerId: number | null;
  customerName?: string | null;
};

type Suggestion = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  reason: CustomerMatchReason;
};

type SearchRow = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
};

export function HotelGuestIdentifyModal({
  companyId,
  stayId,
  guest,
  onClose,
  onDone,
}: {
  companyId: string;
  stayId: number;
  guest: StayGuest;
  onClose: () => void;
  onDone: () => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [results, setResults] = useState<SearchRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createEmail, setCreateEmail] = useState(guest.email ?? "");
  const [createPhone, setCreatePhone] = useState(guest.phone ?? "");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          companyId,
          hotelBookingId: String(stayId),
        });
        const res = await fetch(`/api/hotel-bookings/identify?${qs}`);
        const data = await res.json();
        if (!cancelled) setSuggestions(data.suggestions ?? []);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, stayId]);

  useEffect(() => {
    const needle = query.trim();
    if (!needle) {
      setResults([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void (async () => {
        const qs = new URLSearchParams({ companyId, q: needle });
        const res = await fetch(`/api/customers?${qs}`);
        const data = await res.json();
        setResults(data.customers ?? []);
      })();
    }, 250);
    return () => window.clearTimeout(handle);
  }, [companyId, query]);

  async function link(customerId: number | null, create?: boolean) {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        companyId,
        hotelBookingId: stayId,
      };
      if (create) {
        const { firstName, lastName } = splitPersonName(guest.fullName);
        body.create = {
          firstName,
          lastName,
          email: createEmail.trim() || null,
          phone: createPhone.trim() || null,
        };
      } else {
        body.customerId = customerId;
      }
      const res = await fetch("/api/hotel-bookings/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Link failed");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Link failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardModal open title={`Link ${guest.fullName} to a customer`} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <p className="text-base-content/70">
          Stay snapshot stays as-is. Linking attaches a reusable customer profile for this company.
          Email is used for automatic matches; phone and name only appear as suggestions.
        </p>
        <div className="rounded-lg border border-base-content/10 bg-base-200/40 px-3 py-2">
          <div className="font-medium">{guest.fullName}</div>
          <div className="text-xs text-base-content/60">
            {guest.phone || "No phone"} · {guest.email || "No email"}
          </div>
        </div>
        {error ? <p className="text-error">{error}</p> : null}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60">
            Possible existing customer
          </p>
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : suggestions.length === 0 ? (
            <p className="text-base-content/50">No automatic suggestions. Search or create below.</p>
          ) : (
            <ul className="space-y-2">
              {suggestions.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-base-content/10 px-3 py-2"
                >
                  <div>
                    <div className="font-medium">{displayCustomerName(row)}</div>
                    <div className="text-xs text-base-content/60">
                      {row.phone || "—"} · {row.email || "—"}
                    </div>
                    <div className="text-xs text-warning">{matchReasonLabel(row.reason)}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    disabled={saving}
                    onClick={() => void link(row.id)}
                  >
                    Link
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="form-control">
          <span className="label-text text-xs">Search customers</span>
          <input
            className="input input-bordered input-sm"
            placeholder="Name, email, or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {results.length > 0 ? (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {results.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-base-200">
                <span>
                  {displayCustomerName(row)}
                  <span className="text-xs text-base-content/50"> · {row.email || row.phone || "no contact"}</span>
                </span>
                <button type="button" className="btn btn-ghost btn-xs" disabled={saving} onClick={() => void link(row.id)}>
                  Link
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="border-t border-base-content/10 pt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
            Create customer from this guest
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              className="input input-bordered input-sm"
              placeholder="Email (optional)"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
            />
            <input
              className="input input-bordered input-sm"
              placeholder="Phone (optional)"
              value={createPhone}
              onChange={(e) => setCreatePhone(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-outline btn-sm" disabled={saving} onClick={() => void link(null, true)}>
            Create and link
          </button>
          {guest.customerId ? (
            <button type="button" className="btn btn-ghost btn-sm" disabled={saving} onClick={() => void link(null)}>
              Unlink customer
            </button>
          ) : null}
        </div>
      </div>
    </DashboardModal>
  );
}
