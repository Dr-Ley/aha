import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireTenantContext } from "@/server/tenancy";
import { isDocumentKind } from "@/lib/documents/models";
import { loadDocumentModel } from "@/lib/documents/load-document";
import { DocumentPdf } from "@/lib/documents/pdf-documents";

function moduleForKind(kind: string): "bookings" | "accommodation" | "payments" {
  if (kind === "booking-voucher") return "bookings";
  if (kind === "hotel-service-voucher") return "accommodation";
  return "payments";
}

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> }
) {
  const { kind, id: idRaw } = await params;
  if (!isDocumentKind(kind)) {
    return NextResponse.json({ error: "Unknown document" }, { status: 404 });
  }
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const tenant = await requireTenantContext(request.nextUrl.searchParams.get("companyId"), {
    module: kind === "invoice" ? ["bookings", "accommodation", "payments"] : moduleForKind(kind),
  });
  if (!tenant.ok) return tenant.response;

  const preparedName = tenant.ctx.session.user?.name ?? tenant.ctx.session.user?.email ?? null;
  const model = await loadDocumentModel({
    kind,
    id,
    companyId: tenant.ctx.companyId,
    preparedName,
  });
  if (!model) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await renderToBuffer(<DocumentPdf model={model} />);
  const filename = `${kind}-${id}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
