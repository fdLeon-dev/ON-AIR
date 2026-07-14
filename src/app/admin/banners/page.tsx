import { loadHeroConfig } from "@/lib/data/persistence";
import { HeroConfigManager } from "@/components/dashboard/hero-config-manager";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const heroConfig = await loadHeroConfig();

  return <HeroConfigManager initialConfig={heroConfig} />;
}
