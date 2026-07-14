"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/dashboard-ui";
import type { HeroCarouselSideConfig, HeroConfig } from "@/types";

const MAX_IMAGES = 3;

interface HeroConfigManagerProps {
  initialConfig: HeroConfig;
}

function createCarouselState(config: HeroCarouselSideConfig) {
  return {
    ...config,
    images: Array.isArray(config.images) ? config.images.slice(0, MAX_IMAGES) : [],
    enabled: typeof config.enabled === "boolean" ? config.enabled : false,
    autoplay: typeof config.autoplay === "boolean" ? config.autoplay : true,
    infinite: typeof config.infinite === "boolean" ? config.infinite : true,
    pauseOnHover: typeof config.pauseOnHover === "boolean" ? config.pauseOnHover : true,
    transition: config.transition === "slide" ? "slide" : (config.transition === "fade" ? "fade" : "fade"),
    interval: Number.isFinite(config.interval) ? Math.max(100, config.interval) : 3000,
    transitionDuration: Number.isFinite(config.transitionDuration) ? Math.max(100, config.transitionDuration) : 300,
  } as HeroCarouselSideConfig;
}

function reorderImages(images: string[], fromIndex: number, toIndex: number) {
  const nextImages = [...images];
  const [moved] = nextImages.splice(fromIndex, 1);
  nextImages.splice(toIndex, 0, moved);
  return nextImages;
}

function clampImages(images: string[]) {
  return images.filter(Boolean).slice(0, MAX_IMAGES);
}

function HeroSliderConfig({
  title,
  config,
  onChange,
}: {
  title: string;
  config: HeroCarouselSideConfig;
  onChange: (next: HeroCarouselSideConfig) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const updateImages = (nextImages: string[]) => {
    onChange({ ...config, images: clampImages(nextImages) });
  };

  const imageCount = config.images.filter(Boolean).length;

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/80 p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-zinc-400">Gestiona hasta 3 imágenes y la configuración del carrusel.</p>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-zinc-300">{imageCount} / {MAX_IMAGES}</span>
      </div>

      <div className="space-y-4">
        {config.images.map((image, index) => (
          <div
            key={`image-item-${index}`}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex === null || dragIndex === index) return;
              updateImages(reorderImages(config.images, dragIndex, index));
              setDragIndex(null);
            }}
            className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-3xl bg-zinc-900">
                  {image ? (
                    <img src={image} alt={`${title} preview ${index + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">Sin imagen</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <label className="block text-sm text-zinc-300">Imagen {index + 1}</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(event) => {
                      const nextImages = [...config.images];
                      nextImages[index] = event.target.value;
                      updateImages(nextImages);
                    }}
                    placeholder="URL de imagen"
                    className="mt-2 w-full rounded-full border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:w-48">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const nextUrl = window.prompt("Reemplazar URL de imagen", image ?? "");
                    if (typeof nextUrl === "string") {
                      const nextImages = [...config.images];
                      nextImages[index] = nextUrl.trim();
                      updateImages(nextImages);
                    }
                  }}
                >
                  Reemplazar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const nextImages = [...config.images];
                    nextImages.splice(index, 1);
                    updateImages(nextImages);
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white">Agregar nueva imagen</p>
              <p className="text-sm text-zinc-400">Máximo 3 imágenes por lado.</p>
            </div>
            <Button
              onClick={() => {
                if (imageCount >= MAX_IMAGES) return;
                updateImages([...config.images, ""]);
              }}
              disabled={imageCount >= MAX_IMAGES}
            >
              Agregar imagen
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-full border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-white">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(event) => onChange({ ...config, enabled: event.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-black"
            />
            Activar carrusel
          </label>
          <label className="flex items-center gap-3 rounded-full border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-white">
            <input
              type="checkbox"
              checked={config.autoplay}
              onChange={(event) => onChange({ ...config, autoplay: event.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-black"
            />
            Reproducción automática
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-full border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-white">
            <input
              type="checkbox"
              checked={config.infinite}
              onChange={(event) => onChange({ ...config, infinite: event.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-black"
            />
            Repetición infinita
          </label>
          <label className="flex items-center gap-3 rounded-full border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-white">
            <input
              type="checkbox"
              checked={config.pauseOnHover}
              onChange={(event) => onChange({ ...config, pauseOnHover: event.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-black"
            />
            Pausar al pasar el mouse
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-zinc-300">
            Transición
            <select
              value={config.transition}
              onChange={(event) => onChange({ ...config, transition: event.target.value as "fade" | "slide" })}
              className="rounded-full border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-zinc-300">
            Duración de la transición (ms)
            <input
              type="number"
              min={100}
              value={config.transitionDuration}
              onChange={(event) => onChange({ ...config, transitionDuration: Math.max(100, Number(event.target.value)) })}
              className="rounded-full border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm text-zinc-300">
          Tiempo entre imágenes (ms)
          <input
            type="number"
            min={100}
            value={config.interval}
            onChange={(event) => onChange({ ...config, interval: Math.max(100, Number(event.target.value)) })}
            className="rounded-full border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none"
          />
        </label>
      </div>
    </div>
  );
}

export function HeroConfigManager({ initialConfig }: HeroConfigManagerProps) {
  const [config, setConfig] = useState<HeroConfig>({
    leftCarousel: createCarouselState(initialConfig.leftCarousel),
    rightCarousel: createCarouselState(initialConfig.rightCarousel),
  });
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const saveConfig = async () => {
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/hero-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const body = await response.json();
        setStatus(body?.error ?? "No se pudo guardar la configuración.");
      } else {
        setStatus("Configuración guardada correctamente.");
      }
    } catch {
      setStatus("No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Panel title="Configuración del Hero" description="Administra los carruseles izquierdo y derecho del hero principal.">
        <div className="grid gap-6 lg:grid-cols-2">
          <HeroSliderConfig
            title="Imagen Izquierda"
            config={config.leftCarousel}
            onChange={(next) => setConfig((current) => ({ ...current, leftCarousel: next }))}
          />
          <HeroSliderConfig
            title="Imagen Derecha"
            config={config.rightCarousel}
            onChange={(next) => setConfig((current) => ({ ...current, rightCarousel: next }))}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? "Guardando..." : "Guardar configuración"}
          </Button>
          {status ? <p className="text-sm text-zinc-400">{status}</p> : null}
        </div>
      </Panel>
    </div>
  );
}
