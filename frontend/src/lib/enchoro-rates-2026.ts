import type { CurrencyCode } from "@/lib/data";
import type { HotelStayQuote } from "@/lib/pricing";

export const ENCHORO_RATES_YEAR = 2026;
export const ENCHORO_MEAL_BASIS = "full_board" as const;
export const ENCHORO_CHILD_PERCENT = 75;
export const ENCHORO_INFANT_MAX_AGE = 2;

export const ENCHORO_RATE_EMAILS = [
  "info@enchorowildlifecamp.com",
  "reservation@enchorowildlifecamp.com",
] as const;

export const ENCHORO_RATE_INCLUSION =
  "Accommodation, full board, tea and coffee, service charges and all taxes. Infant until two years is free of charge. Child is between 2 and 12 years and pays 75% of adult rate.";

export type GuestCategory = "non_resident" | "resident";
export type RateSeason = "low" | "high";
export type OccupancyKind = "single" | "double" | "triple" | "extra_adult";

export const GUEST_CATEGORIES: Array<{ id: GuestCategory; label: string }> = [
  { id: "resident", label: "Resident / Citizen" },
  { id: "non_resident", label: "Non-resident" },
];

type OccupancyAmounts = {
  single: number;
  double: number;
  triple: number;
  extraAdult: number;
};

export const ENCHORO_ACCOMMODATION_RATES_2026 = {
  year: ENCHORO_RATES_YEAR,
  mealBasis: ENCHORO_MEAL_BASIS,
  emails: ENCHORO_RATE_EMAILS,
  inclusion: ENCHORO_RATE_INCLUSION,
  childPercent: ENCHORO_CHILD_PERCENT,
  infantMaxAge: ENCHORO_INFANT_MAX_AGE,
  nonResident: {
    currency: "USD" as const,
    low: { single: 100, double: 180, triple: 250, extraAdult: 70 } satisfies OccupancyAmounts,
    high: { single: 120, double: 200, triple: 270, extraAdult: 90 } satisfies OccupancyAmounts,
    lowMonths: "March–June and October–November",
    highMonths: "January–February, July–September and December",
  },
  resident: {
    currency: "KES" as const,
    low: { single: 7500, double: 14000, triple: 18000, extraAdult: 6000 } satisfies OccupancyAmounts,
    high: { single: 9000, double: 17000, triple: 21000, extraAdult: 7000 } satisfies OccupancyAmounts,
    lowMonths: "March–June and October–November",
    highMonths: "January–February, July–September and December",
  },
};

export const ENCHORO_SAFARI_VEHICLE_2026 = {
  name: "Enchoro Wildlife Camp safari vehicle",
  vehicleType: "landcruiser",
  dailyRateUsd: 230,
  capacity: 7,
  notes:
    "Customized seven-seater safari vehicle or 4x4 Toyota Land Cruiser / Land Rover with modified suspension, photographic roof hatches and seat belts. USD 230 per day, available at the camp in Masai Mara.",
};

export const MAASAI_MARA_PARK_FEES_2026 = {
  destinationSlug: "maasai-mara",
  name: "Maasai Mara park entrance",
  nonResident: {
    high: { adultUsd: 200, childUsd: 100 },
    low: { adultUsd: 100, childUsd: 50 },
    childMaxAge: 17,
  },
  resident: {
    adultKes: 5000,
    childKes: 2500,
    childMaxAge: 12,
  },
  parkHighSeason: "01/07 to 31/12",
  parkLowSeason: "01/01 to 30/06",
};

export function guestCategoryCurrency(category: GuestCategory): CurrencyCode {
  return category === "non_resident" ? "USD" : "KES";
}

/** Accommodation STO seasons: low Mar–Jun + Oct–Nov; high Jan–Feb + Jul–Sep + Dec. */
export function accommodationSeasonForDate(ymd: string): RateSeason {
  const month = Number(String(ymd).slice(5, 7));
  if ([3, 4, 5, 6, 10, 11].includes(month)) return "low";
  return "high";
}

/** Park entrance seasons: high 1 Jul–31 Dec; low 1 Jan–30 Jun. */
export function parkSeasonForDate(ymd: string): RateSeason {
  const month = Number(String(ymd).slice(5, 7));
  if (!Number.isFinite(month) || month < 1) return "high";
  return month >= 7 ? "high" : "low";
}

export function tentPricing(
  name: string | null | undefined,
  maxOccupancy?: number | null
): { occupancy: OccupancyKind; extraAdultBeds: number; beds: number } {
  const n = (name ?? "").toLowerCase();
  if (n.includes("family") || (maxOccupancy ?? 0) >= 4) {
    return { occupancy: "triple", extraAdultBeds: 1, beds: 4 };
  }
  if (n.includes("triple") || maxOccupancy === 3) {
    return { occupancy: "triple", extraAdultBeds: 0, beds: 3 };
  }
  if (n.includes("single") || maxOccupancy === 1) {
    return { occupancy: "single", extraAdultBeds: 0, beds: 1 };
  }
  return { occupancy: "double", extraAdultBeds: 0, beds: 2 };
}

function occupancyAmount(amounts: OccupancyAmounts, occupancy: OccupancyKind): number {
  if (occupancy === "extra_adult") return amounts.extraAdult;
  return amounts[occupancy];
}

export function enchoroOccupancyAmount(input: {
  guestCategory: GuestCategory;
  season: RateSeason;
  occupancy: OccupancyKind;
}): number {
  const band =
    input.guestCategory === "non_resident"
      ? ENCHORO_ACCOMMODATION_RATES_2026.nonResident
      : ENCHORO_ACCOMMODATION_RATES_2026.resident;
  return occupancyAmount(band[input.season], input.occupancy);
}

export function enchoroTentNightlyRate(input: {
  guestCategory: GuestCategory;
  season: RateSeason;
  roomTypeName?: string | null;
  maxOccupancy?: number | null;
}): number {
  const tent = tentPricing(input.roomTypeName, input.maxOccupancy);
  const base = enchoroOccupancyAmount({
    guestCategory: input.guestCategory,
    season: input.season,
    occupancy: tent.occupancy,
  });
  if (!tent.extraAdultBeds) return base;
  return (
    base +
    tent.extraAdultBeds *
      enchoroOccupancyAmount({
        guestCategory: input.guestCategory,
        season: input.season,
        occupancy: "extra_adult",
      })
  );
}

function stayNights(checkInDate: string, checkOutDate: string): number {
  const a = new Date(`${checkInDate}T12:00:00.000Z`);
  const b = new Date(`${checkOutDate}T12:00:00.000Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

function roundUpToNearestTen(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.ceil(amount / 10) * 10;
}

function eachStayNight(checkInDate: string, checkOutDate: string): string[] {
  const nights = stayNights(checkInDate, checkOutDate);
  const start = new Date(`${checkInDate}T12:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || nights < 1) return [];
  const dates: string[] = [];
  for (let i = 0; i < nights; i += 1) {
    const d = new Date(start.getTime() + i * 86_400_000);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export type EnchoroStayRoomInput = {
  roomTypeName?: string | null;
  maxOccupancy?: number | null;
  quantity?: number;
};

export function quoteEnchoroStay(input: {
  checkInDate: string;
  checkOutDate: string;
  guestCategory: GuestCategory;
  adults?: number;
  children?: number;
  rooms: EnchoroStayRoomInput[];
}): HotelStayQuote | null {
  const nightsDates = eachStayNight(input.checkInDate, input.checkOutDate);
  if (nightsDates.length < 1 || input.rooms.length === 0) return null;

  const adults = Math.max(0, Math.round(Number(input.adults) || 0));
  const children = Math.max(0, Math.round(Number(input.children) || 0));
  const currency = guestCategoryCurrency(input.guestCategory);

  const roomRows = input.rooms.map((room) => {
    const quantity = Math.max(1, Math.round(Number(room.quantity) || 1));
    const tent = tentPricing(room.roomTypeName, room.maxOccupancy);
    return { ...tent, quantity, roomTypeName: room.roomTypeName, maxOccupancy: room.maxOccupancy };
  });

  const coveredBeds = roomRows.reduce((sum, row) => sum + row.beds * row.quantity, 0);
  const adultsInBeds = Math.min(adults, coveredBeds);
  const remainingBeds = coveredBeds - adultsInBeds;
  const extraAdults = adults - adultsInBeds;
  const extraChildren = Math.max(0, children - remainingBeds);

  let subtotal = 0;
  for (const ymd of nightsDates) {
    const season = accommodationSeasonForDate(ymd);
    for (const row of roomRows) {
      subtotal +=
        enchoroTentNightlyRate({
          guestCategory: input.guestCategory,
          season,
          roomTypeName: row.roomTypeName,
          maxOccupancy: row.maxOccupancy,
        }) * row.quantity;
    }
    const extraAdultRate = enchoroOccupancyAmount({
      guestCategory: input.guestCategory,
      season,
      occupancy: "extra_adult",
    });
    subtotal += extraAdults * extraAdultRate;
    subtotal += extraChildren * Math.round((extraAdultRate * ENCHORO_CHILD_PERCENT) / 100);
  }

  const nightlyRate = Math.round(subtotal / nightsDates.length);
  const sellingPrice = roundUpToNearestTen(subtotal);
  return {
    currency,
    nights: nightsDates.length,
    nightlyRate,
    subtotal,
    sellingPrice,
    roundedUpBy: sellingPrice - subtotal,
  };
}

export const ENCHORO_ROOM_TYPE_RATE_ROWS: Array<{
  occupancy: OccupancyKind;
  season: RateSeason;
  guestCategory: GuestCategory;
  currency: CurrencyCode;
  amount: number;
}> = (
  [
    ["non_resident", "USD", ENCHORO_ACCOMMODATION_RATES_2026.nonResident] as const,
    ["resident", "KES", ENCHORO_ACCOMMODATION_RATES_2026.resident] as const,
  ] as const
).flatMap(([guestCategory, currency, band]) =>
  (["low", "high"] as const).flatMap((season) => {
    const amounts = band[season];
    return (["single", "double", "triple", "extra_adult"] as const).map((occupancy) => ({
      occupancy,
      season,
      guestCategory,
      currency,
      amount: occupancyAmount(amounts, occupancy),
    }));
  })
);

export const ENCHORO_BASE_RATE_KES_LOW: Record<string, number> = {
  "Standard Tent - Single": ENCHORO_ACCOMMODATION_RATES_2026.resident.low.single,
  "Standard Tent - Double": ENCHORO_ACCOMMODATION_RATES_2026.resident.low.double,
  "Standard Tent - Triple": ENCHORO_ACCOMMODATION_RATES_2026.resident.low.triple,
  "Standard Tent - Family":
    ENCHORO_ACCOMMODATION_RATES_2026.resident.low.triple +
    ENCHORO_ACCOMMODATION_RATES_2026.resident.low.extraAdult,
  "Superior Tent - Single": ENCHORO_ACCOMMODATION_RATES_2026.resident.low.single,
  "Superior Tent - Double": ENCHORO_ACCOMMODATION_RATES_2026.resident.low.double,
  "Superior Tent - Triple": ENCHORO_ACCOMMODATION_RATES_2026.resident.low.triple,
  "Superior Tent - Family":
    ENCHORO_ACCOMMODATION_RATES_2026.resident.low.triple +
    ENCHORO_ACCOMMODATION_RATES_2026.resident.low.extraAdult,
};
