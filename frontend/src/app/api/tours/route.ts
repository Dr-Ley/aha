import { NextResponse } from "next/server";
import { getToursFromDb } from "@/lib/tours-db";

export async function GET() {
  try {
    const allTours = await getToursFromDb();
    return NextResponse.json(allTours);
  } catch (error) {
    console.error("Error fetching tours:", error);
    return NextResponse.json(
      { error: "Failed to fetch tours" },
      { status: 500 }
    );
  }
}