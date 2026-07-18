import Image from "next/image";
import Link from "next/link";
import type { FeaturedCategory } from "@/types";

export function FeaturedCategoriesSection({ categories }: { categories: FeaturedCategory[] }) {
  const activeCategories = categories
    .filter((category) => category.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (activeCategories.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Colecciones destacadas</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Explora las colecciones que inspiran cada entrenamiento</h2>
        <p className="mt-4 text-sm leading-6 text-zinc-400">Descubre categorías seleccionadas para equiparte con estilo y desempeño en cada rutina.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {activeCategories.map((category) => (
          <Link
            key={category.id}
            href={`/catalog?category=${encodeURIComponent(category.slug)}`}
            className="group overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 transition hover:-translate-y-1 hover:border-white/20"
          >
            <article>
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  unoptimized
                />
              </div>
              <div className="space-y-3 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">{category.name}</p>
                <h3 className="text-2xl font-semibold text-white">{category.slug.replace(/-/g, " ")}</h3>
                <p className="text-sm leading-6 text-zinc-400">{category.description}</p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
