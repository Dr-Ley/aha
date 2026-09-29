import type { CompanyId } from "@/types/company";

export const TABLE_SCOPE = ["global", "tenant", "pending_tenant"] as const;
export type TableScope = (typeof TABLE_SCOPE)[number];

/**
 * Sprint 2 table classification.
 * `tenant` = has `company_id`.
 * `pending_tenant` = should be scoped; column added in this slice or still missing.
 * `global` = identity / lookup, not a company row.
 */
export const TABLE_TENANCY: Record<string, TableScope> = {
  companies: "global",
  users: "global",
  company_memberships: "tenant",
  user_permissions: "tenant",
  bookings: "tenant",
  booking_components: "global",
  booking_versions: "global",
  payments: "tenant",
  invoices: "tenant",
  invoice_items: "tenant",
  expenses: "tenant",
  revenue_entries: "tenant",
  room_types: "tenant",
  rooms: "tenant",
  hotel_bookings: "tenant",
  hotel_booking_guests: "global",
  hotel_booking_payments: "tenant",
  restaurant_categories: "tenant",
  restaurant_items: "tenant",
  restaurant_orders: "tenant",
  restaurant_order_items: "tenant",
  bar_categories: "tenant",
  bar_items: "tenant",
  bar_orders: "tenant",
  bar_order_items: "tenant",
  notifications: "tenant",
  tours: "tenant",
  accommodations: "tenant",
  destinations: "global",
  attractions: "global",
  accommodation_providers: "global",
  properties: "tenant",
  vehicle_providers: "global",
  vehicles: "tenant",
  guides: "tenant",
  park_fee_rates: "tenant",
  activity_offerings: "tenant",
  transfer_options: "tenant",
  transport_options: "tenant",
  itineraries: "tenant",
  itinerary_components: "global",
  itinerary_versions: "global",
  itinerary_generation_logs: "tenant",
  customers: "tenant",
  contact_submissions: "tenant",
  likes: "tenant",
  testimonials: "tenant",
};

export function tableScope(table: string): TableScope | undefined {
  return TABLE_TENANCY[table];
}

/** Public catalog tenant. Returns null when missing/invalid — never defaults to AHA. */
export function publicCatalogCompanyId(
  raw: string | null | undefined
): CompanyId | null {
  const id = raw?.trim();
  if (id === "aha" || id === "ewc" || id === "bth") return id;
  return null;
}
