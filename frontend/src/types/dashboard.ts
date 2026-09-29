import type { CompanyId } from "@/types/company";

/** Safari booking row shape aligned with refactored `bookings` table + API response. */
export interface DashboardBooking {
  id: string;
  companyId: CompanyId;
  /** Guest full name (firstName + lastName). */
  customerName: string;
  email: string;
  phone: string;
  /** Safari package label (bookings.safari_package or nested tour title). */
  safariPackage: string;
  /** Destination country (bookings.trip_country — not guest nationality). */
  tripCountry: "Kenya" | "Tanzania";
  /** Guest nationality (bookings.country). */
  guestCountry: string | null;
  startDate: string;
  endDate: string;
  travelDate: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "refunded";
  paymentStatus: "paid" | "partial" | "unpaid";
  /** Accounting total in KES (bookings.total_price). */
  totalPrice: number;
  /** Customer-facing amount at booking time (bookings.original_amount). */
  originalAmount: number | null;
  originalCurrency: string;
  exchangeRateToKes: number;
}

export interface DashboardPayment {
  id: string;
  companyId: CompanyId;
  bookingId: string | null;
  referenceType: "tour" | "hotel" | "restaurant" | "bar" | "payment" | null;
  referenceId: number | null;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  recordedAt: string | null;
}

export interface DashboardExpense {
  id: string;
  companyId: CompanyId;
  bookingId: string | null;
  referenceType: "tour" | "hotel" | "restaurant" | "bar" | "payment" | null;
  referenceId: number | null;
  category: string;
  amount: number;
  description: string | null;
  incurredAt: string | null;
}

export interface DashboardRevenueEntry {
  id: string;
  companyId: CompanyId;
  bookingId: string | null;
  referenceType: "tour" | "hotel" | "restaurant" | "bar" | "payment" | null;
  referenceId: number | null;
  amount: number;
  packageLabel: string | null;
  periodMonth: string | null;
  recognizedAt: string | null;
}
