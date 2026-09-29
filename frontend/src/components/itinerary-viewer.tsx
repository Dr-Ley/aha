"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatPaymentAmountLabel } from "@/lib/email/payment-acknowledgement-template";

type EditOptions = {
  destinations: Array<{ id: number; name: string; country: string }>;
  accommodations: Array<{ id: number; name: string; destinationId: number | null; category: string }>;
  activities: Array<{ id: number; name: string; destinationId: number }>;
  transport: Array<{ id: number; name: string; capacity: number }>;
  transfers: Array<{ id: number; name: string }>;
};

type DayPlan = {
  day: number;
  destinationId: number;
  activityIds: number[];
  accommodationId: number | null;
  transportId: number | null;
  transferId: number | null;
  notes?: string | null;
};

type ItineraryDto = {
  publicToken: string;
  status: string;
  title: string | null;
  summary: string | null;
  startDate: string | null;
  durationDays: number | null;
  sellingPrice: number | null;
  currency: string;
  plan: { days: DayPlan[]; recommendations?: string[]; assumptions?: string[] } | null;
  editOptions?: EditOptions;
};

export function ItineraryViewer({ token }: { token: string }) {
  const [itinerary, setItinerary] = useState<ItineraryDto | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/itineraries/${token}?token=${token}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Not found");
    setItinerary(data.itinerary);
  }, [token]);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Not found"));
  }, [load]);

  async function patchDay(day: number, patch: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/itineraries/${token}?token=${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setItinerary(data.itinerary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/itineraries/${token}/accept?token=${token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not accept");
      setItinerary(data.itinerary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not accept");
    } finally {
      setBusy(false);
    }
  }

  if (!itinerary && !error) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!itinerary) return <p className="text-error">{error}</p>;

  const options = itinerary.editOptions;
  const editable = itinerary.status === "generated" || itinerary.status === "modified" || itinerary.status === "draft";

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">{itinerary.status}</p>
          <h1 className="mt-1 font-serif text-3xl font-bold">{itinerary.title || "Safari itinerary"}</h1>
          <p className="mt-2 text-base-content/70">{itinerary.summary}</p>
        </div>
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <ol className="space-y-4">
          {itinerary.plan?.days.map((day) => (
            <li key={day.day} className="rounded-2xl border border-base-content/10 bg-base-100 p-5">
              <h2 className="font-semibold">Day {day.day}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="form-control">
                  <span className="label-text">Park / destination</span>
                  <select
                    className="select select-bordered select-sm"
                    disabled={!editable || busy}
                    value={String(day.destinationId)}
                    onChange={(e) => patchDay(day.day, { destinationId: Number(e.target.value) })}
                  >
                    {options?.destinations.map((dest) => (
                      <option key={dest.id} value={String(dest.id)}>
                        {dest.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-control">
                  <span className="label-text">Accommodation</span>
                  <select
                    className="select select-bordered select-sm"
                    disabled={!editable || busy}
                    value={day.accommodationId != null ? String(day.accommodationId) : ""}
                    onChange={(e) =>
                      patchDay(day.day, {
                        accommodationId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">None</option>
                    {options?.accommodations
                      .filter((acc) => acc.destinationId === day.destinationId || acc.destinationId == null)
                      .map((acc) => (
                        <option key={acc.id} value={String(acc.id)}>
                          {acc.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="form-control sm:col-span-2">
                  <span className="label-text">Activity</span>
                  <select
                    className="select select-bordered select-sm"
                    disabled={!editable || busy}
                    value={day.activityIds[0] != null ? String(day.activityIds[0]) : ""}
                    onChange={(e) =>
                      patchDay(day.day, {
                        activityIds: e.target.value ? [Number(e.target.value)] : [],
                      })
                    }
                  >
                    <option value="">None</option>
                    {options?.activities
                      .filter((act) => act.destinationId === day.destinationId)
                      .map((act) => (
                        <option key={act.id} value={String(act.id)}>
                          {act.name}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              {day.notes ? <p className="mt-3 text-sm text-base-content/70">{day.notes}</p> : null}
            </li>
          ))}
        </ol>
      </div>
      <aside className="h-fit space-y-4 rounded-2xl border border-base-content/10 bg-base-100 p-6 shadow-sm">
        <p className="text-sm text-base-content/60">Quoted total</p>
        <p className="font-serif text-3xl font-bold">
          {itinerary.sellingPrice != null
            ? formatPaymentAmountLabel(itinerary.currency, itinerary.sellingPrice)
            : "—"}
        </p>
        <p className="text-xs text-base-content/60">Priced by Enzi. Changing a lodge or activity recalculates this total.</p>
        {editable ? (
          <button className="btn btn-primary w-full" disabled={busy} onClick={() => void accept()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Accept itinerary
          </button>
        ) : (
          <p className="rounded-lg bg-base-200 p-3 text-sm">
            This itinerary is {itinerary.status}. Our team will review it before it becomes a booking.
          </p>
        )}
      </aside>
    </div>
  );
}
