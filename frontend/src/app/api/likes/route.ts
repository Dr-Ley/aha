import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { likes, tours, accommodations } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

// POST /api/likes - Toggle like (create or delete)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Please sign in to like" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tourId, accommodationId } = body;

    // Validate input
    if (!tourId && !accommodationId) {
      return NextResponse.json(
        { success: false, error: "Must provide tourId or accommodationId" },
        { status: 400 }
      );
    }

    if (tourId && accommodationId) {
      return NextResponse.json(
        { success: false, error: "Cannot like both tour and accommodation at once" },
        { status: 400 }
      );
    }

    // Convert userId to number - session might return it as string
    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id, 10) 
      : session.user.id;

    // Check for existing like
    const existingRows = await db
      .select()
      .from(likes)
      .where(
        tourId != null
          ? and(
              eq(likes.userId, userId), 
              eq(likes.tourId, tourId)
            )
          : and(
              eq(likes.userId, userId), 
              eq(likes.accommodationId, accommodationId!)
            )
      )
      .limit(1);

    const existingLike = existingRows[0];

    if (existingLike) {
      // Unlike: Delete the like
      await db.delete(likes).where(eq(likes.id, existingLike.id));

      // Decrement likes count
      if (tourId != null) {
        await db
          .update(tours)
          .set({ likes: sql`${tours.likes} - 1` })
          .where(eq(tours.id, tourId));
      } else if (accommodationId != null) {
        await db
          .update(accommodations)
          .set({ likes: sql`${accommodations.likes} - 1` })
          .where(eq(accommodations.id, accommodationId));
      }

      // Get updated count
      const updatedItem = tourId != null
        ? await db.select({ likes: tours.likes }).from(tours).where(eq(tours.id, tourId)).limit(1)
        : await db.select({ likes: accommodations.likes }).from(accommodations).where(eq(accommodations.id, accommodationId!)).limit(1);

      return NextResponse.json({ 
        success: true, 
        liked: false,
        likesCount: updatedItem[0]?.likes ?? 0
      });
    }

    // Like: Insert new like
    await db.insert(likes).values({
      userId,
      tourId: tourId ?? null,
      accommodationId: accommodationId ?? null,
    });

    // Increment likes count
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

    // Get updated count
    const updatedItem = tourId != null
      ? await db.select({ likes: tours.likes }).from(tours).where(eq(tours.id, tourId)).limit(1)
      : await db.select({ likes: accommodations.likes }).from(accommodations).where(eq(accommodations.id, accommodationId!)).limit(1);

    return NextResponse.json({ 
      success: true, 
      liked: true,
      likesCount: updatedItem[0]?.likes ?? 0
    });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process like" },
      { status: 500 }
    );
  }
}

// GET /api/likes - Get current user's likes
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ likes: [] });
    }

    // Convert userId to number
    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id, 10) 
      : session.user.id;

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