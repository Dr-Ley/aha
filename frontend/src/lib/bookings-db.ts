import type { Tour } from "@/lib/data";
import { bookings, tours } from "@/lib/schema";
import { mapDbTourToTour } from "@/lib/tours-db";
import type { BookingComponentRow } from "@/lib/booking-components";

type DbBooking = typeof bookings.$inferSelect;
type DbTour = typeof tours.$inferSelect;

/** API/dashboard booking row with nested tour mapped to the public Tour shape. */
export type BookingWithTour = DbBooking & {
  tour: Tour | null;
  components?: BookingComponentRow[];
};

export function mapDbBookingWithTour(
  booking: DbBooking,
  tour: DbTour | null,
  components?: BookingComponentRow[]
): BookingWithTour {
  return {
    ...booking,
    tour: tour ? mapDbTourToTour(tour) : null,
    ...(components ? { components } : {}),
  };
}
