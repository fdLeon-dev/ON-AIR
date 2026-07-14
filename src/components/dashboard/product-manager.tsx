"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
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
  const [draft, setDraft] = useState<(Partial<Product> & { sizesInput?: string; sizeStockInput?: string }) | null>(null);
  const [form, setForm] = useState({
    name: "",
    brand: brandOptions[0] ?? "Peak Sport",
    category: (categoryOptions[0] ?? "Conjuntos deportivos") as ProductCategory,
    subcategory: "Training",
    price: "100000",
    stock: "10",
    sizesInput: "S, M, L",
    sizeStockInput: "10, 8, 5",
    status: "Nuevo" as ProductStatus,
    description: "",
    longDescription: "",
    image1: "",
    image2: "",
    image3: "",
    image4: "",
  });

  const parseSizesInput = (value: string) => value.split(",").map((entry) => entry.trim()).filter(Boolean);

  const parseSizeStockInput = (value: string, sizes: string[]) => {
    const parsedValues = value.split(",").map((entry) => Number(entry.trim())).filter((entry) => Number.isFinite(entry));
    return sizes.reduce<Record<string, number>>((accumulator, size, index) => {
      accumulator[size] = parsedValues[index] ?? 0;
      return accumulator;
    }, {});
  };

  const buildSizePayload = (sizesInput: string, sizeStockInput: string) => {
    const sizes = parseSizesInput(sizesInput);
    const sizeStock = parseSizeStockInput(sizeStockInput, sizes);
    const totalStock = sizes.length > 0 ? Object.values(sizeStock).reduce((sum, value) => sum + value, 0) : 0;
    return { sizes, sizeStock, totalStock };
  };

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const haystack = `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [products, search],
  );

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
      sizes: product.sizes,
      sizeStock: product.sizeStock,
      sizesInput: product.sizes.join(", "),
      sizeStockInput: product.sizes.map((size) => product.sizeStock?.[size] ?? 0).join(", "),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveChanges = async (product: Product) => {
    if (!draft) return;
    setLoading(true);
    setMessage(null);

    const { sizesInput = "", sizeStockInput = "", ...restDraft } = draft;
    const { sizes, sizeStock, totalStock } = buildSizePayload(sizesInput, sizeStockInput);
    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...restDraft,
        sizes,
        sizeStock,
        price: Number(draft.price),
        stock: totalStock || Number(draft.stock ?? 0),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error ?? "No se pudo guardar el producto.");
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

    const { sizesInput, sizeStockInput, ...restForm } = form;
    const { sizes, sizeStock, totalStock } = buildSizePayload(sizesInput, sizeStockInput);
    const response = await fetch("/api/products/create", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...restForm,
        sizes,
        sizeStock,
        price: Number(form.price),
        stock: totalStock || Number(form.stock),
        longDescription: form.longDescription || form.description,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error ?? "No se pudo crear el producto.");
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
      sizesInput: "S, M, L",
      sizeStockInput: "10, 8, 5",
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
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Stock total" type="number" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} required />
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Talles (S, M, L)" value={form.sizesInput} onChange={(event) => setForm((current) => ({ ...current, sizesInput: event.target.value }))} />
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Stock por talle (10, 8, 5)" value={form.sizeStockInput} onChange={(event) => setForm((current) => ({ ...current, sizeStockInput: event.target.value }))} />
          <select className="rounded-full border border-white/10 bg-white/5 px-4 py-3" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProductStatus }))}>
            {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
            <input type="url" className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL pública imagen 1" value={form.image1} onChange={(event) => setForm((current) => ({ ...current, image1: event.target.value }))} />
            <input type="url" className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL pública imagen 2" value={form.image2} onChange={(event) => setForm((current) => ({ ...current, image2: event.target.value }))} />
            <input type="url" className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL pública imagen 3" value={form.image3} onChange={(event) => setForm((current) => ({ ...current, image3: event.target.value }))} />
            <input type="url" className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL pública imagen 4" value={form.image4} onChange={(event) => setForm((current) => ({ ...current, image4: event.target.value }))} />
          </div>
          <div className="md:col-span-2 rounded-[1.25rem] border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
            Usa URLs públicas existentes del bucket <span className="font-semibold text-white">productos</span>. Ejemplo: <span className="break-all text-emerald-300">https://.../storage/v1/object/public/productos/mi-imagen.jpg</span>
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
                          <input className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" value={draft?.subcategory ?? ""} onChange={(event) => setDraft((current) => (current ? { ...current, subcategory: event.target.value } : current))} />
                          <input className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" placeholder="Talles (S, M, L)" value={draft?.sizesInput ?? ""} onChange={(event) => setDraft((current) => (current ? { ...current, sizesInput: event.target.value } : current))} />
                          <input className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" placeholder="Stock por talle (10, 8, 5)" value={draft?.sizeStockInput ?? ""} onChange={(event) => setDraft((current) => (current ? { ...current, sizeStockInput: event.target.value } : current))} />
                          <input className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" type="number" value={draft?.price ?? 0} onChange={(event) => setDraft((current) => (current ? { ...current, price: Number(event.target.value) } : current))} />
                          <input className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" type="number" value={draft?.stock ?? 0} onChange={(event) => setDraft((current) => (current ? { ...current, stock: Number(event.target.value) } : current))} />
                          <select className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" value={draft?.status ?? "Nuevo"} onChange={(event) => setDraft((current) => (current ? { ...current, status: event.target.value as ProductStatus } : current))}>
                            {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                          <div className="grid gap-2 md:grid-cols-2">
                            <input type="url" className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" value={draft?.image1 ?? ""} onChange={(event) => setDraft((current) => (current ? { ...current, image1: event.target.value } : current))} />
                            <input type="url" className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" value={draft?.image2 ?? ""} onChange={(event) => setDraft((current) => (current ? { ...current, image2: event.target.value } : current))} />
                            <input type="url" className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" value={draft?.image3 ?? ""} onChange={(event) => setDraft((current) => (current ? { ...current, image3: event.target.value } : current))} />
                            <input type="url" className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2" value={draft?.image4 ?? ""} onChange={(event) => setDraft((current) => (current ? { ...current, image4: event.target.value } : current))} />
                          </div>
                          <textarea className="min-h-20 w-full rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2" value={draft?.description ?? ""} onChange={(event) => setDraft((current) => (current ? { ...current, description: event.target.value } : current))} />
                          <textarea className="min-h-24 w-full rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2" value={draft?.longDescription ?? ""} onChange={(event) => setDraft((current) => (current ? { ...current, longDescription: event.target.value } : current))} />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-xs text-zinc-400">{product.brand} · {product.category}</p>
                          {product.sizes.length > 0 ? <p className="text-xs text-zinc-500">Talles: {product.sizes.join(", ")}</p> : null}
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
