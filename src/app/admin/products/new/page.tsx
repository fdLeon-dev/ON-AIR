"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ProductCategory, ProductStatus } from "@/types";

const statusOptions: ProductStatus[] = ["Nuevo", "Destacado", "Oferta", "Popular"];
const categoryOptions: ProductCategory[] = ["Conjuntos deportivos", "Buzos", "Medias anti deslizante", "Camperas", "Remeras", "Shorts", "Accesorios"];

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/products/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        image1: form.image1,
        image2: form.image2,
        image3: form.image3,
        image4: form.image4,
        longDescription: form.longDescription || form.description,
      }),
    });

    if (response.ok) {
      router.push("/admin/products");
    }
  };

  async function uploadSelectedFiles(files: FileList | null) {
    if (!files || files.length === 0) return [];
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
    return urls;
  }

  return (
    <div className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8">
        <h1 className="text-3xl font-semibold">Nuevo producto</h1>
        <p className="mt-3 text-sm text-zinc-400">Agrega un producto con el mismo conjunto de campos que el editor del panel.</p>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          <input className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Nombre" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Marca" value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} required />
          <select className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ProductCategory })}>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Subcategoría" value={form.subcategory} onChange={(event) => setForm({ ...form, subcategory: event.target.value })} />
          <input className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Precio" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
          <input className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Stock" type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required />
          <select className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProductStatus })}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL imagen 1" value={form.image1} onChange={(event) => setForm({ ...form, image1: event.target.value })} />
            <input className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL imagen 2" value={form.image2} onChange={(event) => setForm({ ...form, image2: event.target.value })} />
            <input className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL imagen 3" value={form.image3} onChange={(event) => setForm({ ...form, image3: event.target.value })} />
            <input className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="URL imagen 4" value={form.image4} onChange={(event) => setForm({ ...form, image4: event.target.value })} />
          </div>
          <div className="mt-2">
            <label className="text-sm text-zinc-400">Subir imágenes (hasta 4)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                  const urls = await uploadSelectedFiles(e.target.files);
                  if (urls.length) setForm((current) => ({ ...current, image1: urls[0] ?? "", image2: urls[1] ?? "", image3: urls[2] ?? "", image4: urls[3] ?? "" }));
                }}
              className="mt-2 w-full text-sm"
            />
            {[form.image1, form.image2, form.image3, form.image4].some(Boolean) ? (
              <div className="mt-2 flex gap-2">
                {[form.image1, form.image2, form.image3, form.image4].filter(Boolean).map((u) => (
                  <img key={u} src={u} alt="preview" className="h-16 w-16 rounded-md object-cover" />
                ))}
              </div>
            ) : null}
          </div>
          <textarea className="min-h-20 w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 md:col-span-2" placeholder="Descripción corta" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <textarea className="min-h-24 w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 md:col-span-2" placeholder="Descripción larga" value={form.longDescription} onChange={(event) => setForm({ ...form, longDescription: event.target.value })} />
          <div className="md:col-span-2">
            <button className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black" type="submit">Guardar producto</button>
          </div>
        </form>
      </div>
    </div>
  );
}
