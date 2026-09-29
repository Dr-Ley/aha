import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/schema";
import { createNotification } from "@/lib/notify";
import { and, desc, eq } from "drizzle-orm";
import { enforceRateLimit } from "@/lib/rate-limit";
import { contactBodySchema } from "@/lib/schemas/public";
import { ensureEnquiryNotificationEnum } from "@/lib/ensure-notification-entity-enum";
import { ensurePendingTenantColumns } from "@/lib/ensure-pending-tenant";
import { maybeSendEnquiryAcknowledgement } from "@/lib/email/enquiry-acknowledgement";
import { requireAuthenticatedUser, requireTenantContext } from "@/server/tenancy";

export async function GET(request: NextRequest) {
  try {
    const tenant = await requireTenantContext(request.nextUrl.searchParams.get("companyId"), {
      module: "enquiries",
    });
    if (!tenant.ok) return tenant.response;
    await ensurePendingTenantColumns();

    const rows = await db
      .select()
      .from(contactSubmissions)
      .where(eq(contactSubmissions.companyId, tenant.ctx.companyId))
      .orderBy(desc(contactSubmissions.createdAt));

    return NextResponse.json({ success: true, enquiries: rows });
  } catch (error) {
    console.error("Contact list error:", error);
    return NextResponse.json({ success: false, error: "Failed to list enquiries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "contact", 8);
    if (limited) return limited;

    const authResult = await requireAuthenticatedUser();
    const parsed = contactBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Please check the form fields and try again." },
        { status: 400 }
      );
    }
    const body = parsed.data;
    await ensurePendingTenantColumns();

    const [submission] = await db
      .insert(contactSubmissions)
      .values({
        companyId: body.companyId,
        userId: authResult.ok ? authResult.userId : null,
        firstName: body.firstName,
        lastName: body.lastName ?? null,
        email: body.email,
        phone: body.phone ?? null,
        subject: body.subject,
        message: body.message,
      })
      .returning();

    await ensureEnquiryNotificationEnum();
    await createNotification({
      companyId: body.companyId,
      type: "enquiry",
      action: "created",
      referenceId: submission.id,
      title: `New enquiry from ${submission.firstName}${submission.lastName ? ` ${submission.lastName}` : ""}`,
      metadata: {
        email: submission.email,
        subject: submission.subject,
      },
    });

    void maybeSendEnquiryAcknowledgement({
      id: submission.id,
      email: submission.email,
      firstName: submission.firstName,
      lastName: submission.lastName,
      subject: submission.subject,
      companyId: body.companyId,
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit message" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant = await requireTenantContext(body.companyId ?? null, {
      module: "enquiries",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    await ensurePendingTenantColumns();

    const id = Number(body.id);
    const status = String(body.status ?? "replied");
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ success: false, error: "Invalid enquiry ID" }, { status: 400 });
    }
    if (!["new", "replied", "closed"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const [row] = await db
      .update(contactSubmissions)
      .set({ status })
      .where(and(eq(contactSubmissions.id, id), eq(contactSubmissions.companyId, tenant.ctx.companyId)))
      .returning();

    if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, enquiry: row });
  } catch (error) {
    console.error("Contact patch error:", error);
    return NextResponse.json({ success: false, error: "Failed to update enquiry" }, { status: 500 });
  }
}
