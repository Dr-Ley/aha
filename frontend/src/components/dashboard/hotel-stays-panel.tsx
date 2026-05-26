"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle, Bed, Calendar, AlertTriangle } from "lucide-react";
import { useCompany } from "@/store/company-context";
import { companyUsesHotelStays } from "@/types/company";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { TypeaheadCreateSelect } from "@/components/dashboard/typeahead-create-select";
import { EntityViewModal } from "@/components/dashboard/entity-view-modal";
import {
  DashboardPagination,
  DashboardTableExport,
  type ExportColumn,
  useDashboardPagination,
} from "@/components/dashboard/dashboard-table-tools";
import type { CurrencyCode } from "@/lib/data";
import { formatKesForDisplay } from "@/lib/data";
import { nairobiYmd } from "@/lib/nairobi-date";
import {
  hotelReservationBadgeClass,
  hotelReservationSelectAccentClass,
  paymentStatusBadgeClass,
  paymentStatusSelectAccentClass,
} from "@/lib/dashboard-status-badges";
import { cn } from "@/lib/utils";

type RoomRow = {
  id: number;
  code: string;
  name: string | null;
  roomTypeId: number;
  roomType?: { name: string } | null;
};

type HotelBookingRow = {
  id: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: string;
  status: string;
  externalCompany: string | null;
  mealType: string | null;
  room: { id: number; code: string; name: string | null; roomTypeName: string | null } | null;
  guests: {
    fullName: string;
    email: string | null;
    phone: string | null;
    country: string | null;
    isPrimary: boolean;
  }[];
};

const RES_STATUS = ["pending", "confirmed", "cancelled", "checked_out"] as const;
const PAY_STATUS = ["unpaid", "partial", "paid"] as const;
const MEAL_TYPES = ["full_board", "half_board", "bed_only"] as const;

const exportColumns: ExportColumn<HotelBookingRow>[] = [
  { key: "id", header: "ID", value: (b) => b.id },
  { key: "room", header: "Room", value: (b) => b.room?.code ?? b.roomId },
  { key: "guest", header: "Guest", value: stayGuestSummary },
  { key: "checkIn", header: "Check in", value: (b) => b.checkInDate },
  { key: "checkOut", header: "Check out", value: (b) => b.checkOutDate },
  { key: "nights", header: "Nights", value: (b) => b.nights },
  { key: "total", header: "Total", value: (b) => b.totalAmount },
  { key: "paid", header: "Paid", value: (b) => b.amountPaid },
  { key: "paymentStatus", header: "Payment status", value: (b) => b.paymentStatus },
  { key: "status", header: "Reservation status", value: (b) => b.status },
  { key: "mealType", header: "Meal type", value: (b) => b.mealType },
];

function stayGuestSummary(b: HotelBookingRow): string {
  const names = b.guests.map((g) => g.fullName).filter(Boolean);
  return names.length ? names.join(", ") : "—";
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
    roomId: "",
    checkInDate: "",
    checkOutDate: "",
    totalAmount: "",
    amountPaid: "0",
    stayPriceCurrency: "KES" as CurrencyCode,
    paymentMethod: "",
    paymentStatus: "unpaid" as (typeof PAY_STATUS)[number],
    status: "pending" as (typeof RES_STATUS)[number],
    externalCompany: "",
    mealType: "" as "" | (typeof MEAL_TYPES)[number],
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestCountry: "",
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
        fetch(`/api/rooms?${qs}`),
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

  const roomOptions = useMemo(
    () =>
      rooms.map((r) => ({
        id: r.id,
        label: `${r.code}${r.name ? ` — ${r.name}` : ""}${
          r.roomType ? ` (${r.roomType.name})` : ""
        }`,
      })),
    [rooms]
  );

  const displayRows = useMemo(() => {
    const f = rowSource.filter((b) => {
      if (roomF && String(b.roomId) !== roomF) return false;
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
      roomId: "",
      checkInDate: "",
      checkOutDate: "",
      totalAmount: "",
      amountPaid: "0",
      stayPriceCurrency: "KES",
      paymentMethod: "",
      paymentStatus: "unpaid",
      status: "pending",
      externalCompany: "",
      mealType: "",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      guestCountry: "",
      notes: "",
    });
    setModal("create");
  }

  async function createRoom(code: string) {
    const existing = rooms.find((r) => r.code.trim().toLowerCase() === code.trim().toLowerCase());
    if (existing) {
      return {
        id: String(existing.id),
        label: `${existing.code}${existing.name ? ` - ${existing.name}` : ""}`,
        description: existing.roomType?.name ?? "Room",
      };
    }

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: selectedCompanyId,
        code,
        name: null,
        isActive: true,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.room) {
      showToast(typeof data.error === "string" ? data.error : "Could not create room", "error");
      return null;
    }
    const room = data.room as RoomRow;
    setRooms((current) => {
      const withoutDuplicate = current.filter((r) => r.id !== room.id);
      return [room, ...withoutDuplicate];
    });
    showToast(data.existing ? "Existing room selected" : "Room created", "success");
    return {
      id: String(room.id),
      label: `${room.code}${room.name ? ` - ${room.name}` : ""}`,
      description: room.roomType?.name ?? "Room",
    };
  }

  function openEdit(b: HotelBookingRow) {
    setEditId(b.id);
    setForm({
      roomId: String(b.roomId),
      checkInDate: String(b.checkInDate).slice(0, 10),
      checkOutDate: String(b.checkOutDate).slice(0, 10),
      totalAmount: String(b.totalAmount),
      amountPaid: String(b.amountPaid),
      stayPriceCurrency: "KES",
      paymentMethod: "",
      paymentStatus: b.paymentStatus as (typeof PAY_STATUS)[number],
      status: b.status as (typeof RES_STATUS)[number],
      externalCompany: b.externalCompany ?? "",
      mealType: (b.mealType as (typeof MEAL_TYPES)[number] | null) ?? "",
      guestName: b.guests[0]?.fullName ?? "",
      guestEmail: b.guests[0]?.email ?? "",
      guestPhone: b.guests[0]?.phone ?? "",
      guestCountry: b.guests[0]?.country ?? "",
      notes: "",
    });
    setModal("edit");
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const guests =
        form.guestName.trim().length > 0
          ? [
              {
                fullName: form.guestName.trim(),
                email: form.guestEmail.trim() || null,
                phone: form.guestPhone.trim() || null,
                country: form.guestCountry.trim() || null,
                isPrimary: true,
              },
            ]
          : [];
      const res = await fetch("/api/hotel-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          roomId: parseInt(form.roomId, 10),
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
          totalAmount: parseInt(form.totalAmount, 10),
          amountPaid: parseInt(form.amountPaid, 10) || 0,
          paymentMethod: form.paymentMethod || null,
          paymentStatus: form.paymentStatus,
          status: form.status,
          externalCompany: isEwc && form.externalCompany ? form.externalCompany : null,
          mealType: showMealType && form.mealType ? form.mealType : null,
          notes: form.notes || null,
          guests,
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
    setSaving(true);
    try {
      const guests =
        form.guestName.trim().length > 0
          ? [
              {
                fullName: form.guestName.trim(),
                email: form.guestEmail.trim() || null,
                phone: form.guestPhone.trim() || null,
                country: form.guestCountry.trim() || null,
                isPrimary: true,
              },
            ]
          : [];
      const res = await fetch("/api/hotel-bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          companyId: selectedCompanyId,
          roomId: parseInt(form.roomId, 10),
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
          totalAmount: parseInt(form.totalAmount, 10),
          amountPaid: parseInt(form.amountPaid, 10) || 0,
          paymentStatus: form.paymentStatus,
          status: form.status,
          externalCompany: isEwc && form.externalCompany ? form.externalCompany : null,
          mealType: showMealType && form.mealType ? form.mealType : null,
          guests,
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

      {roomOptions.length === 0 && !loading && (
        <p className="text-sm text-warning">
          No rooms yet. Search in the room field to create the first one.
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
                      Stay #{b.id}
                    </a>
                    <span className="text-base-content/50"> · {b.room?.code ?? `Room ${b.roomId}`}</span>
                    <div className="text-xs text-base-content/60">
                      {stayGuestSummary(b)} · {checkInYmd(b)} → {String(b.checkOutDate).slice(0, 10)} ·{" "}
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
                      Stay #{b.id}
                    </a>
                    <span className="text-base-content/50"> · {b.room?.code ?? `Room ${b.roomId}`}</span>
                    <div className="text-xs text-base-content/60">
                      {stayGuestSummary(b)} · Check-in {checkInYmd(b)} · {b.nights} nights
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
              <th className="align-top">ID</th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-32 flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Room
                    <select
                      className="select select-bordered select-xs max-w-40 rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={roomF}
                      onChange={(e) => setRoomF(e.target.value)}
                    >
                      <option value="">All rooms</option>
                      {roomOptions.map((o) => (
                        <option key={o.id} value={String(o.id)}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              </th>
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
                <td colSpan={showMealType ? 9 : 8} className="py-12 text-center">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : displayRows.length === 0 ? (
              <tr>
                <td
                  colSpan={showMealType ? 9 : 8}
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
                  <td className="font-mono text-xs">{b.id}</td>
                  <td className="text-sm">
                    {b.room?.code ?? b.roomId}
                    {b.room?.roomTypeName ? (
                      <span className="text-base-content/50"> — {b.room.roomTypeName}</span>
                    ) : null}
                  </td>
                  <td className="text-sm">{String(b.checkInDate).slice(0, 10)}</td>
                  <td className="tabular-nums">{b.nights}</td>
                  <td className="tabular-nums font-medium">{formatKesForDisplay(b.totalAmount)}</td>
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

      <div className="flex flex-wrap items-center justify-between gap-3">
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
          className="grid gap-3 max-w-md"
        >
          <label className="form-control w-full">
            <span className="label-text text-sm">Room</span>
            <TypeaheadCreateSelect
              value={form.roomId}
              options={roomOptions.map((o) => ({
                id: String(o.id),
                label: o.label,
              }))}
              inputStyle={inputStyle}
              placeholder="Search or create room..."
              createLabel="Create room"
              onCreate={createRoom}
              onSelect={(roomId) => setForm((f) => ({ ...f, roomId }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="form-control w-full col-span-1">
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
            <label className="form-control w-full col-span-1">
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
          </div>
          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
            <label className="form-control w-full col-span-2 sm:col-span-1">
              <span className="label-text text-sm">Currency for amounts</span>
              <input
                className="input input-bordered input-sm w-full"
                style={inputStyle}
                value="KES"
                readOnly
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="form-control w-full">
              <span className="label-text text-sm">Total</span>
              <input
                className="input input-bordered input-sm w-full"
                style={inputStyle}
                value={form.totalAmount}
                onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
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
          </div>
          <div className="grid grid-cols-2 gap-2">
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
          </div>
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
          </div>
          <label className="form-control w-full">
            <span className="label-text text-sm">Guest country</span>
            <input
              className="input input-bordered input-sm w-full"
              style={inputStyle}
              value={form.guestCountry}
              onChange={(e) => setForm((f) => ({ ...f, guestCountry: e.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
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
