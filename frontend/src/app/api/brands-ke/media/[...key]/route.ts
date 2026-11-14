import { NextResponse } from "next/server";
import { isBrandsKeImage } from "@/lib/shop-images";
import { readShopImage } from "@/lib/shop-storage";

type Context = { params: Promise<{ key: string[] }> };

export async function GET(_request: Request, context: Context) {
  const key = (await context.params).key.join("/");
  try {
    const image = await readShopImage(key, isBrandsKeImage);
    if (!image) return new NextResponse("Not found", { status: 404 });
    const buffer = new ArrayBuffer(image.bytes.byteLength);
    new Uint8Array(buffer).set(image.bytes);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("brands_ke media GET", error);
    return new NextResponse("Could not load the image", { status: 500 });
  }
}
