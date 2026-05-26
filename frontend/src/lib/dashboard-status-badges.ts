/** DaisyUI badge classes for consistent dashboard status coloring. */

export function bookingStatusBadgeClass(status: string): string {
  switch (String(status).toLowerCase()) {
    case "pending":
      return "badge-warning";
    case "confirmed":
      return "badge-info";
    case "cancelled":
      return "badge-error";
    case "completed":
      return "badge-success";
    case "refunded":
      return "badge-neutral";
    default:
      return "badge-ghost";
  }
}

export function paymentStatusBadgeClass(status: string): string {
  switch (String(status).toLowerCase()) {
    case "paid":
      return "badge-success";
    case "partial":
      return "badge-warning";
    case "unpaid":
      return "badge-error";
    default:
      return "badge-ghost";
  }
}

export function hotelReservationBadgeClass(status: string): string {
  switch (String(status).toLowerCase()) {
    case "pending":
      return "badge-warning";
    case "confirmed":
      return "badge-info";
    case "cancelled":
      return "badge-error";
    case "checked_out":
      return "badge-success";
    default:
      return "badge-ghost";
  }
}

export function hotelReservationSelectAccentClass(status: string): string {
  switch (String(status).toLowerCase()) {
    case "pending":
      return "border-l-4 border-l-warning";
    case "confirmed":
      return "border-l-4 border-l-info";
    case "cancelled":
      return "border-l-4 border-l-error";
    case "checked_out":
      return "border-l-4 border-l-success";
    default:
      return "border-l-4 border-l-base-300";
  }
}

export function paymentRecordBadgeClass(status: string): string {
  switch (String(status).toLowerCase()) {
    case "completed":
    case "confirmed":
      return "badge-success";
    case "pending":
      return "badge-warning";
    case "cancelled":
      return "badge-error";
    case "refunded":
      return "badge-neutral";
    default:
      return "badge-ghost";
  }
}

/** Bar / restaurant order payment state. */
export function orderPayBadgeClass(status: string): string {
  switch (String(status).toLowerCase()) {
    case "paid":
      return "badge-success";
    case "partially_paid":
      return "badge-warning";
    case "unpaid":
      return "badge-error";
    default:
      return "badge-ghost";
  }
}

export function orderPayLabel(status: string): string {
  switch (String(status).toLowerCase()) {
    case "paid":
      return "Paid";
    case "partially_paid":
      return "Partially paid";
    case "unpaid":
      return "Unpaid";
    default:
      return status || "—";
  }
}

/** Subtle left border on compact selects to echo status color. */
export function bookingStatusSelectAccentClass(status: string): string {
  switch (String(status).toLowerCase()) {
    case "pending":
      return "border-l-4 border-l-warning";
    case "confirmed":
      return "border-l-4 border-l-info";
    case "cancelled":
      return "border-l-4 border-l-error";
    case "completed":
      return "border-l-4 border-l-success";
    case "refunded":
      return "border-l-4 border-l-neutral";
    default:
      return "border-l-4 border-l-base-300";
  }
}

export function paymentStatusSelectAccentClass(status: string): string {
  switch (String(status).toLowerCase()) {
    case "paid":
      return "border-l-4 border-l-success";
    case "partial":
      return "border-l-4 border-l-warning";
    case "unpaid":
      return "border-l-4 border-l-error";
    default:
      return "border-l-4 border-l-base-300";
  }
}

export function orderPaySelectAccentClass(status: string): string {
  switch (String(status).toLowerCase()) {
    case "paid":
      return "border-l-4 border-l-success";
    case "partially_paid":
      return "border-l-4 border-l-warning";
    case "unpaid":
      return "border-l-4 border-l-error";
    default:
      return "border-l-4 border-l-base-300";
  }
}
