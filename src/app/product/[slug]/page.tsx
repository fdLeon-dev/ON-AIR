import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { loadProducts } from "@/lib/data/persistence";
import { formatCurrency } from "@/lib/utils";
import { AddToCartButton } from "@/components/ecommerce/add-to-cart-button";
import { ProductGallery } from "@/components/ecommerce/product-gallery";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const products = await loadProducts();
  const product = products.find((entry) => entry.slug === slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <ProductGallery images={[product.image1, product.image2, product.image3, product.image4]} name={product.name} />
          </div>
          <div className="space-y-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">{product.brand}</p>
              <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{product.name}</h1>
              <p className="mt-6 text-lg leading-8 text-zinc-400">{product.longDescription}</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
              <div className="flex items-end gap-3">
                <p className="text-3xl font-semibold">{formatCurrency(product.offerPrice ?? product.price)}</p>
                {product.offerPrice ? <p className="text-sm text-zinc-500 line-through">{formatCurrency(product.price)}</p> : null}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">Talles: {product.sizes.join(", ")}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">Colores: {product.colors.join(", ")}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">Stock: {product.stock > 0 ? `${product.stock} unidades` : "Agotado"}</span>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_1fr]">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Material</p>
                  <p className="mt-3 text-sm text-zinc-300">{product.material}</p>
                  {product.fabricDetails ? <p className="mt-2 text-sm text-zinc-300">{product.fabricDetails}</p> : null}
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Estampado</p>
                  <p className="mt-3 text-sm text-zinc-300">{product.print ?? "Acabado gráfico premium."}</p>
                  {product.style ? (
                    <>
                      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-zinc-500">Estilo</p>
                      <p className="mt-2 text-sm text-zinc-300">{product.style}</p>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <AddToCartButton
                  product={product}
                  className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                  label="Agregar al carrito"
                />
                <Link href="/favorites" className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10">Agregar a favoritos</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
