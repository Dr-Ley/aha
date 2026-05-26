"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, Search, CheckCircle, Calendar, AlertTriangle } from "lucide-react";
import { useCompany } from "@/store/company-context";
import { companyUsesSafariTours } from "@/types/company";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { EntityViewModal } from "@/components/dashboard/entity-view-modal";
import {
  DashboardPagination,
  DashboardTableExport,
  type ExportColumn,
  useDashboardPagination,
} from "@/components/dashboard/dashboard-table-tools";
import type { CurrencyCode } from "@/lib/data";
import { formatKesForDisplay, getCurrencyByCode } from "@/lib/data";
import { nairobiYmd } from "@/lib/nairobi-date";
import {
  bookingStatusSelectAccentClass,
  paymentStatusSelectAccentClass,
} from "@/lib/dashboard-status-badges";
import { cn } from "@/lib/utils";

type TourRow = { id: number; title: string; slug: string };
type BookingRow = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  safariPackage: string | null;
  tripCountry: "Kenya" | "Tanzania" | null;
  startDate: string | null;
  endDate: string | null;
  travelDate: string;
  guests: number;
  status: string;
  paymentStatus: string;
  totalPrice: number | null;
  originalAmount: number | null;
  originalCurrency: string;
  exchangeRateToKes: number;
  exchangeRateDate: string | null;
  tourId: number | null;
  tour: { title: string } | null;
  accommodation: string;
  transport: string;
  specialRequests: string | null;
  pricePerPerson: number | null;
};

const STATUS_OPTS = ["pending", "confirmed", "cancelled", "completed", "refunded"] as const;
const PAY_OPTS = ["unpaid", "partial", "paid"] as const;

const exportColumns: ExportColumn<BookingRow>[] = [
  { key: "id", header: "ID", value: (b) => b.id },
  { key: "guest", header: "Guest", value: customerName },
  { key: "email", header: "Email", value: (b) => b.email },
  { key: "phone", header: "Phone", value: (b) => b.phone },
  { key: "package", header: "Package", value: (b) => b.safariPackage ?? b.tour?.title },
  { key: "country", header: "Trip country", value: (b) => b.tripCountry },
  { key: "start", header: "Start date", value: (b) => b.startDate ?? b.travelDate },
  { key: "status", header: "Status", value: (b) => b.status },
  { key: "paymentStatus", header: "Payment status", value: (b) => b.paymentStatus },
  { key: "total", header: "Total KES", value: (b) => b.totalPrice },
  { key: "original", header: "Original amount", value: (b) => formatOriginalBookingAmount(b) },
  { key: "rate", header: "Rate to KES", value: (b) => b.exchangeRateToKes },
];

function customerName(b: BookingRow) {
  return [b.firstName, b.lastName].filter(Boolean).join(" ").trim() || b.email;
}

function bookingStartYmd(b: BookingRow): string {
  return (b.startDate || b.travelDate || "").slice(0, 10);
}

function formatOriginalBookingAmount(b: BookingRow): string | null {
  if (b.originalAmount == null) return null;
  const currency = getCurrencyByCode(b.originalCurrency ?? "KES");
  return `${currency.symbol}${Math.round(b.originalAmount).toLocaleString()} ${currency.code}`;
}

export function BookingsPanel() {
  const { selectedCompanyId } = useCompany();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "admin";

  const [rows, setRows] = useState<BookingRow[]>([]);
  const [tours, setTours] = useState<TourRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<string>("");
  const [payF, setPayF] = useState<string>("");
  const [countryF, setCountryF] = useState<string>("");
  const [fromF, setFromF] = useState("");
  const [toF, setToF] = useState("");
  const [startSort, setStartSort] = useState<"asc" | "desc">("asc");

  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [arrivalUnread, setArrivalUnread] = useState(0);
  const [viewId, setViewId] = useState<number | null>(null);

  const emptyForm = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    travelDate: "",
    startDate: "",
    endDate: "",
    guests: "2",
    safariPackage: "",
    tripCountry: "Kenya" as "Kenya" | "Tanzania",
    totalPrice: "",
    priceCurrency: "KES" as CurrencyCode,
    tourId: "" as string | "",
    status: "pending" as (typeof STATUS_OPTS)[number],
    paymentStatus: "unpaid" as (typeof PAY_OPTS)[number],
    accommodation: "mid-range" as "budget" | "mid-range" | "luxury",
    transport: "4x4-landcruiser" as "4x4-landcruiser" | "safari-van",
    specialRequests: "",
    pricePerPerson: "",
  };
  const [form, setForm] = useState(emptyForm);

  const inputStyle = { outline: "1px solid gray" };

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    if (!companyUsesSafariTours(selectedCompanyId)) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ companyId: selectedCompanyId });
      const res = await fetch(`/api/bookings?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setRows(data.bookings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadTours = useCallback(async () => {
    if (tours.length) return;
    try {
      const res = await fetch("/api/tours");
      const data = await res.json();
      if (Array.isArray(data)) setTours(data.map((t: TourRow) => ({ id: t.id, title: t.title, slug: t.slug })));
    } catch {
      /* ignore */
    }
  }, [tours.length]);

  const filtered = useMemo(() => {
    return rows.filter((b) => {
      if (statusF && b.status !== statusF) return false;
      if (payF && b.paymentStatus !== payF) return false;
      if (countryF && (b.tripCountry ?? "") !== countryF) return false;
      const start = b.startDate || b.travelDate;
      if (fromF && start && start < fromF) return false;
      if (toF && start && start > toF) return false;
      if (q.trim()) {
        const n = q.toLowerCase();
        const hay = `${customerName(b)} ${b.email} ${b.safariPackage ?? ""} ${b.id}`.toLowerCase();
        if (!hay.includes(n)) return false;
      }
      return true;
    });
  }, [rows, q, statusF, payF, countryF, fromF, toF]);

  const sortedFiltered = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const da = bookingStartYmd(a);
      const db = bookingStartYmd(b);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      const c = da.localeCompare(db);
      return startSort === "asc" ? c : -c;
    });
    return copy;
  }, [filtered, startSort]);
  const { page, pageCount, setPage, pagedRows } = useDashboardPagination(sortedFiltered, 10);

  const todayUpcoming = useMemo(() => {
    const today = nairobiYmd();
    const active = rows.filter((b) => b.status !== "cancelled" && b.status !== "refunded");
    const todayList = active.filter((b) => bookingStartYmd(b) === today);
    const upcoming = active
      .filter((b) => bookingStartYmd(b) > today)
      .sort((a, b) => bookingStartYmd(a).localeCompare(bookingStartYmd(b)))
      .slice(0, 12);
    return { today: todayList, upcoming, todayLabel: today };
  }, [rows]);

  useEffect(() => {
    const qs = new URLSearchParams({ companyId: selectedCompanyId });
    void fetch(`/api/notifications?${qs}`)
      .then((r) => r.json())
      .then((j: { success?: boolean; notifications?: { isRead?: boolean; metadata?: { kind?: string } }[] }) => {
        if (!j.success) return;
        const n = (j.notifications ?? []).filter((x) => !x.isRead && x.metadata?.kind === "arrival_day").length;
        setArrivalUnread(n);
      })
      .catch(() => {});
  }, [selectedCompanyId, rows.length, loading]);

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (raw.startsWith("booking-")) {
      requestAnimationFrame(() => {
        document.getElementById(raw)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [sortedFiltered, loading]);

  function openCreate() {
    setForm({ ...emptyForm, priceCurrency: "KES" });
    setEditId(null);
    setModal("create");
    void loadTours();
  }

  function openEdit(b: BookingRow) {
    setEditId(b.id);
    setForm({
      firstName: b.firstName,
      lastName: b.lastName ?? "",
      email: b.email,
      phone: b.phone ?? "",
      country: b.country ?? "",
      travelDate: b.travelDate,
      startDate: b.startDate ?? b.travelDate,
      endDate: b.endDate ?? "",
      guests: String(b.guests),
      safariPackage: b.safariPackage ?? "",
      tripCountry: (b.tripCountry as "Kenya" | "Tanzania") ?? "Kenya",
      totalPrice: b.totalPrice != null ? String(b.totalPrice) : "",
      priceCurrency: "KES",
      tourId: b.tourId != null ? String(b.tourId) : "",
      status: (b.status as (typeof STATUS_OPTS)[number]) ?? "pending",
      paymentStatus: (b.paymentStatus as (typeof PAY_OPTS)[number]) ?? "unpaid",
      accommodation: (b.accommodation as "budget" | "mid-range" | "luxury") ?? "mid-range",
      transport: (b.transport as "4x4-landcruiser" | "safari-van") ?? "4x4-landcruiser",
      specialRequests: b.specialRequests ?? "",
      pricePerPerson: b.pricePerPerson != null ? String(b.pricePerPerson) : "",
    });
    setModal("edit");
    void loadTours();
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "staff_manual",
          companyId: selectedCompanyId,
          firstName: form.firstName,
          lastName: form.lastName || null,
          email: form.email,
          phone: form.phone || null,
          country: form.country || null,
          travelDate: form.travelDate,
          startDate: form.startDate || form.travelDate,
          endDate: form.endDate || null,
          guests: parseInt(form.guests, 10),
          safariPackage: form.safariPackage,
          tripCountry: form.tripCountry,
          totalPrice: form.totalPrice ? parseInt(form.totalPrice, 10) : null,
          tourId: form.tourId ? parseInt(form.tourId, 10) : null,
          status: form.status,
          paymentStatus: form.paymentStatus,
          accommodation: form.accommodation,
          transport: form.transport,
          specialRequests: form.specialRequests.trim() || null,
          pricePerPerson: form.pricePerPerson.trim() ? parseInt(form.pricePerPerson, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Save failed");
      setModal(null);
      await load();
      showToast("Booking created successfully", "success");
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
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: editId,
          companyId: selectedCompanyId,
          firstName: form.firstName,
          lastName: form.lastName || null,
          email: form.email,
          phone: form.phone || null,
          country: form.country || null,
          travelDate: form.travelDate,
          startDate: form.startDate || form.travelDate,
          endDate: form.endDate || null,
          guests: parseInt(form.guests, 10),
          safariPackage: form.safariPackage,
          tripCountry: form.tripCountry,
          totalPrice: form.totalPrice ? parseInt(form.totalPrice, 10) : null,
          tourId: form.tourId ? parseInt(form.tourId, 10) : null,
          status: form.status,
          paymentStatus: form.paymentStatus,
          accommodation: form.accommodation,
          transport: form.transport,
          specialRequests: form.specialRequests.trim() || null,
          pricePerPerson: form.pricePerPerson.trim() ? parseInt(form.pricePerPerson, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setModal(null);
      await load();
      showToast("Booking updated successfully", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  }

  async function patchField(id: number, partial: Record<string, unknown>) {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id, companyId: selectedCompanyId, ...partial }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      await load();
      showToast("Field updated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    }
  }

  async function removeBooking(id: number) {
    if (!isAdmin) return;
    if (!confirm("Delete this booking permanently?")) return;
    const qs = new URLSearchParams({ id: String(id), companyId: selectedCompanyId });
    const res = await fetch(`/api/bookings?${qs}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error ?? "Delete failed", "error");
      return;
    }
    await load();
    showToast("Booking deleted successfully", "success");
  }

  if (!companyUsesSafariTours(selectedCompanyId)) {
    return (
      <div className="space-y-2 max-w-lg">
        <h1 className="font-serif text-2xl font-bold text-base-content">Safari bookings</h1>
        <p className="text-sm text-base-content/60">
          This tenant does not use tour bookings. For Bondo Travellers Hotel, use{" "}
          <strong>Hotel stays</strong>, <strong>Restaurant</strong>, and <strong>Bar</strong> in
          the sidebar. Switch company for AHA or EWC to manage safaris.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
          <h1 className="font-serif text-2xl font-bold text-base-content mb-5">Bookings</h1>
          <p className="text-sm text-base-content/60">Search, filter from table headers, edit inline, or use modals.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New booking
        </button>
      </div>

      {arrivalUnread > 0 ? (
        <div className="alert alert-warning shadow-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Arrival-day reminders</p>
            <p className="text-sm">
              You have {arrivalUnread} unread notification{arrivalUnread === 1 ? "" : "s"} for safaris or stays
              starting today (Africa/Nairobi). Open the bell in the top bar to review.
            </p>
          </div>
        </div>
      ) : null}

      {(todayUpcoming.today.length > 0 || todayUpcoming.upcoming.length > 0) && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-base-content">
            <Calendar className="h-4 w-4 text-primary" />
            Today &amp; upcoming (Nairobi date: {todayUpcoming.todayLabel})
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60">Today</p>
              {todayUpcoming.today.length === 0 ? (
                <p className="text-sm text-base-content/50">No safari starts today.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {todayUpcoming.today.map((b) => (
                    <li key={b.id} className="rounded-lg border border-base-content/10 bg-base-100 px-3 py-2">
                      <a href={`#booking-${b.id}`} className="font-medium text-primary hover:underline">
                        {customerName(b)}
                      </a>
                      <span className="text-base-content/50"> · #{b.id}</span>
                      <div className="text-xs text-base-content/60">
                        {bookingStartYmd(b)} · {b.safariPackage ?? b.tour?.title ?? "—"} · {b.guests} guests ·{" "}
                        {b.paymentStatus}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60">Next upcoming</p>
              {todayUpcoming.upcoming.length === 0 ? (
                <p className="text-sm text-base-content/50">No future bookings on file.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {todayUpcoming.upcoming.map((b) => (
                    <li key={b.id} className="rounded-lg border border-base-content/10 bg-base-100 px-3 py-2">
                      <a href={`#booking-${b.id}`} className="font-medium text-primary hover:underline">
                        {customerName(b)}
                      </a>
                      <span className="text-base-content/50"> · #{b.id}</span>
                      <div className="text-xs text-base-content/60">
                        Start {bookingStartYmd(b)} · {b.safariPackage ?? b.tour?.title ?? "—"} · {b.guests} guests
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
        <label className="form-control gap-2">
          <span className="label-text text-sm font-medium">Search</span>
          <span
            className="input input-bordered input-sm flex w-52 items-center gap-2 rounded-md"
            style={inputStyle}
          >
            <Search className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <input
              className="grow bg-transparent outline-none"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, email, package…"
            />
          </span>
        </label>
        <label className="form-control gap-1">
          <span className="label-text text-xs font-medium text-base-content/70">Start from</span>
          <input
            type="date"
            className="input input-bordered input-sm rounded-md"
            style={inputStyle}
            value={fromF}
            onChange={(e) => setFromF(e.target.value)}
          />
        </label>
        <label className="form-control gap-1">
          <span className="label-text text-xs font-medium text-base-content/70">Start to</span>
          <input
            type="date"
            className="input input-bordered input-sm rounded-md"
            style={inputStyle}
            value={toF}
            onChange={(e) => setToF(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-base-content/10 bg-base-100 shadow-sm">
        <table className="table table-sm">
          <thead className="sticky top-0 z-10 bg-base-200/95 text-xs uppercase text-base-content/70 backdrop-blur">
            <tr>
              <th className="align-top">ID</th>
              <th className="align-top">Guest</th>
              <th className="align-top">Package</th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-[7rem] flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Country
                    <select
                      className="select select-bordered select-xs max-w-[7rem] rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={countryF}
                      onChange={(e) => setCountryF(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Tanzania">Tanzania</option>
                    </select>
                  </span>
                </label>
              </th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-40 flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Start
                    <select
                      className="select select-bordered select-xs max-w-36 shrink-0 rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={startSort}
                      onChange={(e) => setStartSort(e.target.value as "asc" | "desc")}
                      title="Sort by trip start date"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
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
                      value={statusF}
                      onChange={(e) => setStatusF(e.target.value)}
                    >
                      <option value="">All</option>
                      {STATUS_OPTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              </th>
              <th className="align-top normal-case font-normal">
                <label className="flex min-w-26 flex-col gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-base-content/70">
                  <span className="inline-flex flex-wrap items-center gap-1 leading-tight">
                    Pay
                    <select
                      className="select select-bordered select-xs max-w-26 rounded-md font-normal normal-case"
                      style={inputStyle}
                      value={payF}
                      onChange={(e) => setPayF(e.target.value)}
                    >
                      <option value="">All</option>
                      {PAY_OPTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              </th>
              <th className="align-top text-right">Total</th>
              <th className="align-top" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-base-content/50">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : sortedFiltered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-sm text-base-content/50">
                  {rows.length === 0 ? "No bookings yet." : "No bookings match filters."}
                </td>
              </tr>
            ) : (
              pagedRows.map((b) => (
                <tr
                  key={b.id}
                  id={`booking-${b.id}`}
                  className="cursor-pointer transition-colors hover:bg-primary/5 active:bg-primary/10"
                  onClick={() => setViewId(b.id)}
                >
                  <td className="font-mono text-xs">{b.id}</td>
                  <td>
                    <div className="font-medium">{customerName(b)}</div>
                    <div className="text-xs text-base-content/50">{b.email}</div>
                  </td>
                  <td className="max-w-[200px] truncate text-sm">{b.safariPackage ?? b.tour?.title ?? "—"}</td>
                  <td>{b.tripCountry ?? "—"}</td>
                  <td className="text-sm">{b.startDate || b.travelDate}</td>
                  <td>
                    <select
                      className={cn(
                        "select select-bordered select-xs w-34 rounded-md",
                        bookingStatusSelectAccentClass(b.status)
                      )}
                      style={inputStyle}
                      value={b.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => patchField(b.id, { status: e.target.value })}
                    >
                      {STATUS_OPTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className={cn(
                        "select select-bordered select-xs w-30 rounded-md",
                        paymentStatusSelectAccentClass(b.paymentStatus)
                      )}
                      style={inputStyle}
                      value={b.paymentStatus}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => patchField(b.id, { paymentStatus: e.target.value })}
                    >
                      {PAY_OPTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-right tabular-nums">
                    <div>{b.totalPrice != null ? formatKesForDisplay(b.totalPrice) : "—"}</div>
                    {formatOriginalBookingAmount(b) ? (
                      <div className="text-xs text-base-content/50">Original: {formatOriginalBookingAmount(b)}</div>
                    ) : null}
                  </td>
                  <td className=" gap-1">
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
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-square text-error"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBooking(b.id);
                        }}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DashboardPagination page={page} pageCount={pageCount} setPage={setPage} />
        <DashboardTableExport title="Safari bookings" rows={sortedFiltered} columns={exportColumns} />
      </div>

      {/* CREATE MODAL */}
      <DashboardModal open={modal === "create"} title="New booking" onClose={() => setModal(null)} wide>
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={submitCreate}>
          <label className="form-control gap-2 sm:col-span-1">
            <span className="label-text text-sm font-medium">First name</span>
            <input
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Last name</span>
            <input
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </label>
          <label className="form-control gap-2 sm:col-span-2">
            <span className="label-text text-sm px-2 font-medium">Email</span>
            <input
              type="email"
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Phone</span>
            <input
              className="input input-bordered input-sm rounded-md"
              style={inputStyle}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Guest country</span>
            <input
              className="input input-bordered input-sm rounded-md"
              style={inputStyle}
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Travel date</span>
            <input
              type="date"
              className="input input-bordered input-sm rounded-md"
              style={inputStyle}
              required
              value={form.travelDate}
              onChange={(e) => setForm({ ...form, travelDate: e.target.value })}
            />
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Trip start (optional)</span>
            <input
              type="date"
              className="input input-bordered input-sm rounded-md"
              style={inputStyle}
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Trip end (optional)</span>
            <input
              type="date"
              className="input input-bordered input-sm rounded-md"
              style={inputStyle}
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Guests</span>
            <input
              type="number"
              min={1}
              className="input input-bordered input-sm rounded-md"
              style={inputStyle}
              required
              value={form.guests}
              onChange={(e) => setForm({ ...form, guests: e.target.value })}
            />
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Accommodation</span>
            <select
              className="select select-bordered select-sm rounded-md"
              style={inputStyle}
              value={form.accommodation}
              onChange={(e) =>
                setForm({ ...form, accommodation: e.target.value as "budget" | "mid-range" | "luxury" })
              }
            >
              <option value="budget">Budget (tented camps)</option>
              <option value="mid-range">Mid-range (lodges)</option>
              <option value="luxury">Luxury (premium lodges)</option>
            </select>
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Transport</span>
            <select
              className="select select-bordered select-sm rounded-md"
              style={inputStyle}
              value={form.transport}
              onChange={(e) =>
                setForm({ ...form, transport: e.target.value as "4x4-landcruiser" | "safari-van" })
              }
            >
              <option value="4x4-landcruiser">4×4 Land Cruiser</option>
              <option value="safari-van">Safari van</option>
            </select>
          </label>
          <label className="form-control gap-2 sm:col-span-2">
            <span className="label-text text-sm font-medium">Special requests</span>
            <textarea
              className="textarea textarea-bordered textarea-sm min-h-[5rem] w-full rounded-md"
              style={inputStyle}
              placeholder="Dietary needs, celebrations, accessibility…"
              value={form.specialRequests}
              onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
            />
          </label>
          <label className="form-control gap-2 sm:col-span-2">
            <span className="label-text text-sm font-medium">Safari package</span>
            <input
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              required
              value={form.safariPackage}
              onChange={(e) => setForm({ ...form, safariPackage: e.target.value })}
            />
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Trip country</span>
            <select
              className="select select-bordered select-sm rounded-md"
              style={inputStyle}
              value={form.tripCountry}
              onChange={(e) => setForm({ ...form, tripCountry: e.target.value as "Kenya" | "Tanzania" })}
            >
              <option value="Kenya">Kenya</option>
              <option value="Tanzania">Tanzania</option>
            </select>
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Price per person (optional)</span>
            <input
              type="number"
              min={0}
              className="input input-bordered input-sm rounded-md"
              style={inputStyle}
              value={form.pricePerPerson}
              onChange={(e) => setForm({ ...form, pricePerPerson: e.target.value })}
            />
          </label>
          <div className="form-control sm:col-span-2 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
            <label className="form-control gap-2">
              <span className="label-text text-sm font-medium">Total price</span>
              <input
                type="number"
                min={0}
                className="input input-bordered input-sm rounded-md"
                style={inputStyle}
                value={form.totalPrice}
                onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
              />
            </label>
            <label className="form-control gap-2 w-full sm:w-[110px]">
              <span className="label-text text-sm font-medium">Currency</span>
              <input
                className="input input-bordered input-sm rounded-md w-full"
                style={inputStyle}
                value="KES"
                readOnly
              />
            </label>
          </div>
          <label className="form-control gap-2 sm:col-span-2">
            <span className="label-text text-sm font-medium">Link tour (optional)</span>
            <select
              className="select select-bordered select-sm rounded-md w-full"
              style={inputStyle}
              value={form.tourId}
              onChange={(e) => setForm({ ...form, tourId: e.target.value })}
            >
              <option value="">None</option>
              {tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Status</span>
            <select
              className={cn(
                "select select-bordered select-sm rounded-md",
                bookingStatusSelectAccentClass(form.status)
              )}
              style={inputStyle}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as (typeof STATUS_OPTS)[number] })}
            >
              {STATUS_OPTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium">Payment</span>
            <select
              className={cn(
                "select select-bordered select-sm rounded-md",
                paymentStatusSelectAccentClass(form.paymentStatus)
              )}
              style={inputStyle}
              value={form.paymentStatus}
              onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as (typeof PAY_OPTS)[number] })}
            >
              {PAY_OPTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-xs" /> : "Create"}
            </button>
          </div>
        </form>
      </DashboardModal>

      {/* EDIT MODAL */}
      <DashboardModal open={modal === "edit"} title="Edit booking" onClose={() => setModal(null)} wide>
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={submitEdit}>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium px-2">First name</span>
            <input
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </label>
          <label className="form-control gap-2">
            <span className="label-text text-sm font-medium px-2">Last name</span>
            <input
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </label>
          <label className="form-control gap-2 sm:col-span-2">
            <span className="label-text text-sm font-medium px-2">Email</span>
            <input
              type="email"
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="form-control gap-2 px-2">
            <span className="label-text text-sm font-medium px-2">Phone</span>
            <input
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="form-control gap-2 px-2">
            <span className="label-text text-sm font-medium px-2">Guest country</span>
            <input
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </label>
          <label className="form-control gap-2 px-2">
            <span className="label-text text-sm font-medium px-2">Travel date</span>
            <input
              type="date"
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              required
              value={form.travelDate}
              onChange={(e) => setForm({ ...form, travelDate: e.target.value })}
            />
          </label>
          <label className="form-control gap-2 px-2">
            <span className="label-text text-sm font-medium px-2">Start date</span>
            <input
              type="date"
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </label>
          <label className="form-control gap-2 px-2">
            <span className="label-text text-sm font-medium px-2">End date</span>
            <input
              type="date"
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </label>
          <label className="form-control gap-2 px-2">
            <span className="label-text text-sm font-medium px-2">Guests</span>
            <input
              type="number"
              min={1}
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              required
              value={form.guests}
              onChange={(e) => setForm({ ...form, guests: e.target.value })}
            />
          </label>
          <label className="form-control gap-2 px-2">
            <span className="label-text text-sm font-medium px-2">Accommodation</span>
            <select
              className="select select-bordered select-sm rounded-md w-full"
              style={inputStyle}
              value={form.accommodation}
              onChange={(e) =>
                setForm({ ...form, accommodation: e.target.value as "budget" | "mid-range" | "luxury" })
              }
            >
              <option value="budget">Budget (tented camps)</option>
              <option value="mid-range">Mid-range (lodges)</option>
              <option value="luxury">Luxury (premium lodges)</option>
            </select>
          </label>
          <label className="form-control gap-2 px-2">
            <span className="label-text text-sm font-medium px-2">Transport</span>
            <select
              className="select select-bordered select-sm rounded-md w-full"
              style={inputStyle}
              value={form.transport}
              onChange={(e) =>
                setForm({ ...form, transport: e.target.value as "4x4-landcruiser" | "safari-van" })
              }
            >
              <option value="4x4-landcruiser">4×4 Land Cruiser</option>
              <option value="safari-van">Safari van</option>
            </select>
          </label>
          <label className="form-control gap-2 sm:col-span-2 px-2">
            <span className="label-text text-sm font-medium px-2">Special requests</span>
            <textarea
              className="textarea textarea-bordered textarea-sm min-h-[5rem] w-full rounded-md"
              style={inputStyle}
              placeholder="Dietary needs, celebrations, accessibility…"
              value={form.specialRequests}
              onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
            />
          </label>
          <label className="form-control gap-2 sm:col-span-2">
            <span className="label-text text-sm font-medium px-2">Safari package</span>
            <input
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              required
              value={form.safariPackage}
              onChange={(e) => setForm({ ...form, safariPackage: e.target.value })}
            />
          </label>
          <label className="form-control gap-2 px-2">
            <span className="label-text text-sm font-medium px-2">Trip country</span>
            <select
              className="select select-bordered select-sm rounded-md w-full"
              style={inputStyle}
              value={form.tripCountry}
              onChange={(e) => setForm({ ...form, tripCountry: e.target.value as "Kenya" | "Tanzania" })}
            >
              <option value="Kenya">Kenya</option>
              <option value="Tanzania">Tanzania</option>
            </select>
          </label>
          <label className="form-control gap-2 px-2">
            <span className="label-text text-sm font-medium px-2">Price per person (optional)</span>
            <input
              type="number"
              min={0}
              className="input input-bordered input-sm rounded-md w-full"
              style={inputStyle}
              value={form.pricePerPerson}
              onChange={(e) => setForm({ ...form, pricePerPerson: e.target.value })}
            />
          </label>
          <div className="form-control px-2 sm:col-span-2 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
            <label className="form-control gap-2 px-2">
              <span className="label-text text-sm font-medium px-2">Total price</span>
              <input
                type="number"
                min={0}
                className="input input-bordered input-sm rounded-md w-full"
                style={inputStyle}
                value={form.totalPrice}
                onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
              />
            </label>
            <label className="form-control gap-2 px-2 w-full sm:w-[110px]">
              <span className="label-text text-sm font-medium px-2">Currency</span>
              <input
                className="input input-bordered input-sm rounded-md w-full"
                style={inputStyle}
                value="KES"
                readOnly
              />
            </label>
          </div>
          <label className="form-control gap-2 sm:col-span-2 px-2">
            <span className="label-text text-sm font-medium px-2">Link tour (optional)</span>
            <select
              className="select select-bordered select-sm rounded-md w-full"
              style={inputStyle}
              value={form.tourId}
              onChange={(e) => setForm({ ...form, tourId: e.target.value })}
            >
              <option value="">None</option>
              {tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control gap-2 px-2">
            <span className="label-text text-sm font-medium px-2">Status</span>
            <select
              className={cn(
                "select select-bordered select-sm rounded-md w-full",
                bookingStatusSelectAccentClass(form.status)
              )}
              style={inputStyle}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as (typeof STATUS_OPTS)[number] })}
            >
              {STATUS_OPTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control gap-2 px-2">
            <span className="label-text text-sm font-medium px-2">Payment</span>
            <select
              className={cn(
                "select select-bordered select-sm rounded-md w-full",
                paymentStatusSelectAccentClass(form.paymentStatus)
              )}
              style={inputStyle}
              value={form.paymentStatus}
              onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as (typeof PAY_OPTS)[number] })}
            >
              {PAY_OPTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
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
        kind="booking"
        entityId={viewId}
      />
    </div>
  );
}