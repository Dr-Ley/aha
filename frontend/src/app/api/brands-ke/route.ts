import { NextResponse } from "next/server";
import { BRANDS_KE_SHOP_ID, getCatalog } from "@/lib/shop-db";

export async function GET() {
  try {
    return NextResponse.json(await getCatalog(BRANDS_KE_SHOP_ID));
  } catch (error) {
    console.error("brands_ke GET", error);
    return NextResponse.json({ error: "Shop catalog is unavailable" }, { status: 500 });
  }
}
