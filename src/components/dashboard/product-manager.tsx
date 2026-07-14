"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Product, ProductCategory, ProductStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Panel, formatCurrency } from "@/components/dashboard/dashboard-ui";

const statusOptions: ProductStatus[] = ["Nuevo", "Destacado", "Oferta", "Popular"];

export function ProductManager({
  initialProducts,
  categoryOptions,
  brandOptions,
}: {
  initialProducts: Product[];
  categoryOptions: string[];
  brandOptions: string[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Product> | null>(null);
  const [form, setForm] = useState({
    name: "",
    brand: brandOptions[0] ?? "Peak Sport",
    category: (categoryOptions[0] ?? "Conjuntos deportivos") as ProductCategory,
    subcategory: "Training",
    price: "100000",
    stock: "10",
    status: "Nuevo" as ProductStatus,
    description: "",
    longDescription: "",
    image1: "",
    image2: "",
    image3: "",
    image4: "",
  });

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const haystack = `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [products, search],
  );

  async function uploadSelectedFiles(files: FileList | null) {
    if (!files || files.length === 0) return [];
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 4)) {
      const safeName = `products/${Date.now()}-${file.name.replace(/[^a-z0-9.\-]/gi, "_")}`;
      const { error } = await supabase.storage.from("productos").upload(safeName, file, { upsert: true });
      if (error) continue;
      const { data } = supabase.storage.from("productos").getPublicUrl(safeName);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setDraft({
      name: product.name,
      brand: product.brand,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      stock: product.stock,
      status: product.status,
      description: product.description,
      longDescription: product.longDescription,
      image1: product.image1,
      image2: product.image2,
      image3: product.image3,
      image4: product.image4,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveChanges = async (product: Product) => {
    if (!draft) return;
    setLoading(true);
    setMessage(null);

    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        price: Number(draft.price),
        stock: Number(draft.stock),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      setMessage("No se pudo guardar el producto.");
      return;
    }

    const updated = (await response.json()) as Product;
    setProducts((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    setEditingId(null);
    setDraft(null);
    setMessage("Producto actualizado.");
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/products/create", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        longDescription: form.longDescription || form.description,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      setMessage("No se pudo crear el producto.");
      return;
    }

    const created = (await response.json()) as Product;
    setProducts((current) => [created, ...current]);
    setMessage("Producto creado.");
    setForm({
      name: "",
      brand: brandOptions[0] ?? "Peak Sport",
      category: (categoryOptions[0] ?? "Conjuntos deportivos") as ProductCategory,
      subcategory: "Training",
      price: "100000",
      stock: "10",
      status: "Nuevo",
      description: "",
      longDescription: "",
      image1: "",
      image2: "",
      image3: "",
      image4: "",
    });
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`¿Eliminar ${product.name}?`)) return;
    setLoading(true);
    const response = await fetch(`/api/products/${product.id}`, { method: "DELETE", credentials: "include" });
    setLoading(false);

    if (!response.ok) {
      setMessage("No se pudo eliminar el producto.");
      return;
    }

    setProducts((current) => current.filter((entry) => entry.id !== product.id));
    setMessage("Producto eliminado.");
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Crear producto"
        description="Nuevo artículo para la tienda con soporte de imágenes, talles y categorías."
        action={<Link href="/admin/products" className="text-sm text-emerald-300 hover:text-emerald-200">Ver catálogo completo</Link>}
      >
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Nombre" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Marca" list="brand-options" value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} required />
          <datalist id="brand-options">
            {brandOptions.map((brand) => <option key={brand} value={brand} />)}
          </datalist>
          <select className="rounded-full border border-white/10 bg-white/5 px-4 py-3" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ProductCategory }))}>
            {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Subcategoría" value={form.subcategory} onChange={(event) => setForm((current) => ({ ...current, subcategory: event.target.value }))} />
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Precio" type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} required />
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Stock" type="number" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} required />
          <select className="rounded-full border border-white/10 bg-white/5 px-4 py-3" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProductStatus }))}>
            {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL imagen 1" value={form.image1} onChange={(event) => setForm((current) => ({ ...current, image1: event.target.value }))} />
            <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL imagen 2" value={form.image2} onChange={(event) => setForm((current) => ({ ...current, image2: event.target.value }))} />
            <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL imagen 3" value={form.image3} onChange={(event) => setForm((current) => ({ ...current, image3: event.target.value }))} />
            <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL imagen 4" value={form.image4} onChange={(event) => setForm((current) => ({ ...current, image4: event.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-zinc-400">Subir imágenes (hasta 4)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (event) => {
                const urls = await uploadSelectedFiles(event.target.files);
                if (urls.length) {
                  setForm((current) => ({
                    ...current,
                    image1: urls[0] ?? "",
                    image2: urls[1] ?? "",
                    image3: urls[2] ?? "",
                    image4: urls[3] ?? "",
                  }));
                }
              }}
              className="mt-2 w-full text-sm"
            />
          </div>
          <textarea className="min-h-20 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 md:col-span-2" placeholder="Descripción corta" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          <textarea className="min-h-24 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 md:col-span-2" placeholder="Descripción larga" value={form.longDescription} onChange={(event) => setForm((current) => ({ ...current, longDescription: event.target.value }))} />
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={loading}>Crear producto</Button>
            {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
          </div>
        </form>
      </Panel>

      <Panel title="Catálogo" description={`${filteredProducts.length} productos visibles de ${products.length} totales.`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm sm:max-w-md"
            placeholder="Buscar por nombre, marca o categoría"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button variant="secondary" asChild>
            <Link href="/admin/stock">Ir a stock</Link>
          </Button>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-400">
              <tr>
                <th className="px-5 py-4">Producto</th>
                <th className="px-5 py-4">Precio</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const isEditing = editingId === product.id;
                return (
                  <tr key={product.id} className="border-t border-white/10">
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <input className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" value={draft?.name ?? ""} onChange={(event) => setDraft((current) => (current ? { ...current, name: event.target.value } : current))} />
                          <input className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" value={draft?.brand ?? ""} onChange={(event) => setDraft((current) => (current ? { ...current, brand: event.target.value } : current))} />
                          <select className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" value={draft?.category ?? categoryOptions[0]} onChange={(event) => setDraft((current) => (current ? { ...current, category: event.target.value as ProductCategory } : current))}>
                            {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                          <textarea className="min-h-20 w-full rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2" value={draft?.description ?? ""} onChange={(event) => setDraft((current) => (current ? { ...current, description: event.target.value } : current))} />
                          <textarea className="min-h-24 w-full rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2" value={draft?.longDescription ?? ""} onChange={(event) => setDraft((current) => (current ? { ...current, longDescription: event.target.value } : current))} />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-xs text-zinc-400">{product.brand} · {product.category}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <input className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" type="number" value={draft?.price ?? 0} onChange={(event) => setDraft((current) => (current ? { ...current, price: Number(event.target.value) } : current))} />
                      ) : (
                        formatCurrency(product.offerPrice ?? product.price)
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <input className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" type="number" value={draft?.stock ?? 0} onChange={(event) => setDraft((current) => (current ? { ...current, stock: Number(event.target.value) } : current))} />
                      ) : (
                        product.stock
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <select className="rounded-full border border-white/10 bg-white/5 px-3 py-2" value={draft?.status ?? "Nuevo"} onChange={(event) => setDraft((current) => (current ? { ...current, status: event.target.value as ProductStatus } : current))}>
                          {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      ) : (
                        product.status
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => void saveChanges(product)} disabled={loading}>Guardar</Button>
                          <Button size="sm" variant="secondary" onClick={() => { setEditingId(null); setDraft(null); }}>Cancelar</Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => startEdit(product)}>Editar</Button>
                          <Button size="sm" variant="ghost" onClick={() => void handleDelete(product)}>Eliminar</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
