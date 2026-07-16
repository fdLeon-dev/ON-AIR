"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroCarousel } from "@/components/ecommerce/hero-carousel";
import type { HeroConfig } from "@/types";

interface HeroSectionProps {
  heroConfig: HeroConfig;
}

export function HeroSection({ heroConfig }: HeroSectionProps) {
  const leftFallback = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80";
  const rightFallback = "https://images.unsplash.com/photo-1518459031867-a89b944bffe4?auto=format&fit=crop&w=1200&q=80";

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

            <HeroCarousel config={heroConfig.leftCarousel} fallbackImage={leftFallback} label="Izquierda" />

            <p className="max-w-xl text-lg leading-8 text-zinc-400 sm:text-xl">
              Ropa deportiva que combina tecnología, minimalismo y un lenguaje visual urbano para quienes exigen más.
            </p>
          </div>

          <HeroCarousel config={heroConfig.rightCarousel} fallbackImage={rightFallback} label="Derecha" />
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-4 lg:gap-6">
          <Button variant="primary" size="lg" asChild>
            <Link href="/catalog">Comprar ahora</Link>
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
