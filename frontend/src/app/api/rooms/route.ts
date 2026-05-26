import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roomTypes, rooms } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { checkApiPermission, canAccessDashboardFromSession } from "@/lib/permissions-server";
import { isValidCompanyId, resolveCompanyId } from "@/lib/tenant";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { companyIdZod } from "@/lib/schemas/company-id";

function getUserId(session: { user?: { id?: string | null } } | null): number | null {
  if (!session?.user?.id) return null;
  return typeof session.user.id === "string" ? parseInt(session.user.id, 10) : session.user.id;
}

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
    const session = await auth();
    if (!getUserId(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const companyId = resolveCompanyId(new URL(request.url).searchParams.get("companyId"));
    const list = await db
      .select({
        room: rooms,
        roomType: { id: roomTypes.id, name: roomTypes.name, maxOccupancy: roomTypes.maxOccupancy },
      })
      .from(rooms)
      .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .where(eq(rooms.companyId, companyId))
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
    const session = await auth();
    if (!getUserId(session) || !await canAccessDashboardFromSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = postSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });
    }
    const d = body.data;
    if (!isValidCompanyId(d.companyId)) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 });
    }
    const normalizedCode = d.code.trim().toLowerCase();
    const [existing] = await db
      .select({
        room: rooms,
        roomType: { id: roomTypes.id, name: roomTypes.name, maxOccupancy: roomTypes.maxOccupancy },
      })
      .from(rooms)
      .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .where(and(eq(rooms.companyId, d.companyId), sql`lower(${rooms.code}) = ${normalizedCode}`))
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
        .where(and(eq(roomTypes.companyId, d.companyId), sql`lower(${roomTypes.name}) = ${"standard"}`))
        .limit(1);
      if (defaultType) {
        roomTypeId = defaultType.id;
      } else {
        const [createdType] = await db
          .insert(roomTypes)
          .values({ companyId: d.companyId, name: "Standard", maxOccupancy: 2 })
          .returning();
        roomTypeId = createdType.id;
      }
    }

    const [rt] = await db
      .select()
      .from(roomTypes)
      .where(and(eq(roomTypes.id, roomTypeId), eq(roomTypes.companyId, d.companyId)))
      .limit(1);
    if (!rt) {
      return NextResponse.json({ error: "Room type not found for this company" }, { status: 400 });
    }
    const [row] = await db
      .insert(rooms)
      .values({
        companyId: d.companyId,
        roomTypeId,
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
