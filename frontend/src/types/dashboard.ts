import type { CompanyId } from "@/types/company";

/** SaaS booking row shape (aligned with Phase 3 prompt + existing tour booking fields). */
export interface DashboardBooking {
  id: string;
  companyId: CompanyId;
  customerName: string;
  email: string;
  phone: string;
  safariPackage: string;
  country: "Kenya" | "Tanzania";
  startDate: string;
  endDate: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "paid" | "partial" | "unpaid";
  totalAmount: number;
}

export interface DashboardPayment {
  id: string;
  companyId: CompanyId;
  bookingId: string | null;
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
  category: string;
  amount: number;
  description: string | null;
  incurredAt: string | null;
}

export interface DashboardRevenueEntry {
  id: string;
  companyId: CompanyId;
  bookingId: string | null;
  amount: number;
  packageLabel: string | null;
  periodMonth: string | null;
  recognizedAt: string | null;
}
