"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type BucketImage = {
  path: string;
  name: string;
  publicUrl: string;
};

interface ImagePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

export function ImagePickerModal({ open, onClose, onSelect }: ImagePickerModalProps) {
  const [items, setItems] = useState<BucketImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/storage/productos-images", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body?.error ?? "No se pudieron cargar las imagenes del bucket.");
        }

        const body = (await response.json()) as { images?: BucketImage[] };
        if (!cancelled) {
          setItems(Array.isArray(body.images) ? body.images : []);
        }
      } catch (fetchError) {
        if (!cancelled) {
          const message = fetchError instanceof Error ? fetchError.message : "No se pudieron cargar las imagenes del bucket.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;
    return items.filter((item) => item.path.toLowerCase().includes(normalizedQuery));
  }, [items, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-5xl rounded-[1.75rem] border border-white/10 bg-[#090d1f] p-5 shadow-[0_20px_90px_rgba(0,0,0,0.55)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Seleccionar del bucket productos</h2>
            <p className="mt-1 text-sm text-zinc-400">Selecciona una imagen existente para completar el path.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o carpeta..."
            className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-400/50 focus:outline-none"
          />
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
          {loading ? <p className="text-sm text-zinc-400">Cargando imagenes...</p> : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          {!loading && !error ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    onSelect(item.path);
                    onClose();
                  }}
                  className="rounded-xl border border-white/10 bg-black/30 p-3 text-left transition hover:border-emerald-400/40 hover:bg-black/50"
                >
                  <div className="h-[90px] w-[160px] overflow-hidden rounded-lg border border-white/10 bg-black/40">
                    <img src={item.publicUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-300">{item.path}</p>
                </button>
              ))}

              {!filtered.length ? <p className="text-sm text-zinc-500">No se encontraron imagenes.</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}