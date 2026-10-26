import type { CompanyId } from "@/types/company";

export function customersListPath(companyId: CompanyId): string {
  return `/dashboard/customers?companyId=${encodeURIComponent(companyId)}`;
}

export function customerDetailPath(id: number, companyId: CompanyId): string {
  return `/dashboard/customers/${id}?companyId=${encodeURIComponent(companyId)}`;
}
