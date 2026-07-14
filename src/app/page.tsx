import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/ecommerce/hero-section";
import { ProductCard } from "@/components/ecommerce/product-card";
import { FeaturedCategoriesSection } from "@/components/ecommerce/featured-categories-section";
import { loadHeroConfig, loadProducts, loadFeaturedCategories } from "@/lib/data/persistence";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, heroConfig, featuredCategories] = await Promise.all([loadProducts(), loadHeroConfig(), loadFeaturedCategories()]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <HeroSection heroConfig={heroConfig} />
        <FeaturedCategoriesSection categories={featuredCategories} />

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Productos destacados</p>
              <h2 className="mt-2 text-3xl font-semibold">Colección premium seleccionada</h2>
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
