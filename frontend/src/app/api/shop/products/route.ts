import { NextResponse } from "next/server";
import { z } from "zod";
import { isProductImage, MAX_PRODUCT_IMAGES } from "@/lib/shop-images";
import { createProduct } from "@/lib/shop-db";

const productSchema = z.object({
  name: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(80),
  price: z.number().int().positive(),
  images: z.array(z.string().trim().min(1).max(512)).min(1).max(MAX_PRODUCT_IMAGES),
  tag: z.string().trim().max(40).nullable().optional(),
  description: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.images.every(isProductImage)) {
    return NextResponse.json({ error: "Check the product fields" }, { status: 400 });
  }
  try {
    const product = await createProduct({
      ...parsed.data,
      image: parsed.data.images[0],
      tag: parsed.data.tag || null,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("shop product POST", error);
    return NextResponse.json({ error: "Could not save the product" }, { status: 500 });
  }
}
