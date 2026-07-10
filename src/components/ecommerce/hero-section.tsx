"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HeroConfig } from "@/types";

interface HeroSectionProps {
  heroConfig: HeroConfig;
}

const IMAGE_TRANSITION_MS = 700;

function normalizeVisibleImages(images: string[]) {
  return images.filter(Boolean).slice(0, 3);
}

export function HeroSection({ heroConfig }: HeroSectionProps) {
  const [index, setIndex] = useState(0);
  const visibleLeftImages = useMemo(() => normalizeVisibleImages(heroConfig.leftCardImages), [heroConfig.leftCardImages]);
  const visibleRightImages = useMemo(() => normalizeVisibleImages(heroConfig.rightCardImages), [heroConfig.rightCardImages]);

  useEffect(() => {
    if (!heroConfig.carouselEnabled) {
      setIndex(0);
      return;
    }

    const activeLength = Math.max(1, Math.max(visibleLeftImages.length, visibleRightImages.length));
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % activeLength);
    }, heroConfig.transitionMs);

    return () => window.clearInterval(interval);
  }, [heroConfig.carouselEnabled, heroConfig.transitionMs, visibleLeftImages.length, visibleRightImages.length]);

  const leftImages = heroConfig.carouselEnabled ? visibleLeftImages : [visibleLeftImages[0] ?? "/peak.png"];
  const rightImages = heroConfig.carouselEnabled ? visibleRightImages : [visibleRightImages[0] ?? "/peak.png"];

  const renderCard = (images: string[], label: string) => (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950/70 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.35)] min-h-[560px]">
      {images.map((src, imageIndex) => (
        <div
          key={src || imageIndex}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: imageIndex === index ? 1 : 0 }}
        >
          <Image
            src={src || "/peak.png"}
            alt={`${label} card image ${imageIndex + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="h-full w-full rounded-[2rem] object-cover"
            loading={imageIndex === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center text-xs uppercase tracking-[0.3em] text-white/40">
        {heroConfig.carouselEnabled ? "Carrusel activo" : "Imagen principal"}
      </div>
    </div>
  );

  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.04),_transparent_45%)] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-300 backdrop-blur">
                Nueva colección 2026 · Diseño técnico premium
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Envios en 24hs · Cuotas sin interés
              </div>
            </div>

            {renderCard(leftImages, "left")}

            <p className="max-w-xl text-lg leading-8 text-zinc-400 sm:text-xl">
              Ropa deportiva que combina tecnología, minimalismo y un lenguaje visual urbano para quienes exigen más.
            </p>
          </div>

          <div>{renderCard(rightImages, "right")}</div>
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-4 lg:gap-6">
          <Button variant="primary" size="lg" asChild>
            <Link href="/catalog">Comprar ahora <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/promotions">Ver colección</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-7xl justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm uppercase tracking-[0.3em]">Scroll</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
