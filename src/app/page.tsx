import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/ecommerce/hero-section";
import { ProductCard } from "@/components/ecommerce/product-card";
import { categories } from "@/lib/data/products";
import { loadHeroConfig, loadProducts } from "@/lib/data/persistence";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, heroConfig] = await Promise.all([loadProducts(), loadHeroConfig()]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <HeroSection heroConfig={heroConfig} />

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Categorías destacadas</p>
              <h2 className="mt-2 text-3xl font-semibold">Diseñado para moverte con intención</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <div key={category.id} className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 p-4">
                <div className="mb-4 aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                  <Image src={category.image} alt={category.name} width={800} height={600} className="h-full w-full object-cover" />
                </div>
                <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{category.description}</p>
              </div>
            ))}
          </div>
        </section>

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
