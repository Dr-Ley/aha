"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatPaymentAmountLabel } from "@/lib/email/payment-acknowledgement-template";

export type ItineraryDayView = {
  day: number;
  dateLabel: string;
  destination: string;
  title: string;
  notes: string | null;
  activities: Array<{ id: number; name: string }>;
  accommodation: string | null;
  transfer: string | null;
  transport: string | null;
};

export type ItineraryCostLine = {
  label: string;
  amountLabel: string;
};

export type ItineraryDocumentModel = {
  title: string;
  summary: string | null;
  guestName: string | null;
  dateRange: string;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  days: ItineraryDayView[];
  stops: string[];
  currency: string;
  pricingStatus: "confirmed" | "quote_required" | "unknown";
  workingTotal: string | null;
  costLines: ItineraryCostLine[];
  assumptions: string[];
  recommendations: string[];
  confirmationReasons: string[];
};

const SECTIONS = [
  { id: "cover", label: "Cover" },
  { id: "overview", label: "Overview" },
  { id: "glance", label: "Trip at a glance" },
  { id: "route", label: "Route" },
  { id: "costs", label: "Costs" },
  { id: "practical", label: "Next steps" },
];

function dayAnchor(day: number): string {
  return `day-${day}`;
}

export function PrintButton() {
  return (
    <button type="button" className="btn btn-outline btn-sm no-print" onClick={() => window.print()}>
      Download PDF
    </button>
  );
}

export function CoverHero({ model }: { model: ItineraryDocumentModel }) {
  return (
    <section id="cover" className="print-section grid overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 lg:grid-cols-2">
      <div className="relative min-h-72">
        <Image
          src="/wildebeests-are-crossing-th-mara.png"
          alt="Wildebeest crossing a river in the Maasai Mara"
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
        />
      </div>
      <div className="flex flex-col justify-center gap-4 p-8 lg:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">African Home Adventure</p>
        <h1 className="font-serif text-4xl font-bold text-base-content">{model.title}</h1>
        <p className="text-base-content/70">{model.guestName ? `Prepared for ${model.guestName}` : "Prepared for you"}</p>
        <p className="text-sm text-base-content/70">
          {model.dateRange} · {model.nights} night{model.nights === 1 ? "" : "s"}
        </p>
      </div>
    </section>
  );
}

export function OverviewCard({ model }: { model: ItineraryDocumentModel }) {
  return (
    <section id="overview" className="print-section space-y-4">
      <h2 className="font-serif text-3xl font-semibold">Travel brief</h2>
      {model.summary ? <p className="max-w-3xl leading-relaxed text-base-content/80">{model.summary}</p> : null}
      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-base-content/10 p-4">
          <dt className="text-xs uppercase tracking-widest text-base-content/50">Dates</dt>
          <dd className="mt-1 font-medium">{model.dateRange}</dd>
        </div>
        <div className="rounded-xl border border-base-content/10 p-4">
          <dt className="text-xs uppercase tracking-widest text-base-content/50">Guests</dt>
          <dd className="mt-1 font-medium">
            {model.adults} adult{model.adults === 1 ? "" : "s"}
            {model.children ? `, ${model.children} child${model.children === 1 ? "" : "ren"}` : ""}
            {model.infants ? `, ${model.infants} infant${model.infants === 1 ? "" : "s"}` : ""}
          </dd>
        </div>
        <div className="rounded-xl border border-base-content/10 p-4">
          <dt className="text-xs uppercase tracking-widest text-base-content/50">Route</dt>
          <dd className="mt-1 font-medium">{model.stops.join(" → ") || "—"}</dd>
        </div>
      </dl>
    </section>
  );
}

export function TripTable({ model }: { model: ItineraryDocumentModel }) {
  const [tab, setTab] = useState<"all" | "stay">("all");
  const rows = tab === "stay" ? model.days.filter((day) => day.accommodation) : model.days;
  return (
    <section id="glance" className="print-section space-y-4">
      <h2 className="font-serif text-3xl font-semibold">Trip at a glance</h2>
      <div className="tabs tabs-bordered" role="tablist">
        <button type="button" role="tab" className={`tab ${tab === "all" ? "tab-active" : ""}`} onClick={() => setTab("all")}>
          All
        </button>
        <button type="button" role="tab" className="tab" aria-selected="false" disabled>
          Flights
        </button>
        <button type="button" role="tab" className={`tab ${tab === "stay" ? "tab-active" : ""}`} onClick={() => setTab("stay")}>
          Accommodation
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-base-content/10">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Location</th>
              <th>Property</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((day) => (
              <tr key={day.day}>
                <td>{day.dateLabel}</td>
                <td>{day.day}</td>
                <td>{day.destination}</td>
                <td>{day.accommodation ?? "To be confirmed"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-base-content/60">Flights are not on this itinerary. None are stored for this plan.</p>
    </section>
  );
}

export function ActivityList({ activities }: { activities: ItineraryDayView["activities"] }) {
  if (activities.length === 0) return <p className="text-sm text-base-content/60">No catalog activity is assigned to this day.</p>;
  return (
    <ul className="space-y-2">
      {activities.map((activity) => (
        <li key={activity.id} className="text-sm">
          <span className="font-medium">{activity.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function TransferRow({ label }: { label: string | null }) {
  if (!label) return null;
  return <p className="text-sm text-base-content/80">Transfer: {label}</p>;
}

export function AccommodationCard({ name }: { name: string | null }) {
  return (
    <div className="rounded-xl border border-base-content/10 p-4">
      <p className="text-xs uppercase tracking-widest text-base-content/50">Overnight</p>
      <p className="mt-1 font-serif text-xl">{name ?? "Accommodation to be confirmed"}</p>
      <p className="mt-1 text-sm text-base-content/60">Room type and meal plan are confirmed only when a dated rate is marked confirmed.</p>
    </div>
  );
}

export function OvernightBlock({ name }: { name: string | null }) {
  return <AccommodationCard name={name} />;
}

export function DayPage({ day }: { day: ItineraryDayView }) {
  return (
    <section id={dayAnchor(day.day)} className="print-section grid gap-6 border-t border-base-content/10 pt-10 lg:grid-cols-2">
      <div className="relative min-h-64 overflow-hidden rounded-xl">
        <Image
          src="/mara_morning.png"
          alt={`Landscape associated with ${day.destination}`}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 40vw, 100vw"
        />
      </div>
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-primary">Day {day.day}</p>
        <h2 className="font-serif text-3xl font-semibold">{day.title}</h2>
        <p className="text-sm text-base-content/60">{day.dateLabel} · {day.destination}</p>
        {day.notes ? <p className="leading-relaxed text-base-content/80">{day.notes}</p> : null}
        <ActivityList activities={day.activities} />
        <TransferRow label={day.transfer} />
        {day.transport ? <p className="text-sm text-base-content/70">Vehicle: {day.transport}</p> : null}
        <OvernightBlock name={day.accommodation} />
      </div>
    </section>
  );
}

export function MapSection({ stops }: { stops: string[] }) {
  return (
    <section id="route" className="print-section space-y-4">
      <h2 className="font-serif text-3xl font-semibold">Route</h2>
      <ol className="space-y-3">
        {stops.map((stop, index) => (
          <li key={`${stop}-${index}`} className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-base-content/20 font-serif">{index + 1}</span>
            <span>{stop}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CostsTable({ model }: { model: ItineraryDocumentModel }) {
  const unconfirmed = model.pricingStatus !== "confirmed";
  return (
    <section id="costs" className="print-section space-y-4">
      <h2 className="font-serif text-3xl font-semibold">Costs</h2>
      {unconfirmed ? (
        <p className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          Request a quote. The working total is not a confirmed selling price.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-base-content/10">
        <table className="table">
          <tbody>
            {model.costLines.map((line) => (
              <tr key={line.label}>
                <td>{line.label}</td>
                <td className="text-right">{line.amountLabel}</td>
              </tr>
            ))}
            <tr>
              <td className="font-semibold">{unconfirmed ? "Working total" : "Total"}</td>
              <td className="text-right font-semibold">{model.workingTotal ?? "Request a quote"}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {model.confirmationReasons.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-base-content/70">
          {model.confirmationReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function ContentBlock({ model }: { model: ItineraryDocumentModel }) {
  return (
    <section id="practical" className="print-section space-y-4">
      <h2 className="font-serif text-3xl font-semibold">Practical information</h2>
      {model.assumptions.length > 0 ? (
        <div>
          <h3 className="font-serif text-xl">Assumptions</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-base-content/80">
            {model.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {model.recommendations.length > 0 ? (
        <div>
          <h3 className="font-serif text-xl">Next steps</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-base-content/80">
            {model.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function ItinerarySidebar({ days }: { days: ItineraryDayView[] }) {
  const [active, setActive] = useState("cover");
  const ids = [...SECTIONS.map((section) => section.id), ...days.map((day) => dayAnchor(day.day))];

  useEffect(() => {
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.2, 0.6] }
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [ids.join("|")]);

  const items = [
    SECTIONS[0]!,
    SECTIONS[1]!,
    SECTIONS[2]!,
    ...days.map((day) => ({ id: dayAnchor(day.day), label: `Day ${day.day}` })),
    SECTIONS[3]!,
    SECTIONS[4]!,
    SECTIONS[5]!,
  ];

  return (
    <nav aria-label="Itinerary sections" className="menu p-4">
      <p className="menu-title">Contents</p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={active === item.id ? "active" : undefined}
              aria-current={active === item.id ? "true" : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ItineraryDocument({ model }: { model: ItineraryDocumentModel }) {
  return (
    <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-base-content/10 no-print lg:block">
        <ItinerarySidebar days={model.days} />
      </aside>
      <div>
        <div className="sticky top-0 z-10 border-b border-base-content/10 bg-base-100 px-4 py-3 no-print lg:hidden">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Contents</p>
            <PrintButton />
          </div>
          <ItinerarySidebar days={model.days} />
        </div>
        <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-8 lg:px-8">
          <div className="hidden justify-end no-print lg:flex">
            <PrintButton />
          </div>
          <CoverHero model={model} />
          <OverviewCard model={model} />
          <TripTable model={model} />
          {model.days.map((day) => (
            <DayPage key={day.day} day={day} />
          ))}
          <MapSection stops={model.stops} />
          <CostsTable model={model} />
          <ContentBlock model={model} />
        </div>
      </div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-section { break-after: page; }
        }
      `}</style>
    </div>
  );
}
