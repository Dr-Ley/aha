import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { likes, tours, accommodations } from "@/lib/schema";
import { requireAuthenticatedUser } from "@/server/tenancy";
import { eq, and, sql } from "drizzle-orm";
import { enforceRateLimit } from "@/lib/rate-limit";
import { likeBodySchema } from "@/lib/schemas/public";

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "likes", 60);
    if (limited) return limited;

    const authResult = await requireAuthenticatedUser();
    if (!authResult.ok) return authResult.response;

    const parsed = likeBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Must provide tourId or accommodationId" },
        { status: 400 }
      );
    }
    const { tourId, accommodationId } = parsed.data;
    const userId = authResult.userId;

    const existingRows = await db
      .select()
      .from(likes)
      .where(
        tourId != null
          ? and(eq(likes.userId, userId), eq(likes.tourId, tourId))
          : and(eq(likes.userId, userId), eq(likes.accommodationId, accommodationId!))
      )
      .limit(1);

    const existingLike = existingRows[0];

    if (existingLike) {
      await db.delete(likes).where(eq(likes.id, existingLike.id));

      if (tourId != null) {
        await db
          .update(tours)
          .set({ likes: sql`GREATEST(${tours.likes} - 1, 0)` })
          .where(eq(tours.id, tourId));
      } else if (accommodationId != null) {
        await db
          .update(accommodations)
          .set({ likes: sql`GREATEST(${accommodations.likes} - 1, 0)` })
          .where(eq(accommodations.id, accommodationId));
      }

      const updatedItem =
        tourId != null
          ? await db.select({ likes: tours.likes }).from(tours).where(eq(tours.id, tourId)).limit(1)
          : await db
              .select({ likes: accommodations.likes })
              .from(accommodations)
              .where(eq(accommodations.id, accommodationId!))
              .limit(1);

      return NextResponse.json({
        success: true,
        liked: false,
        likesCount: updatedItem[0]?.likes ?? 0,
      });
    }

    let companyId: string | null = null;
    if (tourId != null) {
      const [tour] = await db
        .select({ companyId: tours.companyId })
        .from(tours)
        .where(eq(tours.id, tourId))
        .limit(1);
      companyId = tour?.companyId ?? null;
    } else if (accommodationId != null) {
      const [stay] = await db
        .select({ companyId: accommodations.companyId })
        .from(accommodations)
        .where(eq(accommodations.id, accommodationId))
        .limit(1);
      companyId = stay?.companyId ?? null;
    }
    if (!companyId) {
      return NextResponse.json({ success: false, error: "Catalog item not found" }, { status: 400 });
    }

    await db.insert(likes).values({
      userId,
      companyId,
      tourId: tourId ?? null,
      accommodationId: accommodationId ?? null,
    });

    if (tourId != null) {
      await db
        .update(tours)
        .set({ likes: sql`${tours.likes} + 1` })
        .where(eq(tours.id, tourId));
    } else if (accommodationId != null) {
      await db
        .update(accommodations)
        .set({ likes: sql`${accommodations.likes} + 1` })
        .where(eq(accommodations.id, accommodationId));
    }

    const updatedItem =
      tourId != null
        ? await db.select({ likes: tours.likes }).from(tours).where(eq(tours.id, tourId)).limit(1)
        : await db
            .select({ likes: accommodations.likes })
            .from(accommodations)
            .where(eq(accommodations.id, accommodationId!))
            .limit(1);

    return NextResponse.json({
      success: true,
      liked: true,
      likesCount: updatedItem[0]?.likes ?? 0,
    });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process like" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const authResult = await requireAuthenticatedUser();
    if (!authResult.ok) {
      return NextResponse.json({ likes: [] });
    }
    const userId = authResult.userId;

    const userLikes = await db
      .select({
        id: likes.id,
        tourId: likes.tourId,
        accommodationId: likes.accommodationId,
        createdAt: likes.createdAt,
      })
      .from(likes)
      .where(eq(likes.userId, userId));

    return NextResponse.json({
      likes: userLikes,
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json({ likes: [] });
  }
}
