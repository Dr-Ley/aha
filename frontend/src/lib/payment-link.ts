/** Align legacy bookingId with polymorphic referenceType/referenceId (pure). */

export type PaymentLinkInput = {
  bookingId?: number | null;
  referenceType?: string | null;
  referenceId?: number | null;
};

export function normalizePaymentLink(input: PaymentLinkInput): {
  bookingId: number | null;
  referenceType: string | null;
  referenceId: number | null;
} {
  let bookingId = input.bookingId ?? null;
  let referenceType = input.referenceType ?? null;
  let referenceId = input.referenceId ?? null;

  if (bookingId != null && (referenceType == null || referenceType === "")) {
    referenceType = "tour";
    referenceId = bookingId;
  }

  if (referenceType === "tour" && referenceId != null && bookingId == null) {
    bookingId = referenceId;
  }

  if (referenceType === "tour" && bookingId != null && referenceId == null) {
    referenceId = bookingId;
  }

  return { bookingId, referenceType, referenceId };
}
