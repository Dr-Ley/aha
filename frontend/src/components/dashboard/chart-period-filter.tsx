"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { CHART_PERIOD_OPTIONS, type ChartPeriod } from "@/lib/chart-period";

export function ChartPeriodFilter({
  value,
  onChange,
  shift = 0,
  onShift,
  label,
}: {
  value: ChartPeriod;
  onChange: (period: ChartPeriod) => void;
  shift?: number;
  onShift?: (shift: number) => void;
  label: string;
}) {
  const movable = value === "week" || value === "day";
  const previousLabel = value === "week" ? "Previous week" : "Previous day";
  const nextLabel = value === "week" ? "Next week" : "Next day";

  return (
    <div className="flex shrink-0 items-center gap-1">
      {movable && onShift ? (
        <button
          type="button"
          className="btn btn-ghost btn-xs px-1"
          aria-label={previousLabel}
          onClick={() => onShift(shift - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <select
        className="select select-bordered select-xs w-40 shrink-0 rounded-md"
        style={{ outline: "1px solid gray" }}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as ChartPeriod)}
      >
        {CHART_PERIOD_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {movable && onShift ? (
        <button
          type="button"
          className="btn btn-ghost btn-xs px-1"
          aria-label={nextLabel}
          onClick={() => onShift(shift + 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
