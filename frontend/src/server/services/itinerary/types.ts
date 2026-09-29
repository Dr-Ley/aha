import type { CurrencyCode } from "@/lib/data";
import type { BookingComponentType } from "@/lib/pricing";
import type { TravellerCounts } from "@/lib/travellers";

export const ITINERARY_STATUSES = [
  "draft",
  "generated",
  "modified",
  "accepted",
  "approved",
  "converted",
  "expired",
  "cancelled",
] as const;

export type ItineraryStatus = (typeof ITINERARY_STATUSES)[number];

export const ACCOMMODATION_CATEGORIES = ["budget", "mid-range", "luxury"] as const;
export type AccommodationCategory = (typeof ACCOMMODATION_CATEGORIES)[number];

export const INTEREST_TAGS = [
  "wildlife",
  "photography",
  "adventure",
  "relaxation",
  "culture",
  "family",
] as const;
export type InterestTag = (typeof INTEREST_TAGS)[number];

export type ItineraryRequirements = {
  companyId: string;
  country?: string | null;
  destinationIds: number[];
  attractionIds: number[];
  activityIds: number[];
  startDate?: string | null;
  endDate?: string | null;
  durationDays: number;
  adults: number;
  children: number;
  infants: number;
  childAges: number[];
  accommodationCategory?: AccommodationCategory | null;
  accommodationPreferences?: string | null;
  budgetAmount?: number | null;
  budgetCurrency?: CurrencyCode | null;
  interests: InterestTag[];
  wildlifeInterests?: string | null;
  preferredTransport?: string | null;
  airportTransfer: boolean;
  notes?: string | null;
  guestEmail?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  currency: CurrencyCode;
};

export type ItineraryDayPlan = {
  day: number;
  destinationId: number;
  activityIds: number[];
  accommodationId: number | null;
  transportId: number | null;
  transferId: number | null;
  notes?: string | null;
};

export type ItineraryPlan = {
  title: string;
  summary: string;
  durationDays: number;
  destinationIds: number[];
  days: ItineraryDayPlan[];
  notes: string[];
  assumptions: string[];
  recommendations: string[];
};

export type CatalogDestination = {
  id: number;
  name: string;
  slug: string;
  country: string;
  region: string | null;
  description: string | null;
};

export type CatalogAttraction = {
  id: number;
  destinationId: number;
  name: string;
  type: string;
  duration: string | null;
};

export type CatalogAccommodation = {
  id: number;
  destinationId: number | null;
  name: string;
  slug: string;
  type: string;
  category: AccommodationCategory;
  priceFromUsd: number;
  location: string;
};

export type CatalogParkFee = {
  id: number;
  destinationId: number;
  name: string;
  adultUsd: number;
  childUsd: number;
  infantUsd: number;
  adultUsdLow?: number | null;
  childUsdLow?: number | null;
  adultKes?: number | null;
  childKes?: number | null;
};

export type CatalogActivity = {
  id: number;
  destinationId: number;
  attractionId: number | null;
  name: string;
  adultUsd: number;
  childUsd: number;
};

export type CatalogTransfer = {
  id: number;
  name: string;
  fromLabel: string;
  toLabel: string;
  destinationId: number | null;
  amountUsd: number;
};

export type CatalogTransport = {
  id: number;
  name: string;
  vehicleType: string;
  dailyRateUsd: number;
  capacity: number;
};

/** Slice of Enzi tourism data sent to the AI — never a full database dump. */
export type TourismCatalog = {
  destinations: CatalogDestination[];
  attractions: CatalogAttraction[];
  accommodations: CatalogAccommodation[];
  parkFees: CatalogParkFee[];
  activities: CatalogActivity[];
  transfers: CatalogTransfer[];
  transport: CatalogTransport[];
};

export type ItineraryComponentDraft = {
  type: BookingComponentType;
  cost: number;
  sequence: number;
  label: string;
  config: Record<string, unknown>;
};

export type ItineraryQuoteSnapshot = {
  currency: CurrencyCode;
  costTotal: number;
  markupPercent: number;
  markupAmount: number;
  baseSellingPrice: number;
  sellingPrice: number;
  roundedUpBy: number;
  travellerCounts: TravellerCounts;
  components: ItineraryComponentDraft[];
};

export type ValidationIssue = {
  code: string;
  message: string;
  path?: string;
};

export type ItineraryValidationResult =
  | { ok: true; plan: ItineraryPlan }
  | { ok: false; issues: ValidationIssue[] };
