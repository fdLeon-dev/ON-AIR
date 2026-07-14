"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle2, ImageIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/dashboard-ui";
import type { HeroConfig } from "@/types";

interface BannersManagerProps {
  initialConfig: HeroConfig;
}

const FIELD_CLASSNAME = "w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30";
const SWITCH_CLASSNAME = "relative h-6 w-11 cursor-pointer rounded-full bg-white/15 transition after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all";

function isSupabaseBucketUrl(value: string) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    const isSupabaseHost = parsed.hostname.includes("supabase") && parsed.hostname.endsWith(".co");
    const isPublicObjectPath = parsed.pathname.includes("/storage/v1/object/public/");
    return isSupabaseHost && isPublicObjectPath;
  } catch {
    return false;
  }
}

export function BannersManager({ initialConfig }: BannersManagerProps) {
  const [config, setConfig] = useState(initialConfig);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const previewImages = useMemo(() => [config.hero1Url, config.hero2Url, config.hero3Url].filter(Boolean), [config.hero1Url, config.hero2Url, config.hero3Url]);

  const validate = (nextConfig: HeroConfig) => {
    const urls = [nextConfig.hero1Url, nextConfig.hero2Url, nextConfig.hero3Url].map((value) => value.trim());
    const nonEmpty = urls.filter(Boolean);
    if (nonEmpty.length === 0) {
      return "Debes completar al menos una URL de hero.";
    }

    for (const url of urls) {
      if (!url) continue;
      try {
        const parsed = new URL(url);
        if (!parsed.protocol.startsWith("http")) {
          return "La URL debe comenzar con http o https.";
        }
      } catch {
        return "La URL ingresada no es válida.";
      }
    }

    if (nonEmpty.some((url) => !isSupabaseBucketUrl(url))) {
      return "Todas las URLs deben pertenecer al bucket productos de Supabase Storage.";
    }

    const duplicates = new Set(urls.filter(Boolean));
    if (duplicates.size !== nonEmpty.length) {
      return "No pueden existir URLs duplicadas entre los tres heroes.";
    }

    return null;
  };

  const updateField = <K extends keyof HeroConfig>(field: K, value: HeroConfig[K]) => {
    setConfig((current) => ({ ...current, [field]: value }));
    setError(null);
    setMessage(null);
  };

  const save = async () => {
    const validationError = validate(config);
    if (validationError) {
      setError(validationError);
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "No se pudo guardar la configuración del Hero.");
      }

      setMessage("Configuración del Hero guardada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setSaving(false);
    }
  };

  const clearField = (field: "hero1Url" | "hero2Url" | "hero3Url") => {
    setConfig((current) => ({ ...current, [field]: "" }));
    setError(null);
    setMessage(null);
  };

  const renderUrlField = (label: string, field: "hero1Url" | "hero2Url" | "hero3Url", value: string) => (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">{label}</p>
        <button type="button" onClick={() => clearField(field)} className="text-sm text-zinc-400 transition hover:text-white">
          Limpiar
        </button>
      </div>
      <input
        value={value}
        onChange={(event) => updateField(field, event.target.value)}
        className={`${FIELD_CLASSNAME} mt-3`}
        placeholder="https://...supabase.co/storage/v1/object/public/productos/..."
      />
      <div className="mt-3 overflow-hidden rounded-[1rem] border border-white/10 bg-black/40">
        {value ? (
          <div className="relative aspect-[16/10] w-full">
            <Image src={value} alt={label} fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center text-sm text-zinc-500">
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8" />
              <span>Sin imagen cargada</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSwitch = (label: string, checked: boolean, onChange: (checked: boolean) => void) => (
    <label className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-sm text-zinc-300">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className="focus:outline-none">
        <span className={`${SWITCH_CLASSNAME} ${checked ? "bg-emerald-500/60 after:translate-x-5" : ""}`} />
      </button>
    </label>
  );

  return (
    <Panel title="Administrar Hero principal" description="Gestiona las imágenes del hero, el carrusel y su comportamiento desde Supabase Storage.">
      <div className="space-y-8">
        <section className="grid gap-4 xl:grid-cols-3">
          {renderUrlField("Hero 1", "hero1Url", config.hero1Url)}
          {renderUrlField("Hero 2", "hero2Url", config.hero2Url)}
          {renderUrlField("Hero 3", "hero3Url", config.hero3Url)}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Configuración del Hero</h3>
              <p className="mt-1 text-sm text-zinc-400">Controla cómo se reproduce el carrusel y qué comportamiento tiene el hero.</p>
            </div>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {renderSwitch("Activar carrusel", config.carouselEnabled, (checked) => updateField("carouselEnabled", checked))}
            {renderSwitch("Reproducción automática", config.autoplay, (checked) => updateField("autoplay", checked))}
            {renderSwitch("Pausar al pasar el mouse", config.pauseOnHover, (checked) => updateField("pauseOnHover", checked))}
            {renderSwitch("Repetición infinita", config.loop, (checked) => updateField("loop", checked))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="rounded-[1rem] border border-white/10 bg-white/5 p-4">
              <span className="mb-2 block text-sm text-zinc-300">Tiempo de cambio</span>
              <input
                type="number"
                min="2"
                max="20"
                value={config.transitionInterval}
                onChange={(event) => updateField("transitionInterval", Number(event.target.value))}
                className={FIELD_CLASSNAME}
              />
              <p className="mt-2 text-xs text-zinc-500">Segundos</p>
            </label>
            <label className="rounded-[1rem] border border-white/10 bg-white/5 p-4">
              <span className="mb-2 block text-sm text-zinc-300">Tipo de transición</span>
              <select
                value={config.transitionType}
                onChange={(event) => updateField("transitionType", event.target.value as HeroConfig["transitionType"])}
                className={FIELD_CLASSNAME}
              >
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
              </select>
            </label>
            <div className="rounded-[1rem] border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
              <p className="font-medium text-white">Vista previa</p>
              <p className="mt-2">{previewImages.length} hero{previewImages.length === 1 ? "" : "s"} listo{previewImages.length === 1 ? "" : "s"} para mostrar.</p>
            </div>
          </div>

          {message ? (
            <div className="mt-5 rounded-[1rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div>
          ) : null}
          {error ? (
            <div className="mt-5 rounded-[1rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
          ) : null}
        </section>
      </div>
    </Panel>
  );
}
