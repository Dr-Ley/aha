import { redirect, notFound } from "next/navigation";
import { parseCompanyId } from "@/lib/tenant";
import { isDocumentKind } from "@/lib/documents/models";
import { loadDocumentModel } from "@/lib/documents/load-document";
import { requireTenantContext } from "@/server/tenancy";
import {
  BookingVoucherDocument,
  HotelServiceVoucherDocument,
  InvoiceDocument,
  PaymentReceiptDocument,
} from "@/components/documents/document-views";
import { PrintToolbar } from "@/components/documents/print-toolbar";

function moduleForKind(kind: string): "bookings" | "accommodation" | "payments" {
  if (kind === "booking-voucher") return "bookings";
  if (kind === "hotel-service-voucher") return "accommodation";
  return "payments";
}

function titleForKind(kind: string): string {
  if (kind === "booking-voucher") return "Booking voucher";
  if (kind === "hotel-service-voucher") return "Service voucher";
  if (kind === "invoice") return "Invoice";
  return "Payment receipt";
}

export default async function PrintDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; id: string }>;
  searchParams: Promise<{ companyId?: string }>;
}) {
  const { kind: kindRaw, id: idRaw } = await params;
  const { companyId: companyRaw } = await searchParams;
  if (!isDocumentKind(kindRaw)) notFound();
  if (!parseCompanyId(companyRaw)) {
    return (
      <div className="p-8 text-sm text-error">
        Valid companyId query parameter is required.
      </div>
    );
  }
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id < 1) notFound();

  const tenant = await requireTenantContext(companyRaw, {
    module: kindRaw === "invoice" ? ["bookings", "accommodation", "payments"] : moduleForKind(kindRaw),
  });
  if (!tenant.ok) {
    if (tenant.response.status === 401) redirect("/login");
    return <div className="p-8 text-sm text-error">You do not have permission to view this document.</div>;
  }

  const editTenant =
    kindRaw === "booking-voucher"
      ? await requireTenantContext(tenant.ctx.companyId, { module: "bookings", requireEdit: true })
      : null;
  const canEditVoucher = Boolean(editTenant?.ok);

  const preparedName = tenant.ctx.session.user?.name ?? tenant.ctx.session.user?.email ?? null;
  const model = await loadDocumentModel({
    kind: kindRaw,
    id,
    companyId: tenant.ctx.companyId,
    preparedName,
  });
  if (!model) notFound();

  const pdfHref = `/api/documents/${kindRaw}/${id}/pdf?companyId=${encodeURIComponent(tenant.ctx.companyId)}`;

  return (
    <div className="min-h-screen bg-neutral-200 print:bg-white">
      <PrintToolbar title={titleForKind(kindRaw)} pdfHref={pdfHref} />
      <div className="py-6 print:py-0">
        {model.kind === "booking-voucher" ? (
          <BookingVoucherDocument
            model={model}
            toCompanyEdit={{ bookingId: id, companyId: tenant.ctx.companyId, canEdit: canEditVoucher }}
          />
        ) : null}
        {model.kind === "hotel-service-voucher" ? (
          <HotelServiceVoucherDocument model={model} />
        ) : null}
        {model.kind === "payment-receipt" ? <PaymentReceiptDocument model={model} /> : null}
        {model.kind === "invoice" ? <InvoiceDocument model={model} /> : null}
      </div>
    </div>
  );
}
