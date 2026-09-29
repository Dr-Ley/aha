import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { customers, hotelBookings } from "@/lib/schema";
import { requireTenantContext } from "@/server/tenancy";
import { emailSchema } from "@/lib/schemas/public";
import {
  createCustomerFromStaff,
  ensureCustomersReady,
  ensureHotelStayPartyColumns,
  suggestCustomersForGuest,
} from "@/lib/customers";
import { customerDraftFromHotelGuest, mergeCustomerProfile } from "@/lib/customer-identity";

const identifySchema = z
  .object({
    companyId: z.string().min(1).max(32),
    hotelBookingId: z.coerce.number().int().positive(),
    customerId: z.number().int().positive().optional().nullable(),
    create: z
      .object({
        firstName: z.string().trim().min(1).max(100).optional(),
        lastName: z.string().trim().max(100).optional().nullable(),
        email: z.union([emailSchema, z.literal("")]).optional().nullable(),
        phone: z.string().max(50).optional().nullable(),
        country: z.string().max(100).optional().nullable(),
      })
      .optional(),
  })
  .refine((d) => d.customerId !== undefined || d.create != null, {
    message: "Provide customerId or create",
  });

export async function POST(request: NextRequest) {
  try {
    const parsed = identifySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const tenant = await requireTenantContext(parsed.data.companyId, {
      module: "accommodation",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    await ensureHotelStayPartyColumns();
    await ensureCustomersReady();

    const [stay] = await db
      .select()
      .from(hotelBookings)
      .where(
        and(eq(hotelBookings.id, parsed.data.hotelBookingId), eq(hotelBookings.companyId, companyId))
      )
      .limit(1);
    if (!stay) return NextResponse.json({ error: "Stay not found" }, { status: 404 });
    if (!stay.primaryGuestName?.trim()) {
      return NextResponse.json({ error: "No primary guest on this stay to link" }, { status: 400 });
    }

    if (parsed.data.customerId === null) {
      await db
        .update(hotelBookings)
        .set({ customerId: null, updatedAt: new Date() })
        .where(eq(hotelBookings.id, stay.id));
      return NextResponse.json({ success: true, customerId: null });
    }

    let customerId = parsed.data.customerId ?? null;
    if (customerId == null && parsed.data.create) {
      const fromStay = customerDraftFromHotelGuest({
        fullName: stay.primaryGuestName,
        email: parsed.data.create.email || stay.primaryGuestEmail,
        phone: parsed.data.create.phone || stay.primaryGuestPhone,
        country: parsed.data.create.country,
      });
      const firstName =
        parsed.data.create.firstName?.trim() || fromStay?.firstName || stay.primaryGuestName.trim() || "Guest";
      customerId = await createCustomerFromStaff(companyId, {
        firstName,
        lastName: parsed.data.create.lastName ?? fromStay?.lastName,
        email: parsed.data.create.email || stay.primaryGuestEmail,
        phone: parsed.data.create.phone || stay.primaryGuestPhone,
        country: parsed.data.create.country,
      });
    }
    if (customerId == null) {
      return NextResponse.json({ error: "Could not create customer" }, { status: 400 });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.companyId, companyId)))
      .limit(1);
    if (!customer) return NextResponse.json({ error: "Customer not found for this company" }, { status: 404 });

    const incoming = customerDraftFromHotelGuest({
      fullName: stay.primaryGuestName,
      email: stay.primaryGuestEmail,
      phone: stay.primaryGuestPhone,
    });
    if (incoming) {
      const merged = mergeCustomerProfile(
        {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          nationality: customer.nationality,
          country: customer.country,
        },
        incoming
      );
      if (
        merged.email !== customer.email ||
        merged.phone !== customer.phone ||
        merged.nationality !== customer.nationality ||
        merged.country !== customer.country
      ) {
        await db
          .update(customers)
          .set({
            email: merged.email,
            phone: merged.phone,
            nationality: merged.nationality,
            country: merged.country,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, customer.id));
      }
    }

    await db
      .update(hotelBookings)
      .set({ customerId: customer.id, updatedAt: new Date() })
      .where(eq(hotelBookings.id, stay.id));

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      customer,
    });
  } catch (e) {
    console.error("hotel-bookings identify POST", e);
    return NextResponse.json({ error: "Failed to link customer" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tenant = await requireTenantContext(url.searchParams.get("companyId"), {
      module: "accommodation",
      requireEdit: false,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;

    const hotelBookingId = parseInt(url.searchParams.get("hotelBookingId") ?? "", 10);
    if (Number.isNaN(hotelBookingId)) {
      return NextResponse.json({ error: "hotelBookingId required" }, { status: 400 });
    }

    await ensureHotelStayPartyColumns();
    const [stay] = await db
      .select()
      .from(hotelBookings)
      .where(and(eq(hotelBookings.id, hotelBookingId), eq(hotelBookings.companyId, companyId)))
      .limit(1);
    if (!stay) return NextResponse.json({ error: "Stay not found" }, { status: 404 });
    if (!stay.primaryGuestName?.trim()) {
      return NextResponse.json({ success: true, suggestions: [] });
    }

    const suggestions = await suggestCustomersForGuest(companyId, {
      fullName: stay.primaryGuestName,
      email: stay.primaryGuestEmail,
      phone: stay.primaryGuestPhone,
    });
    return NextResponse.json({
      success: true,
      stay: {
        primaryGuestName: stay.primaryGuestName,
        primaryGuestEmail: stay.primaryGuestEmail,
        primaryGuestPhone: stay.primaryGuestPhone,
        customerId: stay.customerId,
      },
      suggestions,
    });
  } catch (e) {
    console.error("hotel-bookings identify GET", e);
    return NextResponse.json({ error: "Failed to load suggestions" }, { status: 500 });
  }
}
