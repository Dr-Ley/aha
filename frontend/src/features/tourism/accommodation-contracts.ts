/**
 * Supplier contract rates transcribed from accommodation_data.txt.
 * These are not confirmed AHA selling prices. sellingConfirmed is false on every row.
 * The planner may cite them as supplier references. It must not publish them as a final price.
 * They are not written to room_type_rates: that table cannot store date windows or per-room cards.
 */

export type ContractOccupancy =
  | "single"
  | "double"
  | "triple"
  | "family"
  | "per_person_sharing"
  | "child_sharing"
  | "extra_adult";

export type ContractRate = {
  occupancy: ContractOccupancy;
  amount: number;
  currency: "USD" | "KES";
  basis: "per_room" | "per_person";
};

export type ContractSeason = {
  label: string;
  validFrom: string;
  validTo: string;
  mealBasis: "full_board" | "half_board" | "bed_breakfast" | "all_inclusive";
  guestCategory: "non_resident" | "resident";
  rates: ContractRate[];
};

export type AccommodationContract = {
  key: string;
  name: string;
  destinationSlug: string | null;
  location: string;
  maxOccupancy: number | null;
  childMinAge: number | null;
  childMaxAge: number | null;
  infantMaxAge: number | null;
  /** Always false until AHA staff confirms a selling rate. */
  sellingConfirmed: false;
  seasons: ContractSeason[];
};

function usd(
  occupancy: ContractOccupancy,
  amount: number,
  basis: ContractRate["basis"] = "per_room"
): ContractRate {
  return { occupancy, amount, currency: "USD", basis };
}

export const ACCOMMODATION_CONTRACTS: AccommodationContract[] = [
  {
    key: "ambokili-cottages",
    name: "Ambokili Cottages",
    destinationSlug: "amboseli",
    location: "Amboseli National Park, Loitokitok",
    maxOccupancy: 4,
    childMinAge: 2,
    childMaxAge: 11,
    infantMaxAge: 1,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2027 peak",
        validFrom: "2027-07-01",
        validTo: "2027-08-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 170), usd("double", 220), usd("triple", 290), usd("family", 400)],
      },
      {
        label: "2027 low",
        validFrom: "2027-01-02",
        validTo: "2027-06-30",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 150), usd("double", 180), usd("triple", 230), usd("family", 360)],
      },
    ],
  },
  {
    key: "amboseli-safari-club",
    name: "Amboseli Safari Club",
    destinationSlug: "amboseli",
    location: "Kimana Sanctuary, Amboseli",
    maxOccupancy: 3,
    childMinAge: 3,
    childMaxAge: 12,
    infantMaxAge: 2,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 low",
        validFrom: "2026-04-01",
        validTo: "2026-06-30",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 110), usd("double", 170), usd("extra_adult", 40), usd("child_sharing", 60, "per_person")],
      },
      {
        label: "2026 peak",
        validFrom: "2026-07-01",
        validTo: "2026-09-30",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 150), usd("double", 250), usd("extra_adult", 60), usd("child_sharing", 90, "per_person")],
      },
    ],
  },
  {
    key: "ashnil-mara",
    name: "Ashnil Mara Camp",
    destinationSlug: "maasai-mara",
    location: "Maasai Mara National Reserve",
    maxOccupancy: 3,
    childMinAge: 4,
    childMaxAge: 12,
    infantMaxAge: 3,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 peak",
        validFrom: "2026-07-01",
        validTo: "2026-09-30",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [
          usd("per_person_sharing", 576, "per_person"),
          usd("single", 864, "per_person"),
          usd("extra_adult", 461, "per_person"),
        ],
      },
      {
        label: "2026 low",
        validFrom: "2026-04-07",
        validTo: "2026-05-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [
          usd("per_person_sharing", 199, "per_person"),
          usd("single", 199, "per_person"),
          usd("extra_adult", 159, "per_person"),
        ],
      },
    ],
  },
  {
    key: "ashnil-samburu",
    name: "Ashnil Samburu Camp",
    destinationSlug: null,
    location: "Samburu National Reserve",
    maxOccupancy: 3,
    childMinAge: 4,
    childMaxAge: 12,
    infantMaxAge: 3,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 peak",
        validFrom: "2026-07-01",
        validTo: "2026-09-30",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("per_person_sharing", 209, "per_person"), usd("single", 313, "per_person")],
      },
    ],
  },
  {
    key: "marera-valley",
    name: "Marera Valley Lodge",
    destinationSlug: null,
    location: "Karatu, Tanzania",
    maxOccupancy: 3,
    childMinAge: 6,
    childMaxAge: 12,
    infantMaxAge: 5,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 high full board",
        validFrom: "2026-01-01",
        validTo: "2026-03-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 115), usd("double", 210), usd("triple", 275), usd("child_sharing", 45, "per_person")],
      },
      {
        label: "2026 low full board",
        validFrom: "2026-04-01",
        validTo: "2026-05-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 90), usd("double", 165), usd("triple", 210), usd("child_sharing", 40, "per_person")],
      },
    ],
  },
  {
    key: "comfort-gardens-sweetwaters",
    name: "Comfort Gardens Sweetwaters",
    destinationSlug: "ol-pejeta",
    location: "Ol Pejeta Conservancy",
    maxOccupancy: 6,
    childMinAge: 6,
    childMaxAge: 11,
    infantMaxAge: 5,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 peak savannah double",
        validFrom: "2026-06-15",
        validTo: "2026-09-30",
        mealBasis: "bed_breakfast",
        guestCategory: "non_resident",
        rates: [usd("single", 127), usd("double", 150), usd("triple", 230)],
      },
      {
        label: "2026 off-peak savannah double",
        validFrom: "2026-01-01",
        validTo: "2026-06-14",
        mealBasis: "bed_breakfast",
        guestCategory: "non_resident",
        rates: [usd("single", 115), usd("double", 140), usd("triple", 210)],
      },
    ],
  },
  {
    key: "diani-sea-resort",
    name: "Diani Sea Resort",
    destinationSlug: "diani",
    location: "Diani Beach",
    maxOccupancy: 4,
    childMinAge: 3,
    childMaxAge: 11,
    infantMaxAge: 3,
    sellingConfirmed: false,
    seasons: [
      {
        label: "festive peak",
        validFrom: "2026-12-21",
        validTo: "2027-01-04",
        mealBasis: "all_inclusive",
        guestCategory: "non_resident",
        rates: [usd("per_person_sharing", 201, "per_person")],
      },
      {
        label: "2026 May-Jul",
        validFrom: "2026-05-01",
        validTo: "2026-07-08",
        mealBasis: "all_inclusive",
        guestCategory: "non_resident",
        rates: [usd("per_person_sharing", 110, "per_person")],
      },
    ],
  },
  {
    key: "doubletree-nairobi",
    name: "DoubleTree by Hilton Nairobi Hurlingham",
    destinationSlug: "nairobi",
    location: "Kilimani, Nairobi",
    maxOccupancy: 3,
    childMinAge: null,
    childMaxAge: null,
    infantMaxAge: null,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 regular",
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        mealBasis: "bed_breakfast",
        guestCategory: "non_resident",
        rates: [usd("single", 140), usd("double", 160)],
      },
    ],
  },
  {
    key: "great-rift-valley-lodge",
    name: "Great Rift Valley Lodge",
    destinationSlug: "lake-naivasha",
    location: "Naivasha",
    maxOccupancy: 3,
    childMinAge: null,
    childMaxAge: null,
    infantMaxAge: null,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 high resident",
        validFrom: "2026-01-03",
        validTo: "2026-06-30",
        mealBasis: "full_board",
        guestCategory: "resident",
        rates: [
          { occupancy: "single", amount: 18300, currency: "KES", basis: "per_room" },
          { occupancy: "double", amount: 24400, currency: "KES", basis: "per_room" },
          { occupancy: "triple", amount: 34160, currency: "KES", basis: "per_room" },
          { occupancy: "child_sharing", amount: 6100, currency: "KES", basis: "per_person" },
        ],
      },
    ],
  },
  {
    key: "hilton-garden-inn-jkia",
    name: "Hilton Garden Inn Nairobi Airport",
    destinationSlug: "nairobi",
    location: "JKIA, Nairobi",
    maxOccupancy: 3,
    childMinAge: 6,
    childMaxAge: 12,
    infantMaxAge: 5,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 contract",
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        mealBasis: "bed_breakfast",
        guestCategory: "non_resident",
        rates: [usd("single", 145), usd("double", 175)],
      },
    ],
  },
  {
    key: "jambo-mara",
    name: "Jambo Mara Safari Lodge",
    destinationSlug: "maasai-mara",
    location: "Maasai Mara National Reserve",
    maxOccupancy: 3,
    childMinAge: 3,
    childMaxAge: 11,
    infantMaxAge: 2,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 low wooden",
        validFrom: "2026-01-02",
        validTo: "2026-04-30",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 90), usd("double", 130)],
      },
      {
        label: "2026 peak wooden",
        validFrom: "2026-07-01",
        validTo: "2026-08-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 200), usd("double", 260)],
      },
    ],
  },
  {
    key: "voi-safari-lodge",
    name: "Voi Safari Lodge",
    destinationSlug: "tsavo-east",
    location: "Tsavo East",
    maxOccupancy: 3,
    childMinAge: 4,
    childMaxAge: 12,
    infantMaxAge: 3,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2027 high",
        validFrom: "2027-01-03",
        validTo: "2027-03-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 150), usd("double", 200), usd("triple", 270)],
      },
      {
        label: "2027 low",
        validFrom: "2027-04-01",
        validTo: "2027-06-30",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 120), usd("double", 185), usd("triple", 240)],
      },
    ],
  },
  {
    key: "ngulia-safari-lodge",
    name: "Ngulia Safari Lodge",
    destinationSlug: "tsavo-west",
    location: "Tsavo West",
    maxOccupancy: 3,
    childMinAge: 4,
    childMaxAge: 12,
    infantMaxAge: 3,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2027 high",
        validFrom: "2027-01-03",
        validTo: "2027-03-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 130), usd("double", 190), usd("triple", 265)],
      },
    ],
  },
  {
    key: "lmr-mara",
    name: "LMR Mara",
    destinationSlug: "maasai-mara",
    location: "Maasai Mara",
    maxOccupancy: 3,
    childMinAge: 4,
    childMaxAge: 11,
    infantMaxAge: 3,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2027 low full board",
        validFrom: "2027-01-03",
        validTo: "2027-06-30",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 140), usd("double", 225), usd("triple", 300)],
      },
      {
        label: "2027 peak full board",
        validFrom: "2027-07-01",
        validTo: "2027-09-30",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 240), usd("double", 335), usd("triple", 380)],
      },
    ],
  },
  {
    key: "lake-nakuru-lodge",
    name: "Lake Nakuru Lodge",
    destinationSlug: "lake-nakuru",
    location: "Lake Nakuru National Park",
    maxOccupancy: 3,
    childMinAge: 3,
    childMaxAge: 12,
    infantMaxAge: 2,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 low",
        validFrom: "2026-04-01",
        validTo: "2026-06-30",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 124), usd("double", 201), usd("triple", 252)],
      },
      {
        label: "2026 peak",
        validFrom: "2026-07-01",
        validTo: "2026-08-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 245), usd("double", 326), usd("triple", 422)],
      },
    ],
  },
  {
    key: "ol-tukai",
    name: "Ol Tukai Lodge",
    destinationSlug: "amboseli",
    location: "Amboseli National Park",
    maxOccupancy: 3,
    childMinAge: 2,
    childMaxAge: 11,
    infantMaxAge: 1,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 high",
        validFrom: "2026-01-02",
        validTo: "2026-03-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 240, "per_person"), usd("per_person_sharing", 160, "per_person")],
      },
      {
        label: "2026 low",
        validFrom: "2026-04-01",
        validTo: "2026-05-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 154, "per_person"), usd("per_person_sharing", 154, "per_person")],
      },
    ],
  },
  {
    key: "olive-gardens",
    name: "Olive Gardens Hotel",
    destinationSlug: "nairobi",
    location: "Nairobi",
    maxOccupancy: 3,
    childMinAge: 4,
    childMaxAge: 11,
    infantMaxAge: 3,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 standard",
        validFrom: "2026-01-01",
        validTo: "2026-06-30",
        mealBasis: "bed_breakfast",
        guestCategory: "non_resident",
        rates: [usd("single", 50), usd("double", 80)],
      },
    ],
  },
  {
    key: "osero-enarau",
    name: "Osero Enarau Camp",
    destinationSlug: "maasai-mara",
    location: "Maasai Mara",
    maxOccupancy: 3,
    childMinAge: 3,
    childMaxAge: 11,
    infantMaxAge: 2,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 low",
        validFrom: "2026-04-01",
        validTo: "2026-06-30",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("per_person_sharing", 80, "per_person"), usd("single", 120, "per_person")],
      },
      {
        label: "2026 high",
        validFrom: "2026-07-15",
        validTo: "2026-09-05",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("per_person_sharing", 160, "per_person"), usd("single", 240, "per_person")],
      },
    ],
  },
  {
    key: "praro-amboseli",
    name: "Praro Amboseli Camp",
    destinationSlug: "amboseli",
    location: "Amboseli National Park",
    maxOccupancy: 3,
    childMinAge: null,
    childMaxAge: null,
    infantMaxAge: null,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 low",
        validFrom: "2026-01-03",
        validTo: "2026-06-30",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("per_person_sharing", 125, "per_person"), usd("single", 190, "per_person"), usd("child_sharing", 65, "per_person")],
      },
    ],
  },
  {
    key: "mara-simba",
    name: "Mara Simba Lodge",
    destinationSlug: "maasai-mara",
    location: "Maasai Mara",
    maxOccupancy: 3,
    childMinAge: 3,
    childMaxAge: 11,
    infantMaxAge: 2,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 low",
        validFrom: "2026-04-01",
        validTo: "2026-05-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("per_person_sharing", 75, "per_person"), usd("single", 75, "per_person")],
      },
      {
        label: "2026 peak",
        validFrom: "2026-07-01",
        validTo: "2026-10-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("per_person_sharing", 240, "per_person"), usd("single", 420, "per_person")],
      },
    ],
  },
  {
    key: "mara-sopa",
    name: "Masai Mara Sopa Lodge",
    destinationSlug: "maasai-mara",
    location: "Maasai Mara",
    maxOccupancy: 3,
    childMinAge: 4,
    childMaxAge: 12,
    infantMaxAge: 3,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 high",
        validFrom: "2026-07-01",
        validTo: "2026-10-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 263), usd("double", 405), usd("triple", 516)],
      },
      {
        label: "2026 green",
        validFrom: "2026-04-01",
        validTo: "2026-05-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [usd("single", 113), usd("double", 174), usd("triple", 222)],
      },
    ],
  },
  {
    key: "nakuru-sopa",
    name: "Lake Nakuru Sopa Lodge",
    destinationSlug: "lake-nakuru",
    location: "Lake Nakuru National Park",
    maxOccupancy: 3,
    childMinAge: 4,
    childMaxAge: 12,
    infantMaxAge: 3,
    sellingConfirmed: false,
    seasons: [],
  },
  {
    key: "naivasha-sopa",
    name: "Lake Naivasha Sopa Lodge",
    destinationSlug: "lake-naivasha",
    location: "Lake Naivasha",
    maxOccupancy: 3,
    childMinAge: 4,
    childMaxAge: 12,
    infantMaxAge: 3,
    sellingConfirmed: false,
    seasons: [],
  },
  {
    key: "amboseli-sopa",
    name: "Amboseli Sopa Lodge",
    destinationSlug: "amboseli",
    location: "Amboseli",
    maxOccupancy: 3,
    childMinAge: 4,
    childMaxAge: 12,
    infantMaxAge: 3,
    sellingConfirmed: false,
    seasons: [],
  },
  {
    key: "southern-palms",
    name: "Southern Palms Beach Resort",
    destinationSlug: "diani",
    location: "Diani Beach",
    maxOccupancy: 4,
    childMinAge: 2,
    childMaxAge: 12,
    infantMaxAge: 1,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 Dec",
        validFrom: "2026-12-01",
        validTo: "2026-12-22",
        mealBasis: "all_inclusive",
        guestCategory: "non_resident",
        rates: [usd("single", 170), usd("double", 255)],
      },
    ],
  },
  {
    key: "tamarind-tree",
    name: "Tamarind Tree Hotel",
    destinationSlug: "nairobi",
    location: "Langata, Nairobi",
    maxOccupancy: 2,
    childMinAge: null,
    childMaxAge: null,
    infantMaxAge: null,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 standard",
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        mealBasis: "bed_breakfast",
        guestCategory: "non_resident",
        rates: [usd("single", 170), usd("double", 210)],
      },
    ],
  },
  {
    key: "voi-wildlife-lodge",
    name: "Voi Wildlife Lodge",
    destinationSlug: "tsavo-east",
    location: "Tsavo East boundary, Voi",
    maxOccupancy: 3,
    childMinAge: 4,
    childMaxAge: 12,
    infantMaxAge: 3,
    sellingConfirmed: false,
    seasons: [
      {
        label: "2026 high",
        validFrom: "2025-12-16",
        validTo: "2026-03-31",
        mealBasis: "full_board",
        guestCategory: "non_resident",
        rates: [
          usd("single", 130, "per_person"),
          usd("per_person_sharing", 100, "per_person"),
          usd("child_sharing", 50, "per_person"),
        ],
      },
    ],
  },
];

const STOP_WORDS = new Set([
  "lodge",
  "camp",
  "hotel",
  "kenya",
  "national",
  "park",
  "resort",
  "the",
  "and",
  "maasai",
  "masai",
  "mara",
  "amboseli",
  "nakuru",
  "naivasha",
  "nairobi",
  "tsavo",
  "diani",
  "pejeta",
  "samburu",
]);

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

export function matchAccommodationContract(
  name: string,
  destinationSlug: string | null,
  contracts: AccommodationContract[] = ACCOMMODATION_CONTRACTS
): AccommodationContract | null {
  if (!destinationSlug) return null;
  const nameTokens = tokens(name);
  if (nameTokens.length === 0) return null;
  const hits = contracts.filter((contract) => {
    if (contract.destinationSlug !== destinationSlug) return false;
    const contractTokens = tokens(contract.name);
    if (contractTokens.length === 0) return false;
    return contractTokens.every((token) => nameTokens.includes(token)) || nameTokens.every((token) => contractTokens.includes(token));
  });
  if (hits.length !== 1) return null;
  return hits[0] ?? null;
}

export function contractSeasonCovering(
  contract: AccommodationContract,
  ymd: string | null
): ContractSeason | null {
  if (!ymd) return null;
  return contract.seasons.find((season) => season.validFrom <= ymd && ymd <= season.validTo) ?? null;
}
