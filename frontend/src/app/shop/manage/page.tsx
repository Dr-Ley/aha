import { CatalogEditor } from "@/components/shop/catalog-editor";
import { getCatalog } from "@/lib/shop-db";

export const dynamic = "force-dynamic";

export default async function ShopCatalogPage() {
  const { shop, products } = await getCatalog();
  return (
    <main className="storefront">
      <CatalogEditor shopName={shop.name} products={products} />
    </main>
  );
}
