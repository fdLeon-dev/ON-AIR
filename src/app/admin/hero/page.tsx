"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { HeroConfig } from "@/types";

const defaultHeroConfig: HeroConfig = {
  leftCardImages: ["/peak.png", "", ""],
  rightCardImages: ["/peak.png", "", ""],
  carouselEnabled: false,
  transitionMs: 3000,
};

function ImageField({
  card,
  index,
  url,
  onUpload,
  onRemove,
  onSetUrl,
}: {
  card: "left" | "right";
  index: number;
  url: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
  onSetUrl: (url: string) => void;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-400">Imagen {index + 1}</p>
        {url ? (
          <button type="button" className="text-sm text-red-300 hover:text-red-100" onClick={onRemove}>
            Eliminar
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3">
        <label className="block text-sm text-zinc-400">Previsualización</label>
        {url ? (
          <Image
            src={url}
            alt={`Hero ${card} image ${index + 1}`}
            width={640}
            height={480}
            className="h-40 w-full rounded-[1.5rem] object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 text-sm text-zinc-500">
            Sin imagen
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            await onUpload(file);
          }}
          className="text-sm"
        />
        <input
          type="url"
          placeholder="Pegar URL pública de Supabase (bucket productos)"
          value={url}
          onChange={(e) => onSetUrl(e.target.value)}
          className="mt-2 w-full rounded-full border border-white/10 bg-black/80 px-3 py-2 text-sm text-white"
        />
      </div>
    </div>
  );
}

export default function AdminHeroPage() {
  const [config, setConfig] = useState<HeroConfig>(defaultHeroConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/hero", { cache: "no-store", credentials: "include" })
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => setError("No se pudo cargar la configuración."))
      .finally(() => setLoading(false));
  }, []);

  const uploadImage = async (card: "left" | "right", index: number, file: File) => {
    const supabase = createClient();
    const safeName = `hero/${card}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-]/gi, "_")}`;
    const { error } = await supabase.storage.from("productos").upload(safeName, file, { upsert: true });
    if (error) {
      setError(error.message);
      return;
    }

    const { data } = supabase.storage.from("productos").getPublicUrl(safeName);
    const url = data.publicUrl;

    setConfig((current) => {
      const next = { ...current };
      const images = card === "left" ? [...next.leftCardImages] : [...next.rightCardImages];
      images[index] = url;
      if (card === "left") next.leftCardImages = images;
      else next.rightCardImages = images;
      return next;
    });
  };

  const removeImage = (card: "left" | "right", index: number) => {
    setConfig((current) => {
      const next = { ...current };
      const images = card === "left" ? [...next.leftCardImages] : [...next.rightCardImages];
      images[index] = "";
      if (card === "left") next.leftCardImages = images;
      else next.rightCardImages = images;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/hero", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "No se pudo guardar la configuración.");
      } else {
        setConfig(payload ?? config);
      }
    } catch {
      setError("No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Hero</p>
          <h1 className="text-3xl font-semibold">Hero Images</h1>
          <p className="mt-2 text-sm text-zinc-400">Administra las imágenes y configuración del hero principal.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Carrusel automático</h2>
            <p className="mt-2 text-sm text-zinc-400">Activa o desactiva el cambio automático de imágenes para los cards.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={config.carouselEnabled}
              onChange={(event) => setConfig((current) => ({ ...current, carouselEnabled: event.target.checked }))}
              className="h-5 w-5 rounded border border-white/10 bg-zinc-950/80 text-white accent-white"
            />
            <span className="text-sm text-zinc-300">Activar carrusel automático</span>
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950/70 p-4">
            <p className="text-sm text-zinc-400">Tiempo entre imágenes (ms)</p>
            <input
              type="number"
              min={500}
              value={config.transitionMs}
              onChange={(event) => setConfig((current) => ({ ...current, transitionMs: Number(event.target.value) }))}
              className="mt-3 w-full rounded-full border border-white/10 bg-black/80 px-4 py-3 text-sm text-white"
            />
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950/70 p-4">
            <p className="text-sm text-zinc-400">Vista rápida</p>
            <p className="mt-3 text-sm text-zinc-300">Cuando el carrusel está activo, cada card rotará entre sus 3 imágenes con una transición suave.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
            <h2 className="text-lg font-semibold">Card izquierdo</h2>
          </div>
          {config.leftCardImages.map((url, index) => (
            <ImageField
              key={index}
              card="left"
              index={index}
              url={url}
              onUpload={(file) => uploadImage("left", index, file)}
              onRemove={() => removeImage("left", index)}
              onSetUrl={(u) => setConfig((current) => {
                const next = { ...current };
                const images = [...next.leftCardImages];
                images[index] = u;
                next.leftCardImages = images;
                return next;
              })}
            />
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
            <h2 className="text-lg font-semibold">Card derecho</h2>
          </div>
          {config.rightCardImages.map((url, index) => (
            <ImageField
              key={index}
              card="right"
              index={index}
              url={url}
              onUpload={(file) => uploadImage("right", index, file)}
              onRemove={() => removeImage("right", index)}
              onSetUrl={(u) => setConfig((current) => {
                const next = { ...current };
                const images = [...next.rightCardImages];
                images[index] = u;
                next.rightCardImages = images;
                return next;
              })}
            />
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {loading ? <p className="text-sm text-zinc-400">Cargando configuración...</p> : null}
    </div>
  );
}
