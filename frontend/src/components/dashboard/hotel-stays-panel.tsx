"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle, Bed, Calendar, AlertTriangle, Printer, ChevronDown } from "lucide-react";
import { InvoicePrintButton } from "@/components/documents/invoice-print-button";
import { useCompany } from "@/store/company-context";
import { companyUsesHotelStays } from "@/types/company";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { EntityViewModal } from "@/components/dashboard/entity-view-modal";
import {
  DashboardPagination,
  DashboardTableExport,
  type ExportColumn,
  useDashboardPagination,
} from "@/components/dashboard/dashboard-table-tools";
import type { CurrencyCode } from "@/lib/data";
import { formatAmountForDisplay } from "@/lib/data";
import { nairobiYmd } from "@/lib/nairobi-date";
import { isGuestEmail, parseOccupantGuests, type OccupantGuest } from "@/lib/travellers";
import { calcStayNights, quoteAllocatedStay } from "@/lib/pricing";
import {
  accommodationSeasonForDate,
  enchoroTentNightlyRate,
  GUEST_CATEGORIES,
  guestCategoryCurrency,
  type GuestCategory,
} from "@/lib/enchoro-rates-2026";
import {
  hotelReservationBadgeClass,
  hotelReservationSelectAccentClass,
  paymentStatusBadgeClass,
  paymentStatusSelectAccentClass,
} from "@/lib/dashboard-status-badges";
import { cn } from "@/lib/utils";
import { stayGuestName, stayRoomCount, stayRoomsLabel, staySourceLabel, uniqueStayRoomNames } from "@/lib/stay-labels";

type RoomRow = {
  id: number;
  code: string;
  name: string | null;
  roomTypeId: number;
  isActive?: boolean;
  roomType?: { name: string; baseRate?: number | null; maxOccupancy?: number | null } | null;
};

type AllocatedRoom = {
  id: number;
  code: string;
  name: string | null;
  quantity?: number;
  roomTypeName: string | null;
};

type HotelBookingRow = {
  id: number;
  roomId: number;
  rooms?: AllocatedRoom[];
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: string;
  status: string;
  pricingSource?: string | null;
  externalCompany: string | null;
  mealType: string | null;
  customerId: number | null;
  customerName?: string | null;
  primaryGuestName: string | null;
  primaryGuestPhone: string | null;
  primaryGuestEmail: string | null;
  additionalOccupants: OccupantGuest[] | unknown;
  adults: number;
  children: number;
  infants: number;
  guestCategory?: string | null;
  currency?: string | null;
  room: { id: number; code: string; name: string | null; roomTypeName: string | null } | null;
};

type RoomLine = {
  typeKey: string;
  quantity: number;
};

const RES_STATUS = ["pending", "confirmed", "cancelled", "checked_out"] as const;
const PAY_STATUS = ["unpaid", "partial", "paid"] as const;
const MEAL_TYPES = ["full_board", "half_board", "bed_only"] as const;
const ROOM_QTY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const MAX_ROOM_LINES = 12;
const emptyRoomLine = (): RoomLine => ({ typeKey: "", quantity: 1 });

const exportColumns: ExportColumn<HotelBookingRow>[] = [
  { key: "room", header: "Room", value: (b) => stayRoomsLabel(b) },
  { key: "roomCount", header: "Number of rooms", value: (b) => stayRoomCount(b) },
  { key: "guest", header: "Guest", value: (b) => stayGuestName(b) || stayPartyCountsLabel(b) },
  { key: "checkIn", header: "Check in", value: (b) => b.checkInDate },
  { key: "checkOut", header: "Check out", value: (b) => b.checkOutDate },
  { key: "nights", header: "Nights", value: (b) => b.nights },
  { key: "total", header: "Total", value: (b) => b.totalAmount },
  { key: "paid", header: "Paid", value: (b) => b.amountPaid },
  { key: "paymentStatus", header: "Payment status", value: (b) => b.paymentStatus },
  { key: "status", header: "Reservation status", value: (b) => b.status },
  { key: "mealType", header: "Meal type", value: (b) => b.mealType },
];

function stayRoomLabel(b: HotelBookingRow): string {
  return stayRoomsLabel(b);
}

function stayPartyCountsLabel(b: HotelBookingRow): string {
  const adults = b.adults ?? 0;
  const children = b.children ?? 0;
  const parts: string[] = [];
  if (adults) parts.push(`${adults} adult${adults === 1 ? "" : "s"}`);
  if (children) parts.push(`${children} child${children === 1 ? "" : "ren"}`);
  return parts.join(", ") || "—";
}

function checkInYmd(b: HotelBookingRow): string {
  return String(b.checkInDate).slice(0, 10);
}

export function HotelStaysPanel() {
  const { selectedCompanyId } = useCompany();
  const isHotel = companyUsesHotelStays(selectedCompanyId);
  const isEwc = selectedCompanyId === "ewc";
  const isBth = selectedCompanyId === "bth";
  const showMealType = isEwc || isBth;

  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [rows, setRows] = useState<HotelBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [arrivalUnread, setArrivalUnread] = useState(0);
  const [viewId, setViewId] = useState<number | null>(null);
  const [roomF, setRoomF] = useState("");
  const [payHF, setPayHF] = useState("");
  const [resF, setResF] = useState("");
  const [checkInFromF, setCheckInFromF] = useState("");
  const [checkInToF, setCheckInToF] = useState("");
  const [checkInSort, setCheckInSort] = useState<"asc" | "desc">("desc");
  const [form, setForm] = useState({
    roomLines: [emptyRoomLine()] as RoomLine[],
    checkInDate: "",
    checkOutDate: "",
    totalAmount: "",
    amountPaid: "0",
    stayPriceCurrency: "KES" as CurrencyCode,
    pricingSource: "rate" as "rate" | "manual",
    guestCategory: "resident" as GuestCategory,
    paymentMethod: "",
    paymentStatus: "unpaid" as (typeof PAY_STATUS)[number],
    status: "pending" as (typeof RES_STATUS)[number],
    externalCompany: "",
    mealType: "" as "" | (typeof MEAL_TYPES)[number],
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    occupants: [] as OccupantGuest[],
    adults: "1",
    children: "0",
    infants: "0",
    notes: "",
  });

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    if (!isHotel) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ companyId: selectedCompanyId });
      const [rRes, hRes] = await Promise.all([
        fetch(`/api/rooms?${qs}&activeOnly=0`),
        fetch(`/api/hotel-bookings?${qs}`),
      ]);
      const rJson = await rRes.json();
      const hJson = await hRes.json();
      if (!rRes.ok) throw new Error(rJson.error ?? "Rooms failed");
      if (!hRes.ok) throw new Error(hJson.error ?? "Bookings failed");
      setRooms((rJson.rooms ?? []) as RoomRow[]);
      setRows((hJson.hotelBookings ?? []) as HotelBookingRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [isHotel, selectedCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const rowSource = useMemo(() => [...rows], [rows]);

  const roomOptions = useMemo(() => {
    const names = new Set<string>();
    for (const room of rooms) {
      if (room.isActive === false) continue;
      const name = room.roomType?.name || room.code;
      if (name) names.add(name);
    }
    return [...names].sort((a, b) => a.localeCompare(b)).map((name) => ({ id: name, label: name }));
  }, [rooms]);

  function roomTypeKey(room: RoomRow): string {
    return String(room.roomTypeId || room.roomType?.name || room.code);
  }

  const uniqueRoomTypes = useMemo(() => {
    const selectedKeys = new Set(form.roomLines.map((line) => line.typeKey).filter(Boolean));
    const byType = new Map<string, RoomRow>();
    for (const room of rooms) {
      const key = roomTypeKey(room);
      const selected = selectedKeys.has(key);
      if (room.isActive === false && !selected) continue;
      const existing = byType.get(key);
      if (!existing || selected) byType.set(key, room);
    }
    return [...byType.values()].sort((a, b) => {
      const left = a.roomType?.name || a.code;
      const right = b.roomType?.name || b.code;
      return left.localeCompare(right);
    });
  }, [rooms, form.roomLines]);

  function roomForTypeKey(typeKey: string): RoomRow | undefined {
    if (!typeKey) return undefined;
    return uniqueRoomTypes.find((room) => roomTypeKey(room) === typeKey);
  }

  const selectedAllocations = useMemo(() => {
    const merged = new Map<number, { room: RoomRow; quantity: number }>();
    for (const line of form.roomLines) {
      const room = roomForTypeKey(line.typeKey);
      if (!room) continue;
      const qty = Math.max(1, Math.min(ROOM_QTY_OPTIONS[ROOM_QTY_OPTIONS.length - 1], line.quantity || 1));
      const existing = merged.get(room.id);
      merged.set(room.id, { room, quantity: (existing?.quantity ?? 0) + qty });
    }
    return [...merged.values()];
  }, [form.roomLines, uniqueRoomTypes]);

  const stayNights = useMemo(
    () =>
      form.checkInDate && form.checkOutDate
        ? calcStayNights(form.checkInDate, form.checkOutDate)
        : 0,
    [form.checkInDate, form.checkOutDate]
  );

  const rateQuote = useMemo(() => {
    if (selectedAllocations.length === 0 || stayNights < 1) return null;
    return quoteAllocatedStay({
      companyId: selectedCompanyId,
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
      guestCategory: form.guestCategory,
      adults: parseInt(form.adults, 10) || 0,
      children: parseInt(form.children, 10) || 0,
      rooms: selectedAllocations.map(({ room, quantity }) => ({
        nightlyRate: room.roomType?.baseRate,
        roomTypeName: room.roomType?.name || room.code,
        maxOccupancy: room.roomType?.maxOccupancy,
        quantity,
      })),
    });
  }, [
    selectedAllocations,
    stayNights,
    selectedCompanyId,
    form.checkInDate,
    form.checkOutDate,
    form.guestCategory,
    form.adults,
    form.children,
  ]);

  const stayCurrency: CurrencyCode =
    isEwc && form.guestCategory === "non_resident" ? "USD" : "KES";

  useEffect(() => {
    if (form.pricingSource !== "rate" || !rateQuote) return;
    setForm((prev) => {
      const next = String(rateQuote.sellingPrice);
      if (prev.totalAmount === next && prev.pricingSource === "rate") return prev;
      return { ...prev, totalAmount: next, pricingSource: "rate" };
    });
  }, [form.pricingSource, rateQuote]);

  const displayRows = useMemo(() => {
    const f = rowSource.filter((b) => {
      if (roomF && !uniqueStayRoomNames(b).includes(roomF)) return false;
      if (payHF && b.paymentStatus !== payHF) return false;
      if (resF && b.status !== resF) return false;
      const ci = checkInYmd(b);
      if (checkInFromF && ci < checkInFromF) return false;
      if (checkInToF && ci > checkInToF) return false;
      return true;
    });
    f.sort((a, b) => {
      const c = checkInYmd(a).localeCompare(checkInYmd(b));
      return checkInSort === "asc" ? c : -c;
    });
    return f;
  }, [rowSource, roomF, payHF, resF, checkInFromF, checkInToF, checkInSort]);
  const { page, pageCount, setPage, pagedRows } = useDashboardPagination(displayRows, 10);

  const todayHotel = useMemo(() => {
    const today = nairobiYmd();
    const active = rows.filter((b) => b.status !== "cancelled");
    const todayList = active.filter((b) => checkInYmd(b) === today);
    const upcoming = active
      .filter((b) => checkInYmd(b) > today)
      .sort((a, b) => checkInYmd(a).localeCompare(checkInYmd(b)))
      .slice(0, 12);
    return { today: todayList, upcoming, todayLabel: today };
  }, [rows]);

  useEffect(() => {
    if (!isHotel) return;
    const qs = new URLSearchParams({ companyId: selectedCompanyId });
    void fetch(`/api/notifications?${qs}`)
      .then((r) => r.json())
      .then((j: { success?: boolean; notifications?: { isRead?: boolean; metadata?: { kind?: string } }[] }) => {
        if (!j.success) return;
        const n = (j.notifications ?? []).filter((x) => !x.isRead && x.metadata?.kind === "arrival_day").length;
        setArrivalUnread(n);
      })
      .catch(() => {});
  }, [isHotel, selectedCompanyId, rows.length, loading]);

  useEffect(() => {
    if (!isHotel) return;
    const raw = window.location.hash.replace(/^#/, "");
    if (raw.startsWith("hotel-stay-")) {
      requestAnimationFrame(() => {
        document.getElementById(raw)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [isHotel, displayRows, loading]);

  function openCreate() {
    setEditId(null);
    setForm({
      roomLines: [emptyRoomLine()],
      checkInDate: "",
      checkOutDate: "",
      totalAmount: "",
      amountPaid: "0",
      stayPriceCurrency: isEwc ? guestCategoryCurrency("resident") : "KES",
      pricingSource: "rate",
      guestCategory: "resident",
      paymentMethod: "",
      paymentStatus: "unpaid",
      status: "pending",
      externalCompany: "",
      mealType: isEwc ? "full_board" : "",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      occupants: [],
      adults: "1",
      children: "0",
      infants: "0",
      notes: "",
    });
    setModal("create");
  }

  function typeKeyFromAllocated(room: AllocatedRoom): string {
    const full = rooms.find((row) => row.id === room.id);
    if (full) return roomTypeKey(full);
    return room.roomTypeName || String(room.id);
  }

  function closeDropdown(el: HTMLElement) {
    const details = el.closest("details");
    if (details) details.open = false;
  }

  function updateRoomLine(index: number, patch: Partial<RoomLine>) {
    setForm((f) => ({
      ...f,
      roomLines: f.roomLines.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }));
  }

  function addRoomLine() {
    setForm((f) =>
      f.roomLines.length >= MAX_ROOM_LINES ? f : { ...f, roomLines: [...f.roomLines, emptyRoomLine()] }
    );
  }

  function removeRoomLine(index: number) {
    setForm((f) => ({
      ...f,
      roomLines: f.roomLines.length <= 1 ? [emptyRoomLine()] : f.roomLines.filter((_, i) => i !== index),
    }));
  }

  function roomLineRateLabel(room: RoomRow): string | null {
    if (isEwc) {
      const season = form.checkInDate ? accommodationSeasonForDate(form.checkInDate) : "low";
      const amount = enchoroTentNightlyRate({
        guestCategory: form.guestCategory,
        season,
        roomTypeName: room.roomType?.name || room.code,
        maxOccupancy: room.roomType?.maxOccupancy,
      });
      return `${formatAmountForDisplay(amount, stayCurrency)} / night`;
    }
    if (room.roomType?.baseRate != null) {
      return `${formatAmountForDisplay(room.roomType.baseRate, "KES")} / night`;
    }
    return null;
  }

  function allocationsPayload() {
    return selectedAllocations.map(({ room, quantity }) => ({
      roomId: room.id,
      quantity: Math.max(1, Math.min(20, quantity)),
    }));
  }

  function openEdit(b: HotelBookingRow) {
    setEditId(b.id);
    const source =
      b.rooms && b.rooms.length > 0
        ? b.rooms
        : [
            {
              id: b.roomId,
              code: b.room?.code ?? "",
              name: b.room?.name ?? null,
              quantity: 1,
              roomTypeName: b.room?.roomTypeName ?? null,
            },
          ];
    setForm({
      roomLines: source.map((room) => ({
        typeKey: typeKeyFromAllocated(room),
        quantity: Math.max(1, room.quantity ?? 1),
      })),
      checkInDate: String(b.checkInDate).slice(0, 10),
      checkOutDate: String(b.checkOutDate).slice(0, 10),
      totalAmount: String(b.totalAmount),
      amountPaid: String(b.amountPaid),
      stayPriceCurrency:
        isEwc && b.guestCategory === "non_resident" ? "USD" : "KES",
      pricingSource: b.pricingSource === "rate" ? "rate" : "manual",
      guestCategory: b.guestCategory === "non_resident" ? "non_resident" : "resident",
      paymentMethod: "",
      paymentStatus: b.paymentStatus as (typeof PAY_STATUS)[number],
      status: b.status as (typeof RES_STATUS)[number],
      externalCompany: b.externalCompany ?? "",
      mealType: (b.mealType as (typeof MEAL_TYPES)[number] | null) ?? "",
      guestName: b.primaryGuestName ?? "",
      guestEmail: b.primaryGuestEmail ?? "",
      guestPhone: b.primaryGuestPhone ?? "",
      occupants: parseOccupantGuests(b.additionalOccupants),
      adults: String(b.adults ?? 1),
      children: String(b.children ?? 0),
      infants: String(b.infants ?? 0),
      notes: "",
    });
    setModal("edit");
  }

  function additionalGuestsPayload(): OccupantGuest[] | null {
    const guests = form.occupants
      .map((guest) => ({ name: guest.name.trim(), email: guest.email.trim() }))
      .filter((guest) => guest.name || guest.email);
    if (guests.some((guest) => !guest.name || !guest.email)) {
      showToast("Each additional guest needs a name and email", "error");
      return null;
    }
    if (guests.some((guest) => !isGuestEmail(guest.email))) {
      showToast("Enter a valid email for each additional guest", "error");
      return null;
    }
    return guests;
  }

  function partyPayload(occupants: OccupantGuest[]) {
    return {
      primaryGuestName: form.guestName.trim() || null,
      primaryGuestEmail: form.guestEmail.trim() || null,
      primaryGuestPhone: form.guestPhone.trim() || null,
      additionalOccupants: occupants,
      adults: parseInt(form.adults, 10) || 0,
      children: parseInt(form.children, 10) || 0,
      infants: parseInt(form.infants, 10) || 0,
    };
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const roomsPayload = allocationsPayload();
    if (roomsPayload.length === 0) {
      showToast("Select at least one room type", "error");
      return;
    }
    const occupants = additionalGuestsPayload();
    if (!occupants) return;
    setSaving(true);
    try {
      const res = await fetch("/api/hotel-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          rooms: roomsPayload,
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
          totalAmount: parseInt(form.totalAmount, 10),
          pricingSource: form.pricingSource,
          guestCategory: form.guestCategory,
          currency: stayCurrency,
          amountPaid: parseInt(form.amountPaid, 10) || 0,
          paymentMethod: form.paymentMethod || null,
          paymentStatus: form.paymentStatus,
          status: form.status,
          externalCompany: isEwc && form.externalCompany ? form.externalCompany : null,
          mealType: showMealType && form.mealType ? form.mealType : null,
          notes: form.notes || null,
          ...partyPayload(occupants),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
      setModal(null);
      await load();
      showToast("Hotel stay created", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId == null) return;
    const roomsPayload = allocationsPayload();
    if (roomsPayload.length === 0) {
      showToast("Select at least one room type", "error");
      return;
    }
    const occupants = additionalGuestsPayload();
    if (!occupants) return;
    setSaving(true);
    try {
      const res = await fetch("/api/hotel-bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          companyId: selectedCompanyId,
          rooms: roomsPayload,
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
          totalAmount: parseInt(form.totalAmount, 10),
          pricingSource: form.pricingSource,
          guestCategory: form.guestCategory,
          currency: stayCurrency,
          amountPaid: parseInt(form.amountPaid, 10) || 0,
          paymentStatus: form.paymentStatus,
          status: form.status,
          externalCompany: isEwc && form.externalCompany ? form.externalCompany : null,
          mealType: showMealType && form.mealType ? form.mealType : null,
          ...partyPayload(occupants),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
      setModal(null);
      await load();
      showToast("Updated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this hotel stay?")) return;
    const qs = new URLSearchParams({ id: String(id), companyId: selectedCompanyId });
    const res = await fetch(`/api/hotel-bookings?${qs}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      showToast(d.error ?? "Delete failed", "error");
      return;
    }
    await load();
    showToast("Deleted", "success");
  }

  if (!isHotel) {
    return (
      <div className="space-y-2">
        <h1 className="font-serif text-2xl font-bold text-base-content">Hotel stays</h1>
        <p className="text-sm text-base-content/60 max-w-md">
          Switch to Enchoro Wildlife Camp or Bondo Travellers Hotel to manage room inventory and
          reservations.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = { outline: "1px solid gray" };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${
            toast.type === "success" ? "bg-success text-success-content" : "bg-error text-error-content"
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-base-content flex items-center gap-2">
            <Bed className="h-7 w-7" />
            Hotel stays
          </h1>
          <p className="text-sm text-base-content/60">
            {isBth
              ? "Room nights and reservations for Bondo Travellers Hotel."
              : "Room nights and board options for Enchoro Wildlife Camp."}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm gap-2"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />
          New stay
        </button>
      </div>

      {rooms.length === 0 && !loading && (
        <p className="text-sm text-warning">
          No active rooms are available for this property. Add room types in the database first.
        </p>
      )}

      {arrivalUnread > 0 ? (
        <div className="alert alert-warning shadow-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Check-in reminders</p>
            <p className="text-sm">
              You have {arrivalUnread} unread arrival-day notification{arrivalUnread === 1 ? "" : "s"}. Open the
              bell in the top bar (notifications refresh on load).
            </p>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-base-content">
          <Calendar className="h-4 w-4 text-primary" />
          Today &amp; upcoming check-ins (Nairobi: {todayHotel.todayLabel})
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60">Today</p>
            {todayHotel.today.length === 0 ? (
              <p className="text-sm text-base-content/50">No check-ins today.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {todayHotel.today.map((b) => (
                  <li key={b.id} className="rounded-lg border border-base-content/10 bg-base-100 px-3 py-2">
                    <a href={`#hotel-stay-${b.id}`} className="font-medium text-primary hover:underline">
                      {staySourceLabel(b)}
                    </a>
                    <div className="text-xs text-base-content/60">
                      {stayPartyCountsLabel(b)} · {checkInYmd(b)} → {String(b.checkOutDate).slice(0, 10)} ·{" "}
                      {b.paymentStatus}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60">Next upcoming</p>
            {todayHotel.upcoming.length === 0 ? (
              <p className="text-sm text-base-content/50">No future stays on file.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {todayHotel.upcoming.map((b) => (
                  <li key={b.id} className="rounded-lg border border-base-content/10 bg-base-100 px-3 py-2">
                    <a href={`#hotel-stay-${b.id}`} className="font-medium text-primary hover:underline">
                      {staySourceLabel(b)}
                    </a>
                    <div className="text-xs text-base-content/60">
                      {stayPartyCountsLabel(b)} · Check-in {checkInYmd(b)} · {b.nights} nights
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
        <label className="form-control gap-1">
          <span className="label-text text-xs font-medium text-base-content/70">Check-in from</span>
          <input
            type="date"
            className="input input-bordered input-sm rounded-md"
            style={inputStyle}
            value={checkInFromF}
            onChange={(e) => setCheckInFromF(e.target.value)}
          />
        </label>
        <label className="form-control gap-1">
          <span className="label-text text-xs font-medium text-base-content/70">Check-in to</span>
          <input
            type="date"
            className="input input-bordered input-sm rounded-md"
            style={inputStyle}
            value={checkInToF}
            onChange={(e) => setCheckInToF(e.target.value)}
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-base-content/10 bg-base-100 shadow-sm">
        <table className="table table-sm">
          <thead className="sticky top-0 z-10 bg-base-200/95 text-xs uppercase text-base-content/70 backdrop-blur">
            <tr>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-32 flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Room type
                    <select
                      className="select select-bordered select-xs max-w-40 rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={roomF}
                      onChange={(e) => setRoomF(e.target.value)}
                    >
                      <option value="">All room types</option>
                      {roomOptions.map((o) => (
                        <option key={o.id} value={String(o.id)}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              </th>
              <th className="align-top">Number of rooms</th>
              <th className="align-top">Guest</th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-40 flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Check-in
                    <select
                      className="select select-bordered select-xs max-w-36 shrink-0 rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={checkInSort}
                      onChange={(e) => setCheckInSort(e.target.value as "asc" | "desc")}
                      title="Sort table by check-in date"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </span>
                </label>
              </th>
              <th className="align-top">Nights</th>
              <th className="align-top">Total</th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-26 flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Pay
                    <select
                      className="select select-bordered select-xs max-w-26 rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={payHF}
                      onChange={(e) => setPayHF(e.target.value)}
                    >
                      <option value="">All</option>
                      {PAY_STATUS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              </th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-[7rem] flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Status
                    <select
                      className="select select-bordered select-xs max-w-30 rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={resF}
                      onChange={(e) => setResF(e.target.value)}
                    >
                      <option value="">All</option>
                      {RES_STATUS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              </th>
              {showMealType && <th className="align-top">{isEwc ? "Meal / Co." : "Meal"}</th>}
              <th className="align-top" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showMealType ? 10 : 9} className="py-12 text-center">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : displayRows.length === 0 ? (
              <tr>
                <td
                  colSpan={showMealType ? 10 : 9}
                  className="py-10 text-center text-sm text-base-content/50"
                >
                  {rows.length === 0
                    ? "No hotel stays for this company."
                    : "No hotel stays match filters."}
                </td>
              </tr>
            ) : (
              pagedRows.map((b) => (
                <tr
                  key={b.id}
                  id={`hotel-stay-${b.id}`}
                  className="cursor-pointer transition-colors hover:bg-primary/5 active:bg-primary/10"
                  onClick={() => setViewId(b.id)}
                >
                  <td className="text-sm">{stayRoomLabel(b)}</td>
                  <td className="tabular-nums">{stayRoomCount(b) || "—"}</td>
                  <td className="text-sm">
                    <div>{stayGuestName(b) || "—"}</div>
                    <div className="text-xs text-base-content/50">{stayPartyCountsLabel(b)}</div>
                  </td>
                  <td className="text-sm">{String(b.checkInDate).slice(0, 10)}</td>
                  <td className="tabular-nums">{b.nights}</td>
                  <td className="tabular-nums font-medium">
                    {formatAmountForDisplay(
                      b.totalAmount,
                      (b.currency === "USD" ? "USD" : "KES") as CurrencyCode
                    )}
                  </td>
                  <td>
                    <span className={cn("badge badge-sm", paymentStatusBadgeClass(b.paymentStatus))}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className={cn("badge badge-sm", hotelReservationBadgeClass(b.status))}>
                      {b.status}
                    </span>
                  </td>
                  {showMealType && (
                    <td className="text-xs text-base-content/80">
                      {b.mealType?.replaceAll("_", " ") ?? "—"}
                      {b.externalCompany ? (
                        <div className="text-base-content/50">{b.externalCompany}</div>
                      ) : null}
                    </td>
                  )}
                  <td className="flex gap-1">
                    <a
                      className="btn btn-ghost btn-xs btn-square"
                      href={`/print/hotel-service-voucher/${b.id}?companyId=${encodeURIComponent(selectedCompanyId)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Print service voucher"
                      title="Print service voucher"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </a>
                    <InvoicePrintButton
                      companyId={selectedCompanyId}
                      referenceType="hotel"
                      referenceId={b.id}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(b);
                      }}
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square text-error"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(b.id);
                      }}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 max-md:flex-col max-md:items-stretch">
        <DashboardPagination page={page} pageCount={pageCount} setPage={setPage} />
        <DashboardTableExport title="Hotel stays" rows={displayRows} columns={exportColumns} />
      </div>

      <DashboardModal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === "create" ? "New hotel stay" : "Edit stay"}
      >
        <form
          onSubmit={modal === "create" ? submitCreate : submitEdit}
          className="flex w-full flex-col gap-4"
        >
          <fieldset className="form-control w-full">
            <legend className="label-text text-sm font-medium">Rooms</legend>
            <p className="mb-2 text-xs text-base-content/60">
              Choose a room type and how many rooms of that type. Add another room to mix types on
              this stay.
            </p>
            <div className="flex flex-col gap-3">
              {uniqueRoomTypes.length === 0 ? (
                <p className="text-sm text-base-content/50">No active room types in the database.</p>
              ) : (
                form.roomLines.map((line, index) => {
                  const selected = roomForTypeKey(line.typeKey);
                  const rateHint = selected ? roomLineRateLabel(selected) : null;
                  const label = selected
                    ? `${selected.roomType?.name || selected.code}${rateHint ? ` · ${rateHint}` : ""}`
                    : "Select room type";
                  return (
                    <div
                      key={index}
                      className="flex flex-col gap-2 rounded-lg border border-base-content/10 p-3"
                    >
                      <label className="form-control w-full">
                        <span className="label-text text-sm">Room type</span>
                        <details className="dropdown w-full">
                          <summary className="btn btn-sm m-0 w-full justify-between font-normal">
                            <span className="truncate">{label}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
                          </summary>
                          <ul className="menu dropdown-content z-20 mt-1 w-full rounded-box bg-base-100 p-2 shadow-sm">
                            {uniqueRoomTypes.map((room) => {
                              const hint = roomLineRateLabel(room);
                              return (
                                <li key={roomTypeKey(room)}>
                                  <a
                                    onClick={(e) => {
                                      e.preventDefault();
                                      updateRoomLine(index, { typeKey: roomTypeKey(room) });
                                      closeDropdown(e.currentTarget);
                                    }}
                                  >
                                    {room.roomType?.name || room.code}
                                    {hint ? (
                                      <span className="text-base-content/50">· {hint}</span>
                                    ) : null}
                                  </a>
                                </li>
                              );
                            })}
                          </ul>
                        </details>
                      </label>
                      <label className="form-control w-full">
                        <span className="label-text text-sm">Number of rooms</span>
                        <details className="dropdown w-full">
                          <summary className="btn btn-sm m-0 w-full justify-between font-normal">
                            {line.quantity}
                            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                          </summary>
                          <ul className="menu dropdown-content z-20 mt-1 w-full rounded-box bg-base-100 p-1 shadow-sm">
                            {ROOM_QTY_OPTIONS.map((qty) => (
                              <li key={qty}>
                                <a
                                  onClick={(e) => {
                                    e.preventDefault();
                                    updateRoomLine(index, { quantity: qty });
                                    closeDropdown(e.currentTarget);
                                  }}
                                >
                                  {qty}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </label>
                      {form.roomLines.length > 1 ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm w-full"
                          onClick={() => removeRoomLine(index)}
                        >
                          Remove room
                        </button>
                      ) : null}
                    </div>
                  );
                })
              )}
              <button
                type="button"
                className="btn btn-ghost btn-sm w-full"
                disabled={uniqueRoomTypes.length === 0 || form.roomLines.length >= MAX_ROOM_LINES}
                onClick={addRoomLine}
              >
                Add another room
              </button>
            </div>
          </fieldset>
          <label className="form-control w-full">
            <span className="label-text text-sm">Check in</span>
            <input
              type="date"
              className="input input-bordered input-sm w-full"
              style={inputStyle}
              value={form.checkInDate}
              onChange={(e) => setForm((f) => ({ ...f, checkInDate: e.target.value }))}
              required
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text text-sm">Check out</span>
            <input
              type="date"
              className="input input-bordered input-sm w-full"
              style={inputStyle}
              value={form.checkOutDate}
              onChange={(e) => setForm((f) => ({ ...f, checkOutDate: e.target.value }))}
              required
            />
          </label>
          {isEwc ? (
            <label className="form-control w-full">
              <span className="label-text text-sm">Guest category</span>
              <select
                className="select select-bordered select-sm w-full"
                style={inputStyle}
                value={form.guestCategory}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    guestCategory: e.target.value as GuestCategory,
                    pricingSource: "rate",
                  }))
                }
              >
                {GUEST_CATEGORIES.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="form-control w-full">
            <span className="label-text text-sm">Currency for amounts</span>
            <input
              className="input input-bordered input-sm w-full"
              style={inputStyle}
              value={stayCurrency}
              readOnly
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text text-sm">Total</span>
            <input
              className="input input-bordered input-sm w-full"
              style={inputStyle}
              value={form.totalAmount}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  totalAmount: e.target.value,
                  pricingSource: "manual",
                }))
              }
              required
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text text-sm">Paid</span>
            <input
              className="input input-bordered input-sm w-full"
              style={inputStyle}
              value={form.amountPaid}
              onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))}
            />
          </label>
          {rateQuote ? (
            <div className="rounded-lg border border-base-content/10 bg-base-200/40 p-3 text-sm">
              <div className="flex flex-col gap-2">
                <p className="font-medium">
                  Room rate quote{" "}
                  <span className="text-base-content/60">
                    ({form.pricingSource === "rate" ? "applied" : "available"})
                  </span>
                </p>
                {form.pricingSource !== "rate" ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm w-full"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        totalAmount: String(rateQuote.sellingPrice),
                        pricingSource: "rate",
                      }))
                    }
                  >
                    Apply room rate
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-base-content/70">
                {rateQuote.nights} night{rateQuote.nights === 1 ? "" : "s"} ×{" "}
                {formatAmountForDisplay(rateQuote.nightlyRate, stayCurrency)}
                {rateQuote.roundedUpBy > 0
                  ? ` → rounded to ${formatAmountForDisplay(rateQuote.sellingPrice, stayCurrency)}`
                  : ` = ${formatAmountForDisplay(rateQuote.sellingPrice, stayCurrency)}`}
              </p>
              {isEwc ? (
                <p className="mt-2 text-xs text-base-content/60">
                  Full board STO 2026. Low season Mar–Jun and Oct–Nov. High season Jan–Feb,
                  Jul–Sep and Dec. Child 2–12 years: 75% of extra adult bed. Infant to 2 years: free.
                </p>
              ) : null}
            </div>
          ) : selectedAllocations.length > 0 && stayNights >= 1 ? (
            <p className="text-xs text-base-content/60">
              No rate for this room type — enter total manually.
            </p>
          ) : null}
          <label className="form-control w-full">
            <span className="label-text text-sm">Pay status</span>
            <select
              className={cn(
                "select select-bordered select-sm w-full",
                paymentStatusSelectAccentClass(form.paymentStatus)
              )}
              style={inputStyle}
              value={form.paymentStatus}
              onChange={(e) =>
                setForm((f) => ({ ...f, paymentStatus: e.target.value as (typeof PAY_STATUS)[number] }))
              }
            >
              {PAY_STATUS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control w-full">
            <span className="label-text text-sm">Reservation</span>
            <select
              className={cn(
                "select select-bordered select-sm w-full",
                hotelReservationSelectAccentClass(form.status)
              )}
              style={inputStyle}
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as (typeof RES_STATUS)[number] }))
              }
            >
              {RES_STATUS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          {showMealType && (
            <>
              <label className="form-control w-full">
                <span className="label-text text-sm">Meal type</span>
                <select
                  className="select select-bordered select-sm w-full"
                  style={inputStyle}
                  value={form.mealType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      mealType: e.target.value as typeof f.mealType,
                    }))
                  }
                >
                  <option value="">—</option>
                  {MEAL_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              {isEwc && (
                <label className="form-control w-full">
                  <span className="label-text text-sm">External company (EWC)</span>
                  <input
                    className="input input-bordered input-sm w-full"
                    style={inputStyle}
                    value={form.externalCompany}
                    onChange={(e) => setForm((f) => ({ ...f, externalCompany: e.target.value }))}
                  />
                </label>
              )}
            </>
          )}
          <label className="form-control w-full">
            <span className="label-text text-sm">Primary guest name</span>
            <input
              className="input input-bordered input-sm w-full"
              style={inputStyle}
              value={form.guestName}
              onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text text-sm">Guest email</span>
            <input
              type="email"
              className="input input-bordered input-sm w-full"
              style={inputStyle}
              value={form.guestEmail}
              onChange={(e) => setForm((f) => ({ ...f, guestEmail: e.target.value }))}
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text text-sm">Guest phone</span>
            <input
              className="input input-bordered input-sm w-full"
              style={inputStyle}
              value={form.guestPhone}
              onChange={(e) => setForm((f) => ({ ...f, guestPhone: e.target.value }))}
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text text-sm">Adults</span>
            <input
              type="number"
              min={0}
              className="input input-bordered input-sm w-full"
              style={inputStyle}
              value={form.adults}
              onChange={(e) => setForm((f) => ({ ...f, adults: e.target.value }))}
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text text-sm">Children (2–12 years)</span>
            <input
              type="number"
              min={0}
              className="input input-bordered input-sm w-full"
              style={inputStyle}
              value={form.children}
              onChange={(e) => setForm((f) => ({ ...f, children: e.target.value }))}
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text text-sm">Infants (until 2 years)</span>
            <input
              type="number"
              min={0}
              className="input input-bordered input-sm w-full"
              style={inputStyle}
              value={form.infants}
              onChange={(e) => setForm((f) => ({ ...f, infants: e.target.value }))}
            />
          </label>
          <p className="text-xs text-base-content/50">
            Primary guest email is optional for walk-ins. Each additional guest needs a name and email
            and is not turned into a customer.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="label-text text-sm">Additional guests</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    occupants: [...f.occupants, { name: "", email: "" }],
                  }))
                }
              >
                Add guest
              </button>
            </div>
            {form.occupants.map((occupant, index) => (
              <div key={index} className="flex flex-col gap-1">
                <input
                  className="input input-bordered input-sm w-full"
                  style={inputStyle}
                  placeholder="Name"
                  value={occupant.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      occupants: f.occupants.map((row, i) =>
                        i === index ? { ...row, name: e.target.value } : row
                      ),
                    }))
                  }
                />
                <input
                  type="email"
                  className="input input-bordered input-sm w-full"
                  style={inputStyle}
                  placeholder="Email"
                  value={occupant.email}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      occupants: f.occupants.map((row, i) =>
                        i === index ? { ...row, email: e.target.value } : row
                      ),
                    }))
                  }
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm w-full"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      occupants: f.occupants.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-ghost btn-sm w-full sm:w-auto" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm w-full sm:w-auto" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-xs" /> : "Save"}
            </button>
          </div>
        </form>
      </DashboardModal>
      <EntityViewModal
        open={viewId !== null}
        onClose={() => setViewId(null)}
        companyId={selectedCompanyId}
        kind="hotel"
        entityId={viewId}
      />
    </div>
  );
}
