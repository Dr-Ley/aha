import { CatalogEditor } from "@/components/shop/catalog-editor";
import { BRANDS_KE_SHOP_ID, getCatalog } from "@/lib/shop-db";

export const dynamic = "force-dynamic";

export default async function BrandsKeCatalogPage() {
  const { shop, products } = await getCatalog(BRANDS_KE_SHOP_ID);
  return (
    <main className="storefront">
      <CatalogEditor
        shopName={shop.name}
        products={products}
        apiBase="/api/brands-ke"
        shopHref="/brands_ke"
        mediaBase="/api/brands-ke/media"
      />
    </main>
  );
}
