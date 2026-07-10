"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useFavoritesStore } from "@/stores/favorites-store";
import type { Product } from "@/types";
import { AddToCartButton } from "@/components/ecommerce/add-to-cart-button";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const isFavorite = useFavoritesStore((state) => state.isFavorite(product.id));

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
      <Link href={`/product/${product.slug}`} className="relative aspect-[4/5] overflow-hidden block">
        <Image
          src={product.image1 || product.image2 || product.image3 || product.image4}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className={`absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur ${isFavorite ? "text-red-400" : ""}`}
          aria-label="Agregar a favoritos"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      </Link>
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{product.brand}</p>
          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-medium text-red-400">
            {product.status}
          </span>
        </div>
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="text-xl font-semibold text-white transition group-hover:text-zinc-300">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm leading-6 text-zinc-400">{product.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-white">{formatCurrency(product.offerPrice ?? product.price)}</p>
            {product.offerPrice ? (
              <p className="text-sm text-zinc-500 line-through">{formatCurrency(product.price)}</p>
            ) : null}
          </div>
          <AddToCartButton
            product={product}
            className="rounded-full border border-white/10 bg-white/5 p-3 text-white transition hover:bg-white/10 animate-[pulse_0.45s_ease-out_1]"
            label={<ShoppingBag className="h-4 w-4" />}
          />
        </div>
      </div>
    </article>
  );
}
