"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Product } from "@/types";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = (await response.json()) as Product[];
      setResults(data);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative hidden w-full max-w-xl md:block">
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
        <Search className="h-4 w-4" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar productos"
          className="w-full bg-transparent outline-none placeholder:text-zinc-500"
        />
      </div>
      {results.length ? (
        <div className="absolute left-0 right-0 top-14 z-50 rounded-[1.5rem] border border-white/10 bg-zinc-950/95 p-3 shadow-2xl">
          {results.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="block rounded-2xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white">
              {product.name}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
