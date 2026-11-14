import { BrandsKeStorefront } from "@/components/brands-ke/storefront";
import { BRANDS_KE_SHOP_ID, getCatalog } from "@/lib/shop-db";

export const dynamic = "force-dynamic";

export default async function BrandsKePage() {
  const { shop, products } = await getCatalog(BRANDS_KE_SHOP_ID);
  return <BrandsKeStorefront shop={shop} products={products} />;
}
