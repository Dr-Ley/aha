import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { placeOrder } from "@/lib/shop-db";

const orderSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6).max(40),
  address: z.string().trim().min(4),
});

export async function POST(request: Request) {
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the customer details" }, { status: 400 });
  const cartId = (await cookies()).get("shop_cart")?.value;
  if (!cartId) return NextResponse.json({ error: "Your bag is empty" }, { status: 400 });
  try {
    const order = await placeOrder(cartId, parsed.data);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "Cart is empty" ? "Your bag is empty" : "Could not place the order";
    console.error("shop order POST", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
