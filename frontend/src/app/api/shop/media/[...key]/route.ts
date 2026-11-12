import { NextResponse } from "next/server";
import { readShopImage } from "@/lib/shop-storage";

type Context = { params: Promise<{ key: string[] }> };

export async function GET(_request: Request, context: Context) {
  try {
    const image = await readShopImage((await context.params).key.join("/"));
    if (!image) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(image.bytes, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("shop media GET", error);
    return new NextResponse("Could not load the image", { status: 500 });
  }
}
