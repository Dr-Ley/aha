import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/schema";
import { auth } from "@/lib/auth";

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

    await db
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit message" },
      { status: 500 }
    );
  }
}
