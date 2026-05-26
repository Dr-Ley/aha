import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notify";
import { DEFAULT_COMPANY_ID } from "@/types/company";
import { canAccessDashboardFromSession, checkApiPermission, getUserIdFromSession } from "@/lib/permissions-server";
import { desc, eq, sql } from "drizzle-orm";

let enquiryNotificationEnumEnsured = false;

async function ensureEnquiryNotificationEnum(): Promise<void> {
  if (enquiryNotificationEnumEnsured) return;
  await db.execute(sql`ALTER TYPE "notification_entity" ADD VALUE IF NOT EXISTS 'enquiry'`);
  enquiryNotificationEnumEnsured = true;
}

export async function GET() {
  try {
    const session = await auth();
    const userId = getUserIdFromSession(session);
    if (!userId || !await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const denied = await checkApiPermission(session, DEFAULT_COMPANY_ID, "enquiries", false);
    if (denied) return denied;

    const rows = await db
      .select()
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt));

    return NextResponse.json({ success: true, enquiries: rows });
  } catch (error) {
    console.error("Contact list error:", error);
    return NextResponse.json({ success: false, error: "Failed to list enquiries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    // Convert userId to number if it exists
    const userId = session?.user?.id 
      ? typeof session.user.id === 'string' 
        ? parseInt(session.user.id, 10) 
        : session.user.id
      : null;

    const [submission] = await db
      .insert(contactSubmissions)
      .values({
        userId,
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
      companyId: DEFAULT_COMPANY_ID,
      type: "enquiry",
      action: "created",
      referenceId: submission.id,
      title: `New enquiry from ${submission.firstName}${submission.lastName ? ` ${submission.lastName}` : ""}`,
      metadata: {
        email: submission.email,
        subject: submission.subject,
      },
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
    const session = await auth();
    const userId = getUserIdFromSession(session);
    if (!userId || !await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const denied = await checkApiPermission(session, DEFAULT_COMPANY_ID, "enquiries", true);
    if (denied) return denied;

    const body = await request.json();
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
      .where(eq(contactSubmissions.id, id))
      .returning();

    if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, enquiry: row });
  } catch (error) {
    console.error("Contact patch error:", error);
    return NextResponse.json({ success: false, error: "Failed to update enquiry" }, { status: 500 });
  }
}
