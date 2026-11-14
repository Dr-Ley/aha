import { NextResponse } from "next/server";
import { z } from "zod";
import { isBrandsKeImage, MAX_PRODUCT_IMAGES } from "@/lib/shop-images";
import { deleteShopImages, putShopImage } from "@/lib/shop-storage";

const MAX_BYTES = 1_500_000;

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const files = form?.getAll("files").filter((item): item is File => item instanceof File) ?? [];
  if (files.length < 1 || files.length > MAX_PRODUCT_IMAGES) {
    return NextResponse.json({ error: "Choose between 1 and 8 images" }, { status: 400 });
  }
  const keys: string[] = [];
  try {
    for (const file of files) {
      if (file.size > MAX_BYTES || (file.type !== "image/webp" && file.type !== "image/jpeg")) {
        await deleteShopImages(keys, isBrandsKeImage);
        return NextResponse.json({ error: "Each image must be a compressed JPEG or WebP under 1.5 MB" }, { status: 400 });
      }
      keys.push(await putShopImage(new Uint8Array(await file.arrayBuffer()), file.type, "brands_ke"));
    }
    return NextResponse.json({ keys }, { status: 201 });
  } catch (error) {
    await deleteShopImages(keys, isBrandsKeImage).catch(() => undefined);
    console.error("brands_ke images POST", error);
    return NextResponse.json({ error: "Could not store the images" }, { status: 500 });
  }
}

const removeSchema = z.object({
  keys: z.array(z.string()).max(MAX_PRODUCT_IMAGES),
});

export async function DELETE(request: Request) {
  const parsed = removeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.keys.some((key) => !isBrandsKeImage(key))) {
    return NextResponse.json({ error: "Unknown image" }, { status: 400 });
  }
  try {
    await deleteShopImages(parsed.data.keys, isBrandsKeImage);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("brands_ke images DELETE", error);
    return NextResponse.json({ error: "Could not remove the images" }, { status: 500 });
  }
}
