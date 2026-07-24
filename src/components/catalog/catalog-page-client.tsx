"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/ecommerce/product-card";
import type { Product } from "@/types";

type CatalogPageClientProps = {
  products: Product[];
};

function normalizeCategoryValue(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildCatalogUrl(category: string, query: string) {
  const params = new URLSearchParams();

  if (category !== "Todos") {
    params.set("category", category);
  }

  if (query.trim()) {
    params.set("q", query.trim());
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return `/catalog${suffix}`;
}

function getInitialFilters() {
  if (typeof window === "undefined") {
    return { category: "Todos", query: "" };
  }

  const searchParams = new URLSearchParams(window.location.search);
  return {
    category: searchParams.get("category") ?? "Todos",
    query: searchParams.get("q") ?? "",
  };
}

export function CatalogPageClient({ products }: CatalogPageClientProps) {
  const router = useRouter();
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const initialFilters = getInitialFilters();
    setCategory(initialFilters.category);
    setQuery(initialFilters.query);
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map((product) => product.category).filter(Boolean)));
    uniqueCategories.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    return ["Todos", ...uniqueCategories];
  }, [products]);

  useEffect(() => {
    if (category === "Todos") return;
    if (categories.includes(category)) return;

    const normalizedCurrent = normalizeCategoryValue(category);
    const matchingCategory = categories.find((option) => normalizeCategoryValue(option) === normalizedCurrent);
    if (matchingCategory) {
      setCategory(matchingCategory);
    }
  }, [category, categories]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "Todos"
        || product.category === category
        || normalizeCategoryValue(product.category) === normalizeCategoryValue(category);
      const matchesQuery = !normalizedQuery
        || product.name.toLowerCase().includes(normalizedQuery)
        || product.brand.toLowerCase().includes(normalizedQuery)
        || product.category.toLowerCase().includes(normalizedQuery)
        || product.subcategory.toLowerCase().includes(normalizedQuery)
        || product.description.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [products, category, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextUrl = buildCatalogUrl(category, query);
      router.replace(nextUrl, { scroll: false });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [category, query, router]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Catálogo</p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">Ropa deportiva premium</h1>
          <p className="mt-2 text-sm text-zinc-400">Filtra por categoría o busca por nombre, marca y descripción.</p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto] lg:w-auto">
          <label className="sr-only" htmlFor="catalog-search">
            Buscar productos
          </label>
          <input
            id="catalog-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar en el catálogo"
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30"
          />
          <div className="flex items-center justify-center rounded-full border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-300 sm:min-w-[7.5rem]">
            {filteredProducts.length} producto{filteredProducts.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="-mx-4 flex w-[calc(100%+2rem)] flex-nowrap items-center gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:w-full sm:flex-wrap sm:px-0">
        {categories.map((option) => {
          const selected = option === category;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setCategory(option)}
              className={`rounded-full border px-4 py-2 text-sm transition ${selected ? "border-white bg-white text-black" : "border-white/10 bg-zinc-950/80 text-zinc-300 hover:border-white/30 hover:bg-white/10"}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.length ? (
          filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)
        ) : (
          <div className="col-span-full rounded-[1.5rem] border border-white/10 bg-zinc-950/80 p-8 text-center text-zinc-400 sm:p-10">
            No se encontraron productos con estos filtros. Prueba otra categoría o busca con otra palabra clave.
          </div>
        )}
      </div>
    </main>
  );
}
