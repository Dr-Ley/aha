import { db } from "@/lib/db";
import { customers, rooms } from "@/lib/schema";
import { COMPANIES, type CompanyId } from "@/types/company";
import { and, eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email/email-service";
import { buildHotelStayConfirmationEmail } from "@/lib/email/hotel-stay-confirmation-template";
import { formatPaymentAmountLabel } from "@/lib/email/payment-acknowledgement-template";
import { normalizeTravellerCounts, travellerCountsLabel } from "@/lib/travellers";

export type HotelStayConfirmationLike = {
  id: number;
  companyId: string;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalAmount: number;
  primaryGuestName?: string | null;
  primaryGuestEmail?: string | null;
  customerId?: number | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  currency?: string | null;
  /** Optional pre-resolved room label (e.g. "R12 — Twin"). */
  roomLabel?: string | null;
};

function companyDisplayName(companyId: string): string {
  return COMPANIES.find((c) => c.id === companyId)?.name ?? "African Home Adventure";
}

async function resolveStayEmail(
  stay: HotelStayConfirmationLike
): Promise<{ email: string; guestName: string | null } | null> {
  let email = stay.primaryGuestEmail?.trim() || null;
  let guestName = stay.primaryGuestName?.trim() || null;

  if (!email && stay.customerId != null) {
    const [cust] = await db
      .select({
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
      })
      .from(customers)
      .where(and(eq(customers.id, stay.customerId), eq(customers.companyId, stay.companyId)))
      .limit(1);
    if (cust?.email?.trim()) {
      email = cust.email.trim();
      if (!guestName) {
        guestName = [cust.firstName, cust.lastName].filter(Boolean).join(" ").trim() || null;
      }
    }
  }

  if (!email) return null;
  return { email, guestName };
}

async function resolveRoomLabel(stay: HotelStayConfirmationLike): Promise<string> {
  if (stay.roomLabel?.trim()) return stay.roomLabel.trim();
  const [room] = await db
    .select({ code: rooms.code, name: rooms.name })
    .from(rooms)
    .where(and(eq(rooms.id, stay.roomId), eq(rooms.companyId, stay.companyId)))
    .limit(1);
  if (!room) return `Room #${stay.roomId}`;
  return `${room.code}${room.name ? ` — ${room.name}` : ""}`;
}

/**
 * Sends hotel stay confirmation to the guest.
 * Never throws — failures are logged so stay create stays reliable.
 */
export async function maybeSendHotelStayConfirmation(
  stay: HotelStayConfirmationLike
): Promise<void> {
  try {
    const recipient = await resolveStayEmail(stay);
    if (!recipient) {
      console.info(
        `[email] hotel stay confirmation skipped (no email) stay=#${stay.id} company=${stay.companyId}`
      );
      return;
    }

    const content = buildHotelStayConfirmationEmail({
      companyName: companyDisplayName(stay.companyId as CompanyId),
      guestName: recipient.guestName,
      stayId: stay.id,
      roomLabel: await resolveRoomLabel(stay),
      checkInDate: String(stay.checkInDate).slice(0, 10),
      checkOutDate: String(stay.checkOutDate).slice(0, 10),
      nights: stay.nights,
      travellersLabel: travellerCountsLabel(
        normalizeTravellerCounts({
          adults: stay.adults,
          children: stay.children,
          infants: stay.infants,
        })
      ),
      amountLabel: formatPaymentAmountLabel(stay.currency ?? "KES", stay.totalAmount),
    });

    const result = await sendEmail({
      to: recipient.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      companyId: stay.companyId,
      template: "hotel_stay_confirmation",
    });
    if (!result.ok) {
      console.error(`[email] hotel stay confirmation failed stay=#${stay.id}:`, result.error);
    }
  } catch (e) {
    console.error(`[email] hotel stay confirmation error stay=#${stay.id}:`, e);
  }
}
