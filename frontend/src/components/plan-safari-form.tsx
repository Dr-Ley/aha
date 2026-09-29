"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Compass } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";

type DestinationOption = {
  id: number;
  name: string;
  slug: string;
  country: string;
};

export function PlanSafariForm() {
  const router = useRouter();
  const { currency } = useCurrency();
  const [destinations, setDestinations] = useState<DestinationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<string>("");
  const [durationDays, setDurationDays] = useState(5);
  const [startDate, setStartDate] = useState("");
  const [category, setCategory] = useState<"budget" | "mid-range" | "luxury" | "">("");
  const [interests, setInterests] = useState<string[]>(["wildlife"]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [airportTransfer, setAirportTransfer] = useState(true);

  useEffect(() => {
    void fetch("/api/destinations?country=Kenya")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.destinations)) setDestinations(data.destinations);
      })
      .catch(() => setError("Could not load destinations"));
  }, []);

  function toggleDest(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleInterest(tag: string) {
    setInterests((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ages = childAges
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((n) => Number.isFinite(n));
    try {
      const res = await fetch("/api/itineraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: "aha",
          destinationIds: selected,
          durationDays,
          startDate: startDate || undefined,
          adults,
          children,
          childAges: children ? ages : [],
          accommodationCategory: category || undefined,
          interests,
          airportTransfer,
          guestEmail: email || undefined,
          guestName: name || undefined,
          currency,
          generate: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.itinerary?.publicToken) {
        throw new Error(data.error || "Could not generate itinerary");
      }
      router.push(`/itineraries/${data.itinerary.publicToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate itinerary");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <fieldset className="space-y-3">
          <legend className="font-serif text-xl font-semibold">Destinations</legend>
          <p className="text-sm text-base-content/70">Select one or more parks. Leave empty to let us recommend a circuit.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {destinations.map((dest) => (
              <label key={dest.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-base-content/10 p-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={selected.includes(dest.id)}
                  onChange={() => toggleDest(dest.id)}
                />
                <span>
                  <span className="block font-medium">{dest.name}</span>
                  <span className="text-xs text-base-content/60">{dest.country}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-3">
          <legend className="mb-2 font-serif text-xl font-semibold">Travellers</legend>
          <label className="form-control">
            <span className="label-text">Adults</span>
            <input className="input input-bordered" type="number" min={0} max={20} value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
          </label>
          <label className="form-control">
            <span className="label-text">Children</span>
            <input className="input input-bordered" type="number" min={0} max={20} value={children} onChange={(e) => setChildren(Number(e.target.value))} />
          </label>
          <label className="form-control">
            <span className="label-text">Child ages</span>
            <input
              className="input input-bordered"
              placeholder="6, 9"
              value={childAges}
              onChange={(e) => setChildAges(e.target.value)}
              disabled={children < 1}
            />
          </label>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-serif text-xl font-semibold">Trip</legend>
          <label className="form-control">
            <span className="label-text">Duration (days)</span>
            <input className="input input-bordered" type="number" min={1} max={21} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} />
          </label>
          <label className="form-control">
            <span className="label-text">Arrival date</span>
            <input className="input input-bordered" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="form-control">
            <span className="label-text">Lodge style</span>
            <select className="select select-bordered" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
              <option value="">No preference</option>
              <option value="budget">Budget</option>
              <option value="mid-range">Mid-range</option>
              <option value="luxury">Luxury</option>
            </select>
          </label>
          <label className="flex items-center gap-3 pt-6">
            <input type="checkbox" className="checkbox checkbox-primary" checked={airportTransfer} onChange={(e) => setAirportTransfer(e.target.checked)} />
            <span>Include airport transfer</span>
          </label>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-serif text-xl font-semibold">Interests</legend>
          <div className="flex flex-wrap gap-2">
            {["wildlife", "photography", "adventure", "relaxation", "culture", "family"].map((tag) => (
              <button
                type="button"
                key={tag}
                className={`btn btn-sm ${interests.includes(tag) ? "btn-primary" : "btn-outline"}`}
                onClick={() => toggleInterest(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-base-content/10 bg-base-100 p-6 shadow-sm">
        <h2 className="font-serif text-lg font-semibold">Your details</h2>
        <label className="form-control">
          <span className="label-text">Name</span>
          <input className="input input-bordered" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="form-control">
          <span className="label-text">Email</span>
          <input className="input input-bordered" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <button className="btn btn-primary w-full" type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
          Generate itinerary
        </button>
        <p className="text-xs text-base-content/60">
          Prices are calculated by Enzi from live tourism data. You can change lodges and activities after generation.
        </p>
      </aside>
    </form>
  );
}
