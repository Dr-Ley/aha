import { NextResponse } from "next/server";
import { z } from "zod";
import { isBrandsKeImage, isBrandsKeProductImage, MAX_PRODUCT_IMAGES } from "@/lib/shop-images";
import { BRANDS_KE_SHOP_ID, deleteProduct, updateProduct } from "@/lib/shop-db";
import { deleteShopImages } from "@/lib/shop-storage";

const productSchema = z.object({
  name: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(80),
  price: z.number().int().positive(),
  images: z.array(z.string().trim().min(1).max(512)).min(1).max(MAX_PRODUCT_IMAGES),
  tag: z.string().trim().max(40).nullable().optional(),
  description: z.string().trim().min(1),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.images.every(isBrandsKeProductImage)) {
    return NextResponse.json({ error: "Check the product fields" }, { status: 400 });
  }
  try {
    const result = await updateProduct(
      id,
      {
        ...parsed.data,
        image: parsed.data.images[0],
        tag: parsed.data.tag || null,
      },
      BRANDS_KE_SHOP_ID
    );
    if (!result) return NextResponse.json({ error: "Unknown product" }, { status: 404 });
    await deleteShopImages(result.removed, isBrandsKeImage);
    return NextResponse.json({ product: result.product });
  } catch (error) {
    console.error("brands_ke product PATCH", error);
    return NextResponse.json({ error: "Could not update the product" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  try {
    const images = await deleteProduct(id, BRANDS_KE_SHOP_ID);
    if (!images) return NextResponse.json({ error: "Unknown product" }, { status: 404 });
    await deleteShopImages(images, isBrandsKeImage);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("brands_ke product DELETE", error);
    return NextResponse.json({ error: "Could not delete the product" }, { status: 500 });
  }
}
