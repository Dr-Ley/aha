import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roomTypes, rooms } from "@/lib/schema";
import { requireTenantContext } from "@/server/tenancy";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod } from "@/lib/schemas/company-id";

const postSchema = z.object({
  companyId: companyIdZod,
  roomTypeId: z.coerce.number().int().positive().optional(),
  code: z.string().min(1).max(32),
  name: z.string().max(255).optional().nullable(),
  floor: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenant = await requireTenantContext(new URL(request.url).searchParams.get("companyId"), {
      module: "accommodation",
      requireEdit: false,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const { ensureEnchoroRates2026 } = await import("@/server/database/ensure-enchoro-rates");
    await ensureEnchoroRates2026();
    const activeOnly = new URL(request.url).searchParams.get("activeOnly") !== "0";
    const list = await db
      .select({
        room: rooms,
        roomType: {
          id: roomTypes.id,
          name: roomTypes.name,
          maxOccupancy: roomTypes.maxOccupancy,
          baseRate: roomTypes.baseRate,
        },
      })
      .from(rooms)
      .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .where(activeOnly ? and(eq(rooms.companyId, companyId), eq(rooms.isActive, true)) : eq(rooms.companyId, companyId))
      .orderBy(desc(rooms.createdAt));
    return NextResponse.json({
      success: true,
      rooms: list.map((r) => ({ ...r.room, roomType: r.roomType })),
    });
  } catch (e) {
    console.error("rooms GET", e);
    return NextResponse.json({ error: "Failed to list rooms" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = postSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = body.data;
    const tenant = await requireTenantContext(d.companyId, {
      module: "accommodation",
      requireEdit: true,
    });
    if (!tenant.ok) return tenant.response;
    const companyId = tenant.ctx.companyId;
    const normalizedCode = d.code.trim().toLowerCase();
    const [existing] = await db
      .select({
        room: rooms,
        roomType: { id: roomTypes.id, name: roomTypes.name, maxOccupancy: roomTypes.maxOccupancy },
      })
      .from(rooms)
      .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .where(and(eq(rooms.companyId, companyId), sql`lower(${rooms.code}) = ${normalizedCode}`))
      .limit(1);
    if (existing) {
      return NextResponse.json({
        success: true,
        room: { ...existing.room, roomType: existing.roomType },
        existing: true,
      });
    }

    let roomTypeId = d.roomTypeId;
    if (!roomTypeId) {
      const [defaultType] = await db
        .select()
        .from(roomTypes)
        .where(eq(roomTypes.companyId, companyId))
        .limit(1);
      if (!defaultType) {
        return NextResponse.json(
          { error: "No room type exists for this company. Add a room type first." },
          { status: 400 }
        );
      }
      roomTypeId = defaultType.id;
    }

    const [rt] = await db
      .select()
      .from(roomTypes)
      .where(and(eq(roomTypes.id, roomTypeId), eq(roomTypes.companyId, companyId)))
      .limit(1);
    if (!rt) {
      return NextResponse.json({ error: "Room type not found for this company" }, { status: 400 });
    }
    const [row] = await db
      .insert(rooms)
      .values({
        companyId,
        roomTypeId,
        propertyId: rt.propertyId,
        code: d.code.trim(),
        name: d.name ?? null,
        floor: d.floor ?? null,
        isActive: d.isActive ?? true,
      })
      .returning();
    return NextResponse.json({
      success: true,
      room: { ...row, roomType: { id: rt.id, name: rt.name, maxOccupancy: rt.maxOccupancy } },
    });
  } catch (e) {
    console.error("rooms POST", e);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
