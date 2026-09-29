"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCompany } from "@/store/company-context";
import { formatUsdForDisplay } from "@/lib/data";
import { quoteTourSafariPackage, resolvePackageRatesUsd } from "@/lib/pricing";
import {
  DashboardPagination,
  DashboardTableExport,
  type ExportColumn,
  useDashboardPagination,
} from "@/components/dashboard/dashboard-table-tools";

type TourRateRow = {
  id: string;
  slug: string;
  title: string;
  duration: string;
  price: number;
  childPrice?: number;
  infantPrice?: number;
};

type RateDraft = {
  price: string;
  childPrice: string;
  infantPrice: string;
};

const exportColumns: ExportColumn<TourRateRow>[] = [
  { key: "title", header: "Tour", value: (row) => row.title },
  { key: "duration", header: "Duration", value: (row) => row.duration },
  { key: "price", header: "Adult USD", value: (row) => row.price },
  { key: "childPrice", header: "Child USD", value: (row) => row.childPrice ?? "" },
  { key: "infantPrice", header: "Infant USD", value: (row) => row.infantPrice ?? "" },
];

function rateToInput(value: number | undefined | null): string {
  return value == null ? "" : String(value);
}

function draftsFromRows(rows: TourRateRow[]): Record<string, RateDraft> {
  const next: Record<string, RateDraft> = {};
  for (const row of rows) {
    next[row.id] = {
      price: rateToInput(row.price),
      childPrice: rateToInput(row.childPrice),
      infantPrice: rateToInput(row.infantPrice),
    };
  }
  return next;
}

function parseUsdField(raw: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Adult USD rate is required" };
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 0 || n > 1_000_000) {
    return { ok: false, error: "Rates must be whole USD amounts from 0 to 1,000,000" };
  }
  return { ok: true, value: n };
}

function parseOptionalUsdField(
  raw: string
): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 0 || n > 1_000_000) {
    return { ok: false, error: "Rates must be whole USD amounts from 0 to 1,000,000" };
  }
  return { ok: true, value: n };
}

function sampleQuoteLabel(draft: RateDraft): string {
  const adult = Number(draft.price);
  if (!Number.isInteger(adult) || adult < 0) return "—";
  const childParsed = parseOptionalUsdField(draft.childPrice);
  const infantParsed = parseOptionalUsdField(draft.infantPrice);
  const quote = quoteTourSafariPackage(
    {
      price: adult,
      childPrice: childParsed.ok ? childParsed.value : null,
      infantPrice: infantParsed.ok ? infantParsed.value : null,
    },
    { adults: 2, children: 1, infants: 0 },
    "USD"
  );
  return formatUsdForDisplay(quote.sellingPrice, "USD");
}

function effectiveHint(draft: RateDraft): string {
  const adult = Number(draft.price);
  if (!Number.isInteger(adult) || adult < 0) return "";
  const childParsed = parseOptionalUsdField(draft.childPrice);
  const infantParsed = parseOptionalUsdField(draft.infantPrice);
  const rates = resolvePackageRatesUsd({
    price: adult,
    childPrice: childParsed.ok ? childParsed.value : null,
    infantPrice: infantParsed.ok ? infantParsed.value : null,
  });
  const childNote = draft.childPrice.trim() === "" ? "child uses adult" : `child $${rates.child}`;
  const infantNote = draft.infantPrice.trim() === "" ? "infant free" : `infant $${rates.infant}`;
  return `${childNote}; ${infantNote}`;
}

export function ToursPanel() {
  const { selectedCompanyId, canEditModule } = useCompany();
  const canEdit = canEditModule("tours") || canEditModule("bookings");
  const [rows, setRows] = useState<TourRateRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, RateDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ companyId: selectedCompanyId });
      const res = await fetch(`/api/tours?${qs}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to load tours");
      const list = (Array.isArray(data) ? data : data.tours ?? []) as TourRateRow[];
      setRows(list);
      setDrafts(draftsFromRows(list));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setRows([]);
      setDrafts({});
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => `${row.title} ${row.slug} ${row.duration}`.toLowerCase().includes(needle));
  }, [rows, query]);

  const { page, pageCount, setPage, pagedRows } = useDashboardPagination(filtered, 10);

  function updateDraft(id: string, patch: Partial<RateDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { price: "", childPrice: "", infantPrice: "" }), ...patch },
    }));
  }

  function isDirty(row: TourRateRow): boolean {
    const draft = drafts[row.id];
    if (!draft) return false;
    return (
      draft.price !== rateToInput(row.price) ||
      draft.childPrice !== rateToInput(row.childPrice) ||
      draft.infantPrice !== rateToInput(row.infantPrice)
    );
  }

  async function saveRow(row: TourRateRow) {
    const draft = drafts[row.id];
    if (!draft) return;
    const adult = parseUsdField(draft.price);
    const child = parseOptionalUsdField(draft.childPrice);
    const infant = parseOptionalUsdField(draft.infantPrice);
    if (!adult.ok) {
      setError(adult.error);
      return;
    }
    if (!child.ok) {
      setError(child.error);
      return;
    }
    if (!infant.ok) {
      setError(infant.error);
      return;
    }
    setSavingId(row.id);
    setError(null);
    try {
      const res = await fetch("/api/tours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(row.id),
          companyId: selectedCompanyId,
          price: adult.value,
          childPrice: child.value,
          infantPrice: infant.value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Save failed");
      const saved = data.tour as TourRateRow;
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, ...saved } : item)));
      setDrafts((prev) => ({
        ...prev,
        [row.id]: {
          price: rateToInput(saved.price),
          childPrice: rateToInput(saved.childPrice),
          infantPrice: rateToInput(saved.infantPrice),
        },
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Safari tours</h1>
        <p className="text-sm text-base-content/60">
          Package rates are stored in USD. Leave child blank to charge the adult rate. Leave infant blank
          to treat infants as complimentary. Website quotes use these rates and round up to the nearest 10.
        </p>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input input-bordered input-sm w-full max-w-xs"
          placeholder="Search tours"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <DashboardTableExport title={`Safari tours ${selectedCompanyId}`} columns={exportColumns} rows={filtered} />
      </div>

      {loading ? (
        <div className="loading loading-spinner loading-md" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-content/10">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Tour</th>
                <th>Adult USD</th>
                <th>Child USD</th>
                <th>Infant USD</th>
                <th>Sample 2 adults + 1 child</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-base-content/60">
                    No safari packages for this company.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const draft = drafts[row.id] ?? {
                    price: rateToInput(row.price),
                    childPrice: rateToInput(row.childPrice),
                    infantPrice: rateToInput(row.infantPrice),
                  };
                  const dirty = isDirty(row);
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="font-medium">{row.title}</div>
                        <div className="text-xs text-base-content/50">{row.duration}</div>
                        <div className="text-xs text-base-content/50">{effectiveHint(draft)}</div>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className="input input-bordered input-sm w-28"
                          disabled={!canEdit}
                          value={draft.price}
                          onChange={(e) => updateDraft(row.id, { price: e.target.value })}
                          aria-label={`${row.title} adult USD rate`}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className="input input-bordered input-sm w-28"
                          disabled={!canEdit}
                          placeholder="Adult rate"
                          value={draft.childPrice}
                          onChange={(e) => updateDraft(row.id, { childPrice: e.target.value })}
                          aria-label={`${row.title} child USD rate`}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className="input input-bordered input-sm w-28"
                          disabled={!canEdit}
                          placeholder="Free"
                          value={draft.infantPrice}
                          onChange={(e) => updateDraft(row.id, { infantPrice: e.target.value })}
                          aria-label={`${row.title} infant USD rate`}
                        />
                      </td>
                      <td className="whitespace-nowrap font-medium">{sampleQuoteLabel(draft)}</td>
                      <td>
                        {canEdit ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            disabled={!dirty || savingId === row.id}
                            onClick={() => void saveRow(row)}
                          >
                            {savingId === row.id ? "Saving…" : "Save"}
                          </button>
                        ) : (
                          <span className="text-xs text-base-content/50">View only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <DashboardPagination page={page} pageCount={pageCount} setPage={setPage} />
    </div>
  );
}
