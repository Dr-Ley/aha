"use client";

import { useCurrency } from "@/lib/currency-context";

export type FlightCostRow = {
  from: string;
  minUsd: number;
  maxUsd: number;
  season: string;
};

export function FlightCostsTable({ rows }: { rows: FlightCostRow[] }) {
  const { formatPrice } = useCurrency();

  return (
    <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
      <table className="table">
        <thead>
          <tr className="bg-base-200">
            <th className="text-base-content">Departing From</th>
            <th className="text-base-content">Price Range (Round Trip)</th>
            <th className="text-base-content">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((cost, index) => (
            <tr
              key={cost.from}
              className={index % 2 === 0 ? "bg-base-100" : "bg-base-200/50"}
            >
              <td className="text-base-content">{cost.from}</td>
              <td className="font-medium text-base-content">
                {formatPrice(cost.minUsd)} – {formatPrice(cost.maxUsd)}
              </td>
              <td className="text-sm text-base-content/80">{cost.season}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
