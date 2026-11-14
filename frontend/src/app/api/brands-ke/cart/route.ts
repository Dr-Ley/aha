import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addToCart, BRANDS_KE_SHOP_ID, clearCart, getCart, setQuantity } from "@/lib/shop-db";

const COOKIE = "brands_ke_cart";

async function cartId(create: boolean): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;
  if (!create) return null;
  const id = crypto.randomUUID();
  jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return id;
}

export async function GET() {
  try {
    const id = await cartId(false);
    const items = id ? await getCart(id, BRANDS_KE_SHOP_ID) : [];
    return NextResponse.json({ items });
  } catch (error) {
    console.error("brands_ke cart GET", error);
    return NextResponse.json({ error: "Cart is unavailable" }, { status: 500 });
  }
}

const changeSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int(),
});

export async function POST(request: Request) {
  const parsed = changeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a product" }, { status: 400 });
  try {
    const id = await cartId(true);
    if (!id) return NextResponse.json({ error: "Cart is unavailable" }, { status: 500 });
    const items =
      parsed.data.quantity <= 0
        ? await setQuantity(id, parsed.data.productId, 0, BRANDS_KE_SHOP_ID)
        : await addToCart(id, parsed.data.productId, parsed.data.quantity, BRANDS_KE_SHOP_ID);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("brands_ke cart POST", error);
    return NextResponse.json({ error: "Could not update the bag" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const parsed = changeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a product" }, { status: 400 });
  try {
    const id = await cartId(false);
    if (!id) return NextResponse.json({ items: [] });
    return NextResponse.json({ items: await setQuantity(id, parsed.data.productId, parsed.data.quantity, BRANDS_KE_SHOP_ID) });
  } catch (error) {
    console.error("brands_ke cart PATCH", error);
    return NextResponse.json({ error: "Could not update the bag" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const id = await cartId(false);
    if (id) await clearCart(id, BRANDS_KE_SHOP_ID);
    return NextResponse.json({ items: [] });
  } catch (error) {
    console.error("brands_ke cart DELETE", error);
    return NextResponse.json({ error: "Could not clear the bag" }, { status: 500 });
  }
}
