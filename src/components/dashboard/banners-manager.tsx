"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/dashboard-ui";
import type { StoreBanner } from "@/lib/data/banners";

export function BannersManager({ initialBanners }: { initialBanners: StoreBanner[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", subtitle: "", imageUrl: "/peak.png", href: "/catalog", active: true });

  const refresh = async () => {
    const response = await fetch("/api/admin/banners", { credentials: "include" });
    const data = (await response.json()) as StoreBanner[];
    setBanners(data);
  };

  const save = async (payload: Partial<StoreBanner> & { id?: string }, method: "POST" | "PATCH" | "DELETE") => {
    const response = await fetch("/api/admin/banners", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setMessage("No se pudo guardar el banner.");
      return;
    }
    await refresh();
    setMessage("Banner actualizado.");
  };

  return (
    <Panel title="Banners" description="Campañas destacadas y hero visual de la tienda.">
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="grid gap-3 md:grid-cols-2">
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" placeholder="Título" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" placeholder="Link" value={form.href} onChange={(event) => setForm((current) => ({ ...current, href: event.target.value }))} />
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm md:col-span-2" placeholder="Subtítulo" value={form.subtitle} onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))} />
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm md:col-span-2" placeholder="Imagen" value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} />
          <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm md:col-span-2">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
            Activo
          </label>
        </div>
        <Button onClick={() => void save(form, "POST")}>Crear banner</Button>
      </div>

      <div className="mt-5 space-y-3">
        {banners.map((banner) => (
          <div key={banner.id} className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 md:flex-row md:items-center">
            <img src={banner.imageUrl} alt={banner.title} className="h-20 w-20 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">{banner.title}</p>
              <p className="text-sm text-zinc-400">{banner.subtitle}</p>
              <p className="text-xs text-zinc-500">{banner.href}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => void save({ ...banner, active: !banner.active }, "PATCH")}>
                {banner.active ? "Desactivar" : "Activar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void save({ id: banner.id }, "DELETE")}>Eliminar</Button>
            </div>
          </div>
        ))}
      </div>

      {message ? <p className="mt-4 text-sm text-zinc-400">{message}</p> : null}
    </Panel>
  );
}
