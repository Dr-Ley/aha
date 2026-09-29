"use client";

import { DashboardTableExport, type ExportColumn } from "@/components/dashboard/dashboard-table-tools";
import { displayCustomerName } from "@/lib/customer-identity";

export type CustomerExportRow = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  notes: string | null;
  bookingCount: number;
  hotelStayCount: number;
  lastActivity: string | null;
};

function displayName(row: CustomerExportRow): string {
  return displayCustomerName(row) || row.email || "Guest";
}

const exportColumns: ExportColumn<CustomerExportRow>[] = [
  { key: "id", header: "ID", value: (row) => row.id },
  { key: "name", header: "Name", value: displayName },
  { key: "email", header: "Email", value: (row) => row.email },
  { key: "phone", header: "Phone", value: (row) => row.phone },
  { key: "nationality", header: "Nationality", value: (row) => row.nationality },
  { key: "bookings", header: "Safaris", value: (row) => row.bookingCount },
  { key: "stays", header: "Hotel stays", value: (row) => row.hotelStayCount },
  { key: "lastActivity", header: "Last activity", value: (row) => row.lastActivity },
  { key: "notes", header: "Notes", value: (row) => row.notes },
];

export function CustomersTableExport({
  title,
  rows,
}: {
  title: string;
  rows: CustomerExportRow[];
}) {
  return <DashboardTableExport title={title} columns={exportColumns} rows={rows} />;
}
