import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CatalogPageClient } from "@/components/catalog/catalog-page-client";
import { loadProducts } from "@/lib/data/persistence";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const products = await loadProducts();

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <CatalogPageClient products={products} />
      <Footer />
    </div>
  );
}
