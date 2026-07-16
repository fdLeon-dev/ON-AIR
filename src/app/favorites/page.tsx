"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AddToCartButton } from "@/components/ecommerce/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { formatCurrency, resolveProductImageUrl } from "@/lib/utils";
import { useFavoritesStore } from "@/stores/favorites-store";
import type { Product } from "@/types";

export default function FavoritesPage() {
  const favoriteIds = useFavoritesStore((state) => state.ids);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    void fetch("/api/products").then((response) => response.json()).then((data) => setProducts(data));
  }, []);

  const favorites = products.filter((product) => favoriteIds.includes(product.id));

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Favoritos</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">Tus productos guardados para volver a ellos cuando quieras.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {favorites.length === 0 ? (
            <p className="text-zinc-500">Aún no agregaste favoritos.</p>
          ) : (
            favorites.map((product) => {
              const coverImage = resolveProductImageUrl(product.image1 || product.image2 || product.image3 || product.image4);

              return (
                <article key={product.id} className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950/80">
                  <Link href={`/product/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden">
                    <Image
                      src={coverImage}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition duration-500 hover:scale-105"
                    />
                  </Link>

                  <div className="space-y-4 p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{product.brand}</p>
                      <Link href={`/product/${product.slug}`} className="mt-2 block text-lg font-semibold text-white hover:text-zinc-300">
                        {product.name}
                      </Link>
                      <p className="mt-2 text-sm text-zinc-400">{product.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-white">{formatCurrency(product.offerPrice ?? product.price)}</p>
                        {product.offerPrice ? <p className="text-xs text-zinc-500 line-through">{formatCurrency(product.price)}</p> : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <AddToCartButton
                          product={product}
                          className="inline-flex h-9 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
                          label="Agregar al carrito"
                          selectedColor={product.colors[0] ?? ""}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            void toggleFavorite(product.id);
                          }}
                        >
                          Quitar de favoritos
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
