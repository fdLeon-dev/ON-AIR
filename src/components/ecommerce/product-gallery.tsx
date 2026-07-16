"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { resolveProductImageUrl } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[] | undefined;
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [isZoomed, setIsZoomed] = useState(false);

  const galleryImages = useMemo(() => {
    const fallbackImage =
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80";
    const validImages = (images ?? []).map((image) => resolveProductImageUrl(image ?? "")).filter(Boolean);
    const result = validImages.length ? [...validImages] : [fallbackImage];

    while (result.length < 4) {
      result.push(result[result.length - 1]);
    }

    return result.slice(0, 4);
  }, [images]);

  const mainImage = galleryImages[selected] ?? galleryImages[0];

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
    setZoomOrigin(`${x}% ${y}%`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
      <div className="grid gap-4">
        {galleryImages.slice(0, 3).map((image, index) => {
          const isActive = index === selected;
          return (
            <button
              type="button"
              key={`thumb-${index}-${image}`}
              onClick={() => setSelected(index)}
              onMouseEnter={() => setSelected(index)}
              className={`overflow-hidden rounded-[1.5rem] border transition duration-300 ${isActive ? "border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" : "border-white/10 hover:border-white/20"}`}
            >
              <div className="relative h-32 w-full sm:h-36">
                <Image
                  src={image}
                  alt={`${name} miniatura ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 20vw"
                  className="object-cover transition duration-500 hover:scale-110"
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-900">
        <div
          className="relative h-[520px] overflow-hidden"
          onPointerEnter={() => setIsZoomed(true)}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setIsZoomed(false)}
        >
          <Image
            src={mainImage}
            alt={`${name} imagen principal`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-cover transition duration-300 ${isZoomed ? "scale-[1.95]" : "scale-100"}`}
            style={{ transformOrigin: zoomOrigin } as CSSProperties}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      </div>
    </div>
  );
}
