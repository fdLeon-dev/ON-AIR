"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product, ProductCategory, ProductStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";

const statusOptions: ProductStatus[] = ["Nuevo", "Destacado", "Oferta", "Popular"];
const categoryOptions: ProductCategory[] = ["Conjuntos deportivos", "Buzos", "Medias anti deslizante", "Camperas", "Remeras", "Shorts", "Accesorios"];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Product> | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    brand: "Peak Sport",
    category: "Conjuntos deportivos" as ProductCategory,
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

  const loadProducts = async () => {
    setLoading(true);
    const response = await fetch("/api/products", { cache: "no-store" });
    const data = (await response.json()) as Product[];
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setDraft({
      name: product.name,
      price: product.price,
      stock: product.stock,
      status: product.status,
      category: product.category,
      subcategory: product.subcategory,
      description: product.description,
      longDescription: product.longDescription,
      image1: product.image1,
      image2: product.image2,
      image3: product.image3,
      image4: product.image4,
    });
  };

  const saveChanges = async (product: Product) => {
    if (!draft) return;

    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        price: Number(draft.price),
        stock: Number(draft.stock),
        status: draft.status,
        category: draft.category,
        subcategory: draft.subcategory,
        description: draft.description,
        longDescription: draft.longDescription,
        image1: draft.image1,
        image2: draft.image2,
        image3: draft.image3,
        image4: draft.image4,
      }),
    });

    if (response.ok) {
      setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, ...(draft as Partial<Product>) } : item)));
      setEditingId(null);
      setDraft(null);
    }
  };

  const updateStock = async (product: Product, nextStock: number) => {
    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: nextStock }),
    });

    if (response.ok) {
      setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, stock: nextStock } : item)));
    }
  };

  const handleCreateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/products/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...createForm,
        price: Number(createForm.price),
        stock: Number(createForm.stock),
        longDescription: createForm.longDescription || createForm.description,
      }),
    });

    if (response.ok) {
      const newProduct = (await response.json()) as Product;
      setProducts((current) => [newProduct, ...current]);
      setCreateForm({
        name: "",
        brand: "Peak Sport",
        category: "Conjuntos deportivos",
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
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`¿Eliminar ${product.name}?`)) return;

    const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });

    if (response.ok) {
      setProducts((current) => current.filter((item) => item.id !== product.id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Admin</p>
          <h1 className="text-3xl font-semibold">Productos</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/products/new" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">Nuevo producto</Link>
          <Link href="/admin" className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">Volver al dashboard</Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
          <p className="text-sm text-zinc-400">Productos activos</p>
          <p className="mt-3 text-3xl font-semibold">{products.length}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
          <p className="text-sm text-zinc-400">Stock total</p>
          <p className="mt-3 text-3xl font-semibold">{products.reduce((sum, product) => sum + product.stock, 0)}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
          <p className="text-sm text-zinc-400">Productos en oferta</p>
          <p className="mt-3 text-3xl font-semibold">{products.filter((product) => product.status === "Oferta").length}</p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Crear producto</h2>
            <p className="mt-1 text-sm text-zinc-400">Agrega un nuevo producto con datos básicos y estado visible.</p>
          </div>
        </div>
        <form onSubmit={handleCreateProduct} className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Nombre" value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} required />
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Marca" value={createForm.brand} onChange={(event) => setCreateForm((current) => ({ ...current, brand: event.target.value }))} required />
          <select className="rounded-full border border-white/10 bg-white/5 px-4 py-3" value={createForm.category} onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value as ProductCategory }))}>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Subcategoría" value={createForm.subcategory} onChange={(event) => setCreateForm((current) => ({ ...current, subcategory: event.target.value }))} />
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Precio" type="number" value={createForm.price} onChange={(event) => setCreateForm((current) => ({ ...current, price: event.target.value }))} required />
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Stock" type="number" value={createForm.stock} onChange={(event) => setCreateForm((current) => ({ ...current, stock: event.target.value }))} required />
          <select className="rounded-full border border-white/10 bg-white/5 px-4 py-3" value={createForm.status} onChange={(event) => setCreateForm((current) => ({ ...current, status: event.target.value as ProductStatus }))}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL imagen 1" value={createForm.image1} onChange={(event) => setCreateForm((current) => ({ ...current, image1: event.target.value }))} />
            <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL imagen 2" value={createForm.image2} onChange={(event) => setCreateForm((current) => ({ ...current, image2: event.target.value }))} />
            <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL imagen 3" value={createForm.image3} onChange={(event) => setCreateForm((current) => ({ ...current, image3: event.target.value }))} />
            <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL imagen 4" value={createForm.image4} onChange={(event) => setCreateForm((current) => ({ ...current, image4: event.target.value }))} />
          </div>
          <div className="mt-2">
            <label className="text-sm text-zinc-400">Subir imágenes (hasta 4)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                const supabase = createClient();
                const urls: string[] = [];
                for (const file of Array.from(files).slice(0, 4)) {
                  const safeName = `products/${Date.now()}-${file.name.replace(/[^a-z0-9.\-]/gi, "_")}`;
                  const { error } = await supabase.storage.from("productos").upload(safeName, file, { upsert: true });
                  if (error) continue;
                  const { data } = supabase.storage.from("productos").getPublicUrl(safeName);
                  urls.push(data.publicUrl);
                }
                if (urls.length) setCreateForm((current) => ({ ...current, image1: urls[0] ?? "", image2: urls[1] ?? "", image3: urls[2] ?? "", image4: urls[3] ?? "" }));
              }}
              className="mt-2 w-full text-sm"
            />
            {createForm.image1 || createForm.image2 || createForm.image3 || createForm.image4 ? (
              <div className="mt-2 flex gap-2">
                {[createForm.image1, createForm.image2, createForm.image3, createForm.image4].filter(Boolean).map((u) => (
                  <img key={u} src={u} alt="preview" className="h-16 w-16 rounded-md object-cover" />
                ))}
              </div>
            ) : null}
          </div>
          <textarea className="min-h-20 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 md:col-span-2" placeholder="Descripción corta" value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} />
          <textarea className="min-h-24 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 md:col-span-2" placeholder="Descripción larga" value={createForm.longDescription} onChange={(event) => setCreateForm((current) => ({ ...current, longDescription: event.target.value }))} />
          <div className="md:col-span-2">
            <button className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black" type="submit">Crear producto</button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/80">
        {loading ? (
          <p className="px-6 py-10 text-sm text-zinc-400">Cargando productos...</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-400">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isEditing = editingId === product.id;
                return (
                  <tr key={product.id} className="border-t border-white/10">
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2"
                            value={draft?.name ?? ""}
                            onChange={(event) => setDraft((current) => (current ? { ...current, name: event.target.value } : current))}
                          />
                          <div className="grid gap-2">
                            <input
                              className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2"
                              placeholder="URL imagen 1"
                              value={draft?.image1 ?? ""}
                              onChange={(event) => setDraft((current) => (current ? { ...current, image1: event.target.value } : current))}
                            />
                            <input
                              className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2"
                              placeholder="URL imagen 2"
                              value={draft?.image2 ?? ""}
                              onChange={(event) => setDraft((current) => (current ? { ...current, image2: event.target.value } : current))}
                            />
                            <input
                              className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2"
                              placeholder="URL imagen 3"
                              value={draft?.image3 ?? ""}
                              onChange={(event) => setDraft((current) => (current ? { ...current, image3: event.target.value } : current))}
                            />
                            <input
                              className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2"
                              placeholder="URL imagen 4"
                              value={draft?.image4 ?? ""}
                              onChange={(event) => setDraft((current) => (current ? { ...current, image4: event.target.value } : current))}
                            />
                          </div>
                            <div className="mt-2">
                              <label className="text-sm text-zinc-400">Subir imágenes (hasta 4)</label>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={async (e) => {
                                  const files = e.target.files;
                                  if (!files || files.length === 0) return;
                                  const supabase = createClient();
                                  const urls: string[] = [];
                                  for (const file of Array.from(files).slice(0, 4)) {
                                    const safeName = `products/${Date.now()}-${file.name.replace(/[^a-z0-9.\-]/gi, "_")}`;
                                    const { error } = await supabase.storage.from("productos").upload(safeName, file, { upsert: true });
                                    if (error) {
                                      console.error("Upload error:", error.message);
                                      continue;
                                    }
                                    const { data } = supabase.storage.from("productos").getPublicUrl(safeName);
                                    urls.push(data.publicUrl);
                                  }
                                  if (urls.length) setDraft((current) => (current ? { ...current, image1: urls[0] ?? "", image2: urls[1] ?? "", image3: urls[2] ?? "", image4: urls[3] ?? "" } : current));
                                }}
                                className="mt-2 w-full text-sm"
                              />
                              {draft?.image1 || draft?.image2 || draft?.image3 || draft?.image4 ? (
                                <div className="mt-2 flex gap-2">
                                  {[draft.image1, draft.image2, draft.image3, draft.image4].filter(Boolean).map((u) => (
                                    <img key={u} src={u} alt="preview" className="h-12 w-12 rounded-md object-cover" />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          <textarea
                            className="min-h-20 w-full rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2"
                            placeholder="Descripción corta"
                            value={draft?.description ?? ""}
                            onChange={(event) => setDraft((current) => (current ? { ...current, description: event.target.value } : current))}
                          />
                          <select
                            className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2"
                            value={draft?.category ?? "Conjuntos deportivos"}
                            onChange={(event) => setDraft((current) => (current ? { ...current, category: event.target.value as ProductCategory } : current))}
                          >
                            {categoryOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <input
                            className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2"
                            placeholder="Subcategoría"
                            value={draft?.subcategory ?? ""}
                            onChange={(event) => setDraft((current) => (current ? { ...current, subcategory: event.target.value } : current))}
                          />
                          <textarea
                            className="min-h-24 w-full rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2"
                            placeholder="Descripción larga"
                            value={draft?.longDescription ?? ""}
                            onChange={(event) => setDraft((current) => (current ? { ...current, longDescription: event.target.value } : current))}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-zinc-400">{product.description}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2"
                          type="number"
                          value={draft?.price ?? 0}
                          onChange={(event) => setDraft((current) => (current ? { ...current, price: Number(event.target.value) } : current))}
                        />
                      ) : (
                        `$ ${product.price.toLocaleString("es-AR")}`
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2"
                          type="number"
                          value={draft?.stock ?? 0}
                          onChange={(event) => setDraft((current) => (current ? { ...current, stock: Number(event.target.value) } : current))}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{product.stock}</span>
                          <button className="rounded-full border border-white/10 px-2 py-1 text-xs" onClick={() => updateStock(product, Math.max(0, product.stock - 1))}>-</button>
                          <button className="rounded-full border border-white/10 px-2 py-1 text-xs" onClick={() => updateStock(product, product.stock + 1)}>+</button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-2"
                          value={draft?.status ?? "Nuevo"}
                          onChange={(event) => setDraft((current) => (current ? { ...current, status: event.target.value as ProductStatus } : current))}
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        product.status
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black" onClick={() => void saveChanges(product)}>
                            Guardar
                          </button>
                          <button className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300" onClick={() => { setEditingId(null); setDraft(null); }}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300" onClick={() => startEdit(product)}>
                            Editar
                          </button>
                          <button className="rounded-full border border-red-500/20 px-3 py-1 text-xs text-red-300" onClick={() => void handleDeleteProduct(product)}>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
