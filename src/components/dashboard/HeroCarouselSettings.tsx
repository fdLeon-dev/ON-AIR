"use client";

import type { HeroCarouselSideConfig } from "@/types";

interface HeroCarouselSettingsProps {
  value: HeroCarouselSideConfig;
  onChange: (next: HeroCarouselSideConfig) => void;
}

export function HeroCarouselSettings({ value, onChange }: HeroCarouselSettingsProps) {
  return (
    <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-zinc-950/60 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-200">Configuracion del Carrusel</h3>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
            className="h-4 w-4"
          />
          Activar carrusel
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={value.autoplay}
            onChange={(event) => onChange({ ...value, autoplay: event.target.checked })}
            className="h-4 w-4"
          />
          Reproduccion automatica
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={value.infinite}
            onChange={(event) => onChange({ ...value, infinite: event.target.checked })}
            className="h-4 w-4"
          />
          Repeticion infinita
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={value.pauseOnHover}
            onChange={(event) => onChange({ ...value, pauseOnHover: event.target.checked })}
            className="h-4 w-4"
          />
          Pausar al pasar el mouse
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-zinc-300">
          <span className="block">Transicion</span>
          <select
            value={value.transition}
            onChange={(event) => onChange({ ...value, transition: event.target.value as "fade" | "slide" })}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white focus:border-emerald-400/50 focus:outline-none"
          >
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
          </select>
        </label>

        <label className="space-y-2 text-sm text-zinc-300">
          <span className="block">Duracion transicion (ms)</span>
          <input
            type="number"
            min={150}
            value={value.transitionDuration}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              onChange({ ...value, transitionDuration: Number.isFinite(parsed) ? Math.max(150, parsed) : 300 });
            }}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white focus:border-emerald-400/50 focus:outline-none"
          />
        </label>
      </div>

      <label className="mt-3 block space-y-2 text-sm text-zinc-300">
        <span className="block">Tiempo entre imagenes (ms)</span>
        <input
          type="number"
          min={1000}
          value={value.interval}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            onChange({ ...value, interval: Number.isFinite(parsed) ? Math.max(1000, parsed) : 4000 });
          }}
          className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white focus:border-emerald-400/50 focus:outline-none"
        />
      </label>
    </section>
  );
}