import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/ecommerce/product-card";
import { loadProducts } from "@/lib/data/persistence";

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const products = await loadProducts();
  const promotionProducts = products.filter((product) => product.status === "Oferta" || typeof product.offerPrice === "number");

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Promociones</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">Productos en oferta y campañas activas actualizados desde el panel admin.</p>

        <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {promotionProducts.length > 0 ? (
            promotionProducts.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <div className="col-span-full rounded-[2rem] border border-white/10 bg-zinc-950/80 p-10 text-center text-zinc-400">
              Aun no hay productos en promoción. Actívalos desde /admin/coupons.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
