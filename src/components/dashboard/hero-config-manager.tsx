"use client";

import { HeroEditor } from "@/components/dashboard/HeroEditor";
import type { HeroConfig } from "@/types";

interface HeroConfigManagerProps {
  initialConfig: HeroConfig;
}

export function HeroConfigManager({ initialConfig }: HeroConfigManagerProps) {
  return <HeroEditor initialConfig={initialConfig} />;
}
