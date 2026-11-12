import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/shop-db";

export async function GET() {
  try {
    return NextResponse.json(await getCatalog());
  } catch (error) {
    console.error("shop GET", error);
    return NextResponse.json({ error: "Shop catalog is unavailable" }, { status: 500 });
  }
}
