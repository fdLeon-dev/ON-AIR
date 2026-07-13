import { StatCard } from "@/components/dashboard/dashboard-ui";
import { ProductManager } from "@/components/dashboard/product-manager";
import { loadProducts } from "@/lib/data/persistence";
import { loadStoreSettings } from "@/lib/data/store-settings";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, settings] = await Promise.all([loadProducts(), loadStoreSettings()]);
  const lowStock = products.filter((product) => product.stock <= 5).length;
  const offerCount = products.filter((product) => product.status === "Oferta").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Productos" value={products.length} helpText="Catálogo total activo" tone="emerald" />
        <StatCard label="Stock bajo" value={lowStock} helpText="Requiere reposición" tone="amber" />
        <StatCard label="En oferta" value={offerCount} helpText="Promociones visibles" tone="sky" />
      </section>

      <ProductManager
        initialProducts={products}
        categoryOptions={settings.categories}
        brandOptions={settings.brands}
      />
    </div>
  );
}
