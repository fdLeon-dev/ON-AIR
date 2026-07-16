"use client";

import { Button } from "@/components/ui/button";

interface HeroImageCardProps {
  index: number;
  value: string;
  previewUrl: string | null;
  onChange: (value: string) => void;
  onPick: () => void;
  onClear: () => void;
}

export function HeroImageCard({ index, value, previewUrl, onChange, onPick, onClear }: HeroImageCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-zinc-950/60 p-5">
      <p className="text-sm font-semibold text-white">Imagen {index + 1}</p>

      <div className="mt-4 flex h-[90px] w-[160px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
        {previewUrl ? (
          <img src={previewUrl} alt={`Vista previa imagen ${index + 1}`} className="h-full w-full object-cover" />
        ) : (
          <span className="px-3 text-xs text-zinc-500">Sin imagen</span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <label className="block text-xs uppercase tracking-[0.2em] text-zinc-400">Path</label>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="hero/banner1.webp"
          className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-400/50 focus:outline-none"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onPick}>
          Seleccionar del bucket
        </Button>
        <Button variant="secondary" size="sm" onClick={onClear}>
          Eliminar
        </Button>
      </div>
    </article>
  );
}