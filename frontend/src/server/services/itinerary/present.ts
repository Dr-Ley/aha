import type { ItineraryRow } from "@/server/services/itinerary/itinerary-service";
import { asPlan, itineraryViewUrl } from "@/server/services/itinerary/itinerary-service";
import type { TourismCatalog } from "@/server/services/itinerary/types";

export function toItineraryPublicDto(
  row: ItineraryRow,
  options?: { staff?: boolean; catalog?: TourismCatalog | null }
) {
  const plan = asPlan(row.plan);
  return {
    id: options?.staff ? row.id : undefined,
    publicToken: row.publicToken,
    companyId: row.companyId,
    status: row.status,
    title: row.title,
    summary: row.summary,
    country: row.country,
    startDate: row.startDate,
    endDate: row.endDate,
    durationDays: row.durationDays,
    adults: row.adults,
    children: row.children,
    infants: row.infants,
    childAges: row.childAges,
    currency: row.currency,
    sellingPrice: row.sellingPrice,
    costTotal: options?.staff ? row.costTotal : undefined,
    markupPercent: options?.staff ? row.markupPercent : undefined,
    currentVersion: row.currentVersion,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    bookingId: row.bookingId,
    viewUrl: itineraryViewUrl(row.publicToken),
    plan,
    quote: row.quote,
    editOptions: options?.catalog
      ? {
          destinations: options.catalog.destinations.map((d) => ({
            id: d.id,
            name: d.name,
            country: d.country,
          })),
          accommodations: options.catalog.accommodations.map((a) => ({
            id: a.id,
            name: a.name,
            destinationId: a.destinationId,
            category: a.category,
          })),
          activities: options.catalog.activities.map((a) => ({
            id: a.id,
            name: a.name,
            destinationId: a.destinationId,
          })),
          transport: options.catalog.transport.map((t) => ({
            id: t.id,
            name: t.name,
            capacity: t.capacity,
          })),
          transfers: options.catalog.transfers.map((t) => ({
            id: t.id,
            name: t.name,
          })),
        }
      : undefined,
  };
}
