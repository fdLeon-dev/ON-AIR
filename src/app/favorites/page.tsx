"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useFavoritesStore } from "@/stores/favorites-store";
import type { Product } from "@/types";

export default function FavoritesPage() {
  const favoriteIds = useFavoritesStore((state) => state.ids);
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
            favorites.map((product) => (
              <div key={product.id} className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <p className="mt-2 text-sm text-zinc-400">{product.description}</p>
                <Link href={`/product/${product.slug}`} className="mt-6 inline-flex text-sm text-white hover:text-zinc-300">Ver producto</Link>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
