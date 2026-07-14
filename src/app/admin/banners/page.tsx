import { loadHeroConfig } from "@/lib/data/persistence";
import { BannersManager } from "@/components/dashboard/banners-manager";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const heroConfig = await loadHeroConfig();
  return <BannersManager initialConfig={heroConfig} />;
}
