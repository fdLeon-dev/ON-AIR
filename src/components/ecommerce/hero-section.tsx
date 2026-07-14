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

function getVisibleImages(heroConfig: HeroConfig) {
  return [heroConfig.hero1Url, heroConfig.hero2Url, heroConfig.hero3Url].filter(Boolean);
}

export function HeroSection({ heroConfig }: HeroSectionProps) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const images = useMemo(() => getVisibleImages(heroConfig), [heroConfig.hero1Url, heroConfig.hero2Url, heroConfig.hero3Url]);

  const leftImage = heroConfig.hero1Url || images[0] || "/peak.png";
  const rightImage = heroConfig.hero2Url || heroConfig.hero1Url || images[0] || "/peak.png";

  useEffect(() => {
    if (!heroConfig.carouselEnabled || !heroConfig.autoplay || images.length <= 1 || (heroConfig.pauseOnHover && isHovered)) {
      return;
    }

    const interval = window.setInterval(() => {
      setIndex((current) => {
        if (current >= images.length - 1) {
          return heroConfig.loop ? 0 : current;
        }
        return current + 1;
      });
    }, heroConfig.transitionInterval * 1000);

    return () => window.clearInterval(interval);
  }, [heroConfig.autoplay, heroConfig.carouselEnabled, heroConfig.loop, heroConfig.pauseOnHover, heroConfig.transitionInterval, images.length, isHovered]);

  useEffect(() => {
    if (!heroConfig.carouselEnabled || images.length === 0) {
      setIndex(0);
      return;
    }
    setIndex((current) => Math.min(current, images.length - 1));
  }, [heroConfig.carouselEnabled, images.length]);

  const renderCard = (label: string, imageSrc: string) => (
    <div
      className="relative min-h-[560px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950/70 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.35)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{ opacity: 1, transform: heroConfig.transitionType === "slide" ? "translateX(0)" : "translateX(0)" }}
      >
        <Image
          src={imageSrc || "/peak.png"}
          alt={`${label} image`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="h-full w-full rounded-[2rem] object-cover"
          priority
        />
      </div>
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

            {renderCard("left", leftImage)}

            <p className="max-w-xl text-lg leading-8 text-zinc-400 sm:text-xl">
              Ropa deportiva que combina tecnología, minimalismo y un lenguaje visual urbano para quienes exigen más.
            </p>
          </div>

          <div>{renderCard("right", rightImage)}</div>
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
