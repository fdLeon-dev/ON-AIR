"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/dashboard/dashboard-ui";
import { HeroCarouselSettings } from "@/components/dashboard/HeroCarouselSettings";
import { HeroImageCard } from "@/components/dashboard/HeroImageCard";
import { ImagePickerModal } from "@/components/dashboard/ImagePickerModal";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { HeroCarouselSideConfig, HeroConfig } from "@/types";

const MAX_IMAGES = 3;
const STORAGE_BUCKET = "productos";
const STORAGE_PREFIX = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

interface HeroEditorProps {
  initialConfig: HeroConfig;
}

type HeroSide = "left" | "right";

function ensureThreeImages(images: string[] | undefined) {
  const next = Array.isArray(images) ? [...images] : [];
  while (next.length < MAX_IMAGES) {
    next.push("");
  }
  return next.slice(0, MAX_IMAGES);
}

function toRelativeStoragePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const markerIndex = url.pathname.indexOf(STORAGE_PREFIX);
      if (markerIndex >= 0) {
        return decodeURIComponent(url.pathname.slice(markerIndex + STORAGE_PREFIX.length)).replace(/^\/+/, "");
      }
    } catch {
      return trimmed;
    }
  }

  if (trimmed.startsWith(`${STORAGE_BUCKET}/`)) {
    return trimmed.slice(STORAGE_BUCKET.length + 1);
  }

  return trimmed.replace(/^\/+/, "");
}

function createCarouselState(config: HeroCarouselSideConfig): HeroCarouselSideConfig {
  return {
    ...config,
    images: ensureThreeImages(config.images).map(toRelativeStoragePath),
    enabled: typeof config.enabled === "boolean" ? config.enabled : false,
    autoplay: typeof config.autoplay === "boolean" ? config.autoplay : true,
    infinite: typeof config.infinite === "boolean" ? config.infinite : true,
    pauseOnHover: typeof config.pauseOnHover === "boolean" ? config.pauseOnHover : true,
    transition: config.transition === "slide" ? "slide" : "fade",
    interval: Number.isFinite(config.interval) ? Math.max(1000, config.interval) : 4000,
    transitionDuration: Number.isFinite(config.transitionDuration) ? Math.max(150, config.transitionDuration) : 300,
  };
}

function normalizePayload(config: HeroConfig): HeroConfig {
  const normalizeSide = (side: HeroCarouselSideConfig): HeroCarouselSideConfig => ({
    ...side,
    images: ensureThreeImages(side.images).map(toRelativeStoragePath),
    interval: Math.max(1000, Number(side.interval) || 4000),
    transitionDuration: Math.max(150, Number(side.transitionDuration) || 300),
  });

  return {
    leftCarousel: normalizeSide(config.leftCarousel),
    rightCarousel: normalizeSide(config.rightCarousel),
  };
}

function createPreviewUrl(path: string, supabase: ReturnType<typeof createClient>) {
  const normalized = toRelativeStoragePath(path);
  if (!normalized) return null;
  if (/^https?:\/\//i.test(path.trim())) return path.trim();
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(normalized);
  return data.publicUrl;
}

function HeroSideEditor({
  side,
  config,
  onChange,
  onOpenPicker,
}: {
  side: HeroSide;
  config: HeroCarouselSideConfig;
  onChange: (next: HeroCarouselSideConfig) => void;
  onOpenPicker: (index: number) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const sideLabel = side === "left" ? "Izquierda" : "Derecha";

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-zinc-950/80 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Hero {sideLabel}</h2>
        <p className="mt-1 text-sm text-zinc-400">Administra las 3 posiciones fijas de este lado del hero.</p>
      </div>

      <div className="grid gap-4">
        {ensureThreeImages(config.images).map((imagePath, index) => (
          <HeroImageCard
            key={`${side}-${index}`}
            index={index}
            value={imagePath}
            previewUrl={createPreviewUrl(imagePath, supabase)}
            onChange={(nextValue) => {
              const nextImages = ensureThreeImages(config.images);
              nextImages[index] = toRelativeStoragePath(nextValue);
              onChange({ ...config, images: nextImages });
            }}
            onPick={() => onOpenPicker(index)}
            onClear={() => {
              const nextImages = ensureThreeImages(config.images);
              nextImages[index] = "";
              onChange({ ...config, images: nextImages });
            }}
          />
        ))}
      </div>

      <HeroCarouselSettings value={config} onChange={onChange} />
    </section>
  );
}

export function HeroEditor({ initialConfig }: HeroEditorProps) {
  const [config, setConfig] = useState<HeroConfig>({
    leftCarousel: createCarouselState(initialConfig.leftCarousel),
    rightCarousel: createCarouselState(initialConfig.rightCarousel),
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pickerState, setPickerState] = useState<{ side: HeroSide; index: number } | null>(null);

  const saveConfig = async () => {
    setSaving(true);
    setStatus(null);

    const payload = normalizePayload(config);

    if (payload.leftCarousel.enabled && !payload.leftCarousel.images.some(Boolean)) {
      setStatus({ message: "El carrusel izquierdo esta activo pero no tiene imagenes.", type: "error" });
      setSaving(false);
      return;
    }

    if (payload.rightCarousel.enabled && !payload.rightCarousel.images.some(Boolean)) {
      setStatus({ message: "El carrusel derecho esta activo pero no tiene imagenes.", type: "error" });
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/hero-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setStatus({ message: body.error ?? "No se pudo guardar la configuracion.", type: "error" });
      } else {
        setConfig(payload);
        setStatus({ message: "Configuracion guardada correctamente.", type: "success" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la configuracion.";
      setStatus({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const setSideConfig = (side: HeroSide, nextSide: HeroCarouselSideConfig) => {
    setConfig((current) => ({
      ...current,
      [side === "left" ? "leftCarousel" : "rightCarousel"]: nextSide,
    }));
  };

  const handleImageSelected = (path: string) => {
    if (!pickerState) return;
    const nextPath = toRelativeStoragePath(path);
    const sideKey = pickerState.side === "left" ? "leftCarousel" : "rightCarousel";

    setConfig((current) => {
      const sideConfig = current[sideKey];
      const nextImages = ensureThreeImages(sideConfig.images);
      nextImages[pickerState.index] = nextPath;
      return {
        ...current,
        [sideKey]: { ...sideConfig, images: nextImages },
      };
    });
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Administrador del Hero"
        description="Panel rapido para gestionar imagenes y comportamiento del carrusel en ambos lados del hero."
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <HeroSideEditor
            side="left"
            config={config.leftCarousel}
            onChange={(next) => setSideConfig("left", next)}
            onOpenPicker={(index) => setPickerState({ side: "left", index })}
          />

          <HeroSideEditor
            side="right"
            config={config.rightCarousel}
            onChange={(next) => setSideConfig("right", next)}
            onOpenPicker={(index) => setPickerState({ side: "right", index })}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="primary" onClick={saveConfig} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
          {status ? <p className={`text-sm ${status.type === "success" ? "text-emerald-400" : "text-red-400"}`}>{status.message}</p> : null}
        </div>
      </Panel>

      <ImagePickerModal
        open={Boolean(pickerState)}
        onClose={() => setPickerState(null)}
        onSelect={handleImageSelected}
      />
    </div>
  );
}