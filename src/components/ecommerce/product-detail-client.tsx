"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/types";
import { AddToCartButton } from "@/components/ecommerce/add-to-cart-button";
import { ProductGallery } from "@/components/ecommerce/product-gallery";
import { formatCurrency } from "@/lib/utils";

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? "");
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] ?? "");

  useEffect(() => {
    setSelectedSize(product.sizes[0] ?? "");
    setSelectedColor(product.colors[0] ?? "");
  }, [product.id, product.sizes, product.colors]);

  const availableSizes = product.sizes ?? [];
  const sizeStock = product.sizeStock ?? {};

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
      <div className="lg:sticky lg:top-24">
        <ProductGallery images={[product.image1, product.image2, product.image3, product.image4]} name={product.name} />
      </div>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">{product.brand}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{product.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:mt-6 sm:text-lg sm:leading-8">{product.longDescription}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950/80 p-4 sm:p-6">
          <div className="flex flex-wrap items-end gap-3">
            <p className="text-2xl font-semibold sm:text-3xl">{formatCurrency(product.offerPrice ?? product.price)}</p>
            {product.offerPrice ? <p className="text-sm text-zinc-500 line-through">{formatCurrency(product.price)}</p> : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 sm:text-sm">Talles: {product.sizes.join(", ")}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 sm:text-sm">Stock: {product.stock > 0 ? `${product.stock} unidades` : "Agotado"}</span>
          </div>
          {product.colors.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <span key={color} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 sm:text-sm">
                  {color}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">Sin colores disponibles</p>
          )}
          {availableSizes.length > 0 ? (
            <div className="mt-5 sm:mt-6">
              <p className="text-sm font-medium text-white">Selecciona talle</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const stockForSize = sizeStock[size] ?? 0;
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-full border px-3 py-2 text-sm ${isSelected ? "border-emerald-400 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/5 text-zinc-300"}`}
                    >
                      {size} {stockForSize > 0 ? `(${stockForSize})` : "(Sin stock)"}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {product.colors.length > 0 ? (
            <div className="mt-5 sm:mt-6">
              <p className="text-sm font-medium text-white">Selecciona color</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-full border px-3 py-2 text-sm ${isSelected ? "border-emerald-400 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/5 text-zinc-300"}`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-[1fr_1fr] sm:gap-4">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Material</p>
              <p className="mt-3 text-sm text-zinc-300">{product.material}</p>
              {product.fabricDetails ? <p className="mt-2 text-sm text-zinc-300">{product.fabricDetails}</p> : null}
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 sm:p-5">
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
          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
            <AddToCartButton
              product={product}
              className="w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 sm:w-auto"
              label="Agregar al carrito"
              selectedSize={selectedSize}
              selectedColor={selectedColor}
            />
            <Link href="/favorites" className="flex w-full items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto">Agregar a favoritos</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
