import { Storefront } from "@/components/shop/storefront";
import { getCatalog } from "@/lib/shop-db";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const { shop, products } = await getCatalog();
  return <Storefront shop={shop} products={products} />;
}
