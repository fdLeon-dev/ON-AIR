"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { HeroCarouselSideConfig } from "@/types";

interface HeroImageSliderProps {
  config: HeroCarouselSideConfig;
  fallbackImage: string;
  label: string;
}

export function HeroImageSlider({ config, fallbackImage, label }: HeroImageSliderProps) {
  const images = useMemo(() => config.images.filter(Boolean).slice(0, 3), [config.images]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const visibleImages = images.length > 0 ? images : [fallbackImage];
  const isCarouselEnabled = config.enabled && visibleImages.length > 1;
  const activeImages = isCarouselEnabled ? visibleImages : [visibleImages[0]];

  useEffect(() => {
    if (!isCarouselEnabled || !config.autoplay) {
      return;
    }
    if (config.pauseOnHover && isHovered) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((current) => {
        const nextIndex = current + 1;
        if (nextIndex >= activeImages.length) {
          return config.infinite ? 0 : current;
        }
        return nextIndex;
      });
    }, config.interval);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeImages.length, config.autoplay, config.infinite, config.interval, config.pauseOnHover, config.enabled, isCarouselEnabled, isHovered]);

  useEffect(() => {
    setCurrentIndex((current) => Math.min(current, activeImages.length - 1));
  }, [activeImages.length]);

  return (
    <div
      className="relative min-h-[560px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950/70 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.35)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0">
        {config.transition === "slide" && isCarouselEnabled ? (
          <div className="relative h-full w-full overflow-hidden">
            <div
              className="flex h-full"
              style={{
                width: `${activeImages.length * 100}%`,
                transform: `translateX(-${(currentIndex / activeImages.length) * 100}%)`,
                transition: `transform ${config.transitionDuration}ms ease-in-out`,
              }}
            >
              {activeImages.map((src, index) => (
                <div key={`${src}-${index}`} className="relative flex-[0_0_100%] h-full">
                  <Image
                    src={src}
                    alt={`${label} hero image ${index + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="h-full w-full rounded-[2rem] object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full">
            {activeImages.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="absolute inset-0"
                style={{
                  opacity: index === currentIndex ? 1 : 0,
                  transition: `opacity ${config.transitionDuration}ms ease-in-out`,
                }}
              >
                <Image
                  src={src}
                  alt={`${label} hero image ${index + 1}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="h-full w-full rounded-[2rem] object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center text-xs uppercase tracking-[0.3em] text-white/40">
        {config.enabled ? "Carrusel activo" : "Imagen principal"}
      </div>

      {isCarouselEnabled ? (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {activeImages.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-2.5 w-2.5 rounded-full transition ${index === currentIndex ? "bg-white" : "bg-white/25 hover:bg-white/40"}`}
              aria-label={`Ir a la imagen ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
