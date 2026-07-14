"use client";

import type { HeroCarouselSideConfig } from "@/types";
import { HeroImageSlider } from "@/components/ecommerce/hero-image-slider";

interface HeroCarouselProps {
  config: HeroCarouselSideConfig;
  fallbackImage: string;
  label: string;
}

export function HeroCarousel({ config, fallbackImage, label }: HeroCarouselProps) {
  return <HeroImageSlider config={config} fallbackImage={fallbackImage} label={label} />;
}
