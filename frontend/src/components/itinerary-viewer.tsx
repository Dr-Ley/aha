"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ItineraryDocument, type ItineraryDocumentModel } from "@/components/itinerary/document";
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

type QuoteLine = { label?: string; cost?: number; type?: string };

type ItineraryDto = {
  publicToken: string;
  status: string;
  title: string | null;
  summary: string | null;
  guestName: string | null;
  startDate: string | null;
  durationDays: number | null;
  adults: number;
  children: number;
  infants: number;
  sellingPrice: number | null;
  currency: string;
  plan: { days: DayPlan[]; recommendations?: string[]; assumptions?: string[] } | null;
  quote?: { pricingStatus?: string; confirmationReasons?: string[]; components?: QuoteLine[] } | null;
  editOptions?: EditOptions;
};

function shiftDate(ymd: string, days: number): string {
  const date = new Date(`${ymd}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function buildDocument(itinerary: ItineraryDto): ItineraryDocumentModel {
  const options = itinerary.editOptions;
  const nameOf = {
    destination: (id: number) => options?.destinations.find((row) => row.id === id)?.name ?? `Destination ${id}`,
    accommodation: (id: number) => options?.accommodations.find((row) => row.id === id)?.name ?? `Stay ${id}`,
    activity: (id: number) => options?.activities.find((row) => row.id === id)?.name ?? `Activity ${id}`,
    transport: (id: number) => options?.transport.find((row) => row.id === id)?.name ?? `Vehicle ${id}`,
    transfer: (id: number) => options?.transfers.find((row) => row.id === id)?.name ?? `Transfer ${id}`,
  };
  const days = (itinerary.plan?.days ?? []).map((day) => ({
    day: day.day,
    dateLabel: itinerary.startDate ? shiftDate(itinerary.startDate, day.day - 1) : `Day ${day.day}`,
    destination: nameOf.destination(day.destinationId),
    title: day.notes?.split(".")[0] || nameOf.destination(day.destinationId),
    notes: day.notes ?? null,
    activities: day.activityIds.map((id) => ({ id, name: nameOf.activity(id) })),
    accommodation: day.accommodationId != null ? nameOf.accommodation(day.accommodationId) : null,
    transfer: day.transferId != null ? nameOf.transfer(day.transferId) : null,
    transport: day.transportId != null ? nameOf.transport(day.transportId) : null,
  }));
  const stops: string[] = [];
  for (const day of days) {
    if (stops[stops.length - 1] !== day.destination) stops.push(day.destination);
  }
  const end = itinerary.startDate && itinerary.durationDays
    ? shiftDate(itinerary.startDate, Math.max(0, itinerary.durationDays - 1))
    : null;
  const status = itinerary.quote?.pricingStatus === "confirmed" ? "confirmed" : itinerary.quote ? "quote_required" : "unknown";
  return {
    title: itinerary.title || "Safari itinerary",
    summary: itinerary.summary,
    guestName: itinerary.guestName,
    dateRange: itinerary.startDate ? `${shiftDate(itinerary.startDate, 0)}${end ? ` – ${end}` : ""}` : "Dates to be confirmed",
    nights: Math.max(0, (itinerary.durationDays ?? days.length) - 1),
    adults: itinerary.adults ?? 0,
    children: itinerary.children ?? 0,
    infants: itinerary.infants ?? 0,
    days,
    stops,
    currency: itinerary.currency,
    pricingStatus: status,
    workingTotal:
      itinerary.sellingPrice != null ? formatPaymentAmountLabel(itinerary.currency, itinerary.sellingPrice) : null,
    costLines: (itinerary.quote?.components ?? []).map((line) => ({
      label: line.label || line.type || "Item",
      amountLabel: line.cost != null ? formatPaymentAmountLabel(itinerary.currency, line.cost) : "—",
    })),
    assumptions: itinerary.plan?.assumptions ?? [],
    recommendations: itinerary.plan?.recommendations ?? [],
    confirmationReasons: itinerary.quote?.confirmationReasons ?? [],
  };
}

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
  const documentModel = buildDocument(itinerary);

  return (
    <div className="space-y-10">
      <ItineraryDocument model={documentModel} />
      <div className="no-print mx-auto grid max-w-5xl gap-8 px-4 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">{itinerary.status}</p>
          <h2 className="mt-1 font-serif text-2xl font-bold">Adjust this plan</h2>
          <p className="mt-2 text-sm text-base-content/70">Changes are checked against the catalog and the price is recalculated. They are still not a confirmed selling rate.</p>
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
        <p className="text-sm text-base-content/60">Working total</p>
        <p className="font-serif text-3xl font-bold">
          {documentModel.pricingStatus === "confirmed"
            ? documentModel.workingTotal ?? "—"
            : "Request a quote"}
        </p>
        <p className="text-xs text-base-content/60">
          {documentModel.workingTotal
            ? `Enzi working figure ${documentModel.workingTotal}. It is not confirmed until every rate has a validity window and a selling confirmation.`
            : "Enzi has not calculated a working figure yet."}
        </p>
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
    </div>
  );
}
