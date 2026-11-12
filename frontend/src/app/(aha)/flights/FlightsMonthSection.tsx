"use client";

import { useState } from "react";
import { Container, Section } from "@/components/layout";

const monthFlightTips: Record<string, { tip: string; prices: string }> = {
  January: {
    tip: "Post-holiday dip in prices. Good availability.",
    prices: "Moderate",
  },
  February: {
    tip: "Excellent time to book. Lower demand.",
    prices: "Low to Moderate",
  },
  March: {
    tip: "Shoulder season begins. Good deals available.",
    prices: "Low",
  },
  April: {
    tip: "Rainy season = lowest flight prices of the year.",
    prices: "Lowest",
  },
  May: {
    tip: "Continued low season. Great for budget travelers.",
    prices: "Low",
  },
  June: {
    tip: "Prices start rising. Book 3-4 months ahead.",
    prices: "Moderate to High",
  },
  July: {
    tip: "Peak season begins. Book early for best rates.",
    prices: "High",
  },
  August: {
    tip: "Highest demand. Book 4-6 months in advance.",
    prices: "Highest",
  },
  September: {
    tip: "Great migration peak. Still high demand.",
    prices: "High",
  },
  October: {
    tip: "Shoulder season returns. Good value.",
    prices: "Moderate",
  },
  November: {
    tip: "Short rains. Lower prices and fewer crowds.",
    prices: "Moderate",
  },
  December: {
    tip: "Holiday peak. Book well in advance.",
    prices: "High",
  },
};

const MONTHS = Object.keys(monthFlightTips);

export function FlightsMonthSection() {
  const [selectedMonth, setSelectedMonth] = useState("September");
  const data = monthFlightTips[selectedMonth];

  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-8">
          <p className="text-md font-semibold uppercase tracking-widest text-accent">
            When Are You Flying?
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
            Flight Tips by Month
          </h2>
          <p className="mt-3 text-base-content/70">
            Flight prices and availability vary significantly throughout the
            year. Select your travel month to see tips and expected pricing.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-1 mb-8">
          {MONTHS.map((month) => (
            <button
              key={month}
              type="button"
              onClick={() => setSelectedMonth(month)}
              className={`btn btn-sm ${
                selectedMonth === month ? "btn-primary" : "btn-ghost"
              }`}
            >
              {month.slice(0, 3)}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-2xl card bg-base-100 border border-base-300 p-6 text-center shadow-md">
          <h3 className="font-serif text-xl font-semibold text-base-content">
            {selectedMonth}
          </h3>
          <p className="mt-2 text-base-content/70">{data.tip}</p>
          <div className="mt-4">
            <span className="badge badge-warning badge-lg">
              Expected Prices: {data.prices}
            </span>
          </div>
        </div>
      </Container>
    </Section>
  );
}
