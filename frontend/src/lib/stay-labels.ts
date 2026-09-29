/** Display labels for hotel stays and safari bookings — rooms/package + guest, never numeric IDs. */

export type StayLabelInput = {
  primaryGuestName?: string | null;
  customerName?: string | null;
  room?: { code?: string | null; name?: string | null; roomTypeName?: string | null } | null;
  rooms?: { code?: string | null; name?: string | null; roomTypeName?: string | null; quantity?: number | null }[] | null;
};

export type SafariLabelInput = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  safariPackage?: string | null;
  tour?: { title?: string | null; shortTitle?: string | null } | null;
};

function addUnique(names: string[], value?: string | null) {
  const next = value?.trim();
  if (next && !names.includes(next)) names.push(next);
}

export function uniqueStayRoomNames(stay: StayLabelInput): string[] {
  const names: string[] = [];
  if (stay.rooms && stay.rooms.length > 0) {
    for (const room of stay.rooms) {
      addUnique(names, room.roomTypeName || room.name || room.code);
    }
  } else {
    addUnique(names, stay.room?.roomTypeName || stay.room?.name || stay.room?.code);
  }
  return names;
}

export function stayRoomsLabel(stay: StayLabelInput): string {
  if (stay.rooms && stay.rooms.length > 0) {
    const labels: string[] = [];
    for (const room of stay.rooms) {
      const name = room.roomTypeName || room.name || room.code;
      if (!name?.trim()) continue;
      const qty = Math.max(1, Math.round(Number(room.quantity) || 1));
      const label = qty > 1 ? `${name} × ${qty}` : name;
      if (!labels.includes(label)) labels.push(label);
    }
    if (labels.length > 0) return labels.join(", ");
  }
  const names = uniqueStayRoomNames(stay);
  return names.length > 0 ? names.join(", ") : "Room";
}

export function stayRoomCount(stay: StayLabelInput): number {
  if (stay.rooms && stay.rooms.length > 0) {
    return stay.rooms.reduce((sum, room) => sum + Math.max(1, Math.round(Number(room.quantity) || 1)), 0);
  }
  return stay.room ? 1 : 0;
}

export function stayGuestName(stay: StayLabelInput): string {
  return stay.primaryGuestName?.trim() || stay.customerName?.trim() || "";
}

export function staySourceLabel(stay: StayLabelInput): string {
  const rooms = stayRoomsLabel(stay);
  const guest = stayGuestName(stay);
  return guest ? `${rooms} — ${guest}` : rooms;
}

export function safariGuestName(booking: SafariLabelInput): string {
  return (
    [booking.firstName, booking.lastName].filter(Boolean).join(" ").trim() ||
    booking.email?.trim() ||
    ""
  );
}

export function safariPackageLabel(booking: SafariLabelInput): string {
  return (
    booking.safariPackage?.trim() ||
    booking.tour?.shortTitle?.trim() ||
    booking.tour?.title?.trim() ||
    "Safari"
  );
}

export function safariSourceLabel(booking: SafariLabelInput): string {
  const pkg = safariPackageLabel(booking);
  const guest = safariGuestName(booking);
  return guest ? `${pkg} — ${guest}` : pkg;
}
